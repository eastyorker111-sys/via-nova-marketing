import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {importGmailReply,replayPendingReply,collectGmailReplyPage} from '../operations/enquiries/gmail-replies.mjs';
import {matchPendingReply,gmailKey} from '../operations/enquiries/gmail-pending.mjs';
const eid='00000000-0000-4000-8000-000000000001',second='00000000-0000-4000-8000-000000000002';
const config={enabled:true,authorizedMailbox:'east.yorker111@gmail.com',verifiedRecipient:'hello@vianovamarketing.ca',allowTests:true};
const owner={verified:true,email:config.authorizedMailbox};
const msg=()=>({id:'message1',threadId:'thread1',internalDate:'1793707200000',labelIds:['INBOX'],payload:{mimeType:'text/plain',headers:[{name:'From',value:'client@example.invalid'},{name:'To',value:config.verifiedRecipient},{name:'Subject',value:'A later reply without a reference'}],body:{data:Buffer.from('TEST ONLY PRIVATE BODY - must stay absent from pending metadata').toString('base64url')}}});
function open(path=':memory:'){
 const db=new DatabaseSync(path);
 for(const file of ['schema.sql','gmail-pending-schema.sql'])db.exec(readFileSync(new URL('../operations/enquiries/'+file,import.meta.url),'utf8'));
 for(const id of [eid,second])db.prepare('INSERT OR IGNORE INTO enquiries(id,payload_hash,received_at,form_kind,name,email,business,message,is_test,owner_notes) VALUES (?,?,?,?,?,?,?,?,?,?)').run(id,'x','2026-11-03','quick','TEST ONLY','client@example.invalid','','Original enquiry',1,'Protected owner notes');
 const DB={prepare(sql){return{bind(...p){return{first:async()=>db.prepare(sql).get(...p),all:async()=>({results:db.prepare(sql).all(...p)}),run:async()=>db.prepare(sql).run(...p)}}}},async batch(statements){db.exec('BEGIN');try{const results=[];for(const s of statements)results.push(await s.run());db.exec('COMMIT');return results;}catch(e){db.exec('ROLLBACK');throw e;}}};
 return{db,env:{DB}};
}
const row=db=>db.prepare('SELECT * FROM gmail_pending_replies').get();
const match=(db,env,extra={},actor=owner)=>matchPendingReply(env,config,{messageId:'message1',enquiryId:eid,revision:row(db).revision,confirmMarketing:true,evidenceReference:'TEST ONLY owner reviewed private source',...extra},actor);
const reader={account:async()=>config.authorizedMailbox,get:async()=>msg()};
test('unassigned metadata survives a real database restart; owner match and replay store exactly once',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'vnm-reply-test-')),path=join(dir,'disposable.sqlite');let state=open(path);
 try{
  const pending=await importGmailReply(msg(),state.env,config);assert.equal(pending.durablePending,true);assert.equal(row(state.db).classification,'unassigned');assert.equal(row(state.db).state,'needs_review');
  const metadata=JSON.stringify(row(state.db));for(const secret of ['PRIVATE BODY','client@example.invalid','A later reply'])assert.equal(metadata.includes(secret),false);
  state.db.close();state=open(path);
  const revision=row(state.db).revision;assert.equal((await match(state.db,state.env)).state,'matched');assert.equal((await match(state.db,state.env,{revision})).state,'conflict');
  state.db.close();state=open(path);
  assert.equal((await replayPendingReply(reader,state.env,config,'message1')).stored,true);
  assert.equal((await replayPendingReply(reader,state.env,config,'message1')).stored,true);
  assert.equal(state.db.prepare('SELECT COUNT(*) n FROM communication_messages').get().n,1);assert.equal(row(state.db).state,'imported');
  const audit=state.db.prepare('SELECT * FROM gmail_reply_match_audit').get();assert.equal(audit.actor,owner.email);assert.equal(audit.previous_enquiry_id,null);assert.equal(audit.next_enquiry_id,eid);
  assert.equal((await match(state.db,state.env,{enquiryId:second})).state,'conflict');assert.equal(state.db.prepare('SELECT owner_notes FROM enquiries LIMIT 1').get().owner_notes,'Protected owner notes');
 }finally{state.db.close();rmSync(dir,{recursive:true,force:true});}
});
test('matching requires authenticated owner, explicit evidence, same business and test category',async()=>{
 const {db,env}=open();try{
  await importGmailReply(msg(),env,config);
  assert.equal((await match(db,env,{},{})).reason,'owner_authorization_required');
  assert.equal((await match(db,env,{confirmMarketing:false})).reason,'explicit_match_and_evidence_required');
  assert.equal((await match(db,env,{enquiryId:'00000000-0000-4000-8000-000000000099'})).reason,'business_or_test_boundary');
  db.prepare('UPDATE enquiries SET is_test=0 WHERE id=?').run(second);assert.equal((await match(db,env,{enquiryId:second})).reason,'business_or_test_boundary');
  assert.equal(db.prepare('SELECT COUNT(*) n FROM gmail_reply_match_audit').get().n,0);
 }finally{db.close();}
});
test('owner matching cannot import unrelated participants, foreign references or changed source bodies',async()=>{
 const {db,env}=open();try{
  const other=msg();other.payload.headers[0].value='other@example.invalid';await importGmailReply(other,env,config);await match(db,env);
  assert.equal((await replayPendingReply({...reader,get:async()=>other},env,config,'message1')).reason,'unverified_participant');
  assert.equal((await replayPendingReply(reader,env,config,'message1')).reason,'pending_or_storage_not_confirmed');
  assert.equal(db.prepare('SELECT COUNT(*) n FROM communication_messages').get().n,0);
  assert.equal(row(db).classification,'marketing');
 }finally{db.close();}
});
test('audit and owner mapping roll back together when the second statement fails',async()=>{
 const {db,env}=open();try{
  await importGmailReply(msg(),env,config);const before=row(db);
  db.exec("CREATE TRIGGER fail_owner_match BEFORE UPDATE ON gmail_pending_replies WHEN NEW.state='matched' BEGIN SELECT RAISE(ABORT,'test failure'); END;");
  await assert.rejects(()=>match(db,env));assert.equal(row(db).enquiry_id,null);assert.equal(row(db).revision,before.revision);assert.equal(db.prepare('SELECT COUNT(*) n FROM gmail_reply_match_audit').get().n,0);
 }finally{db.close();}
});
test('lost acknowledgement after message storage recovers without duplicate or unsafe reassignment',async()=>{
 const {db,env}=open();try{
  await importGmailReply(msg(),env,config);await match(db,env);
  db.exec("CREATE TRIGGER fail_receipt BEFORE UPDATE ON gmail_pending_replies WHEN NEW.state='imported' BEGIN SELECT RAISE(ABORT,'test lost receipt'); END;");
  assert.equal((await replayPendingReply(reader,env,config,'message1')).stored,false);assert.equal(db.prepare('SELECT COUNT(*) n FROM communication_messages').get().n,1);
  assert.equal((await match(db,env,{enquiryId:second})).state,'conflict');
  db.exec('DROP TRIGGER fail_receipt');assert.equal((await replayPendingReply(reader,env,config,'message1')).stored,true);assert.equal(row(db).state,'imported');assert.equal(db.prepare('SELECT COUNT(*) n FROM communication_messages').get().n,1);
 }finally{db.close();}
});
test('provider-read failures create only minimal durable references and recover on later replay',async()=>{
 const {db,env}=open();try{
  const failedReader={account:reader.account,list:async()=>({messages:[{id:'message1'}]}),get:async()=>{throw Error('private failure')}};
  const page=await collectGmailReplyPage(failedReader,env,config);assert.equal(page.advanceAllowed,true);assert.equal(page.results[0].durablePending,true);assert.equal(row(db).message_hash,null);assert.equal(row(db).provider_key,gmailKey(config.authorizedMailbox,'message1'));
  assert.equal((await replayPendingReply(reader,env,config,'message1')).reason,'unassigned_reference');assert.ok(row(db).message_hash);
  await match(db,env);assert.equal((await replayPendingReply(reader,env,config,'message1')).stored,true);
 }finally{db.close();}
});
test('saved page cursor survives restart; failed pending storage never advances discovery',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'vnm-cursor-test-')),path=join(dir,'disposable.sqlite');let state=open(path);
 try{
  const pageReader={...reader,list:async args=>{assert.equal(args.pageToken,undefined);return{messages:[{id:'message1'}],nextPageToken:'page-two'}}};
  assert.equal((await collectGmailReplyPage(pageReader,state.env,config)).advanceAllowed,true);
  state.db.close();state=open(path);
  pageReader.list=async args=>{assert.equal(args.pageToken,'page-two');return{messages:[{id:'message2'}],nextPageToken:'page-three'}};
  pageReader.get=async()=>({...msg(),id:'message2'});
  state.db.exec("CREATE TRIGGER fail_pending BEFORE INSERT ON gmail_pending_replies BEGIN SELECT RAISE(ABORT,'test pending failure'); END;");
  assert.equal((await collectGmailReplyPage(pageReader,state.env,config)).advanceAllowed,false);
  assert.equal(state.db.prepare('SELECT page_token FROM gmail_reply_cursor').get().page_token,'page-two');
  state.db.exec('DROP TRIGGER fail_pending');assert.equal((await collectGmailReplyPage(pageReader,state.env,config)).advanceAllowed,true);
  assert.equal(state.db.prepare('SELECT COUNT(*) n FROM gmail_pending_replies').get().n,2);
 }finally{state.db.close();rmSync(dir,{recursive:true,force:true});}
});
