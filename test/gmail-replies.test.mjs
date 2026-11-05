import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {importGmailReply,collectGmailReplyPage} from '../operations/enquiries/gmail-replies.mjs';
const id='00000000-0000-4000-8000-000000000001';
const config={enabled:true,authorizedMailbox:'east.yorker111@gmail.com',verifiedRecipient:'vianovamarketing@outlook.com',allowTests:true};
function setup(){
 const db=new DatabaseSync(':memory:');db.exec(readFileSync(new URL('../operations/enquiries/schema.sql',import.meta.url),'utf8'));db.exec(readFileSync(new URL('../operations/enquiries/gmail-pending-schema.sql',import.meta.url),'utf8'));
 db.prepare('INSERT INTO enquiries(id,payload_hash,received_at,form_kind,name,email,business,message,is_test,owner_notes) VALUES (?,?,?,?,?,?,?,?,?,?)').run(id,'test','2026-11-03T12:00:00Z','quick','TEST ONLY','client@example.invalid','','Original request',1,'Preserve these owner notes');
 const env={DB:{prepare(sql){return{bind(...args){return{first:async()=>db.prepare(sql).get(...args),all:async()=>({results:db.prepare(sql).all(...args)}),run:async()=>db.prepare(sql).run(...args)}}}}}};return {db,env};
}
function message(mid='abc123',subject=`Re: [VNM:${id}]`){return{id:mid,threadId:'thread1',internalDate:'1793707200000',labelIds:['INBOX'],payload:{mimeType:'text/plain',headers:[{name:'From',value:'Customer <client@example.invalid>'},{name:'To',value:'vianovamarketing@outlook.com'},{name:'Subject',value:subject}],body:{data:Buffer.from('TEST ONLY later customer reply').toString('base64url')}}};}
test('disabled reader never reads Gmail or writes storage; wrong configured account fails closed',async()=>{
 const {db,env}=setup();try{const reader={account(){throw Error('must not read')}};
 assert.equal((await collectGmailReplyPage(reader,env)).state,'disabled');assert.equal((await importGmailReply(message(),env,{...config,authorizedMailbox:'another@example.invalid'})).state,'disabled');assert.equal(db.prepare('SELECT COUNT(*) n FROM communication_messages').get().n,0);
 }finally{db.close();}
});
test('explicit reference saves once; retry and later same-thread reply preserve original intake and edits',async()=>{
 const {db,env}=setup();try{
 const first=await importGmailReply(message(),env,config);assert.equal(first.state,'stored');assert.equal((await importGmailReply(message(),env,config)).id,first.id);
 assert.equal((await importGmailReply(message('abc124','Re: next detail'),env,config)).state,'stored');
 assert.equal(db.prepare('SELECT COUNT(*) n FROM communication_messages').get().n,2);
 assert.equal(db.prepare('SELECT owner_notes FROM enquiries').get().owner_notes,'Preserve these owner notes');assert.equal(db.prepare('SELECT message FROM enquiries').get().message,'Original request');
 assert.equal(db.prepare('SELECT source FROM communication_messages LIMIT 1').get().source,'verified_import');
 }finally{db.close();}
});
test('ambiguous, foreign, unknown and changed participants stay out of business records',async()=>{
 const {db,env}=setup();try{
 for(const subject of ['No reference',`Fwd: [VNM:${id}]`,`[VNM:${id}] [TG:123]`,`[VNM:${id}] [VNM:00000000-0000-4000-8000-000000000002]`,'[VNM:00000000-0000-4000-8000-000000000002]'])assert.equal((await importGmailReply(message('abc123',subject),env,config)).stored,false);
 const changed=message();changed.payload.headers[0].value='other@example.invalid';assert.equal((await importGmailReply({...changed,id:'changed1'},env,config)).reason,'unverified_participant');
 changed.payload.headers[0].value='client@example.invalid';changed.payload.headers[1].value='otherbusiness@example.invalid';assert.equal((await importGmailReply({...changed,id:'changed2'},env,config)).reason,'identity_or_recipient');
 assert.equal(db.prepare('SELECT COUNT(*) n FROM communication_messages').get().n,0);
 }finally{db.close();}
});
test('thread remapping, changed duplicate content and test/live crossing never overwrite',async()=>{
 const {db,env}=setup();try{
 assert.equal((await importGmailReply(message(),env,config)).stored,true);
 assert.equal((await importGmailReply(message('abc124','[VNM:00000000-0000-4000-8000-000000000002]'),env,config)).reason,'thread_reference_conflict');
 const changed=message();changed.payload.body.data=Buffer.from('Changed').toString('base64url');assert.equal((await importGmailReply(changed,env,config)).reason,'pending_or_storage_not_confirmed');
 assert.equal((await importGmailReply(message('abc125'),env,{...config,allowTests:false})).reason,'test_live_boundary');
 assert.equal(db.prepare('SELECT body FROM communication_messages').get().body,'TEST ONLY later customer reply');
 }finally{db.close();}
});
test('attachments remain private references; unsupported bodies and outgoing labels require review',async()=>{
 const {db,env}=setup();try{
 const m=message();m.payload={headers:m.payload.headers,mimeType:'multipart/mixed',parts:[{mimeType:'text/plain',body:m.payload.body},{filename:'private.pdf',mimeType:'application/pdf',body:{attachmentId:'not-fetched'}}]};
 assert.equal((await importGmailReply(m,env,config)).stored,true);assert.match(db.prepare('SELECT attachment_reference FROM communication_messages').get().attachment_reference,/authorized source review/);
 const html=message('abc126');html.payload.mimeType='text/html';assert.equal((await importGmailReply(html,env,config)).reason,'body_or_attachment_review');
 const sent=message('abc127');sent.labelIds=['SENT'];assert.equal((await importGmailReply(sent,env,config)).reason,'not_eligible_incoming');
 }finally{db.close();}
});
test('failed write and lost acknowledgement retry safely with the same deterministic ID',async()=>{
 const {db,env}=setup();try{
 const broken={DB:{prepare(){throw Error('private secret must not appear')}}};
 const failed=await importGmailReply(message(),broken,config);assert.deepEqual(failed,{state:'retry',reason:'pending_or_storage_not_confirmed',stored:false,originalRetained:true,durablePending:false});
 const stored=await importGmailReply(message(),env,config);assert.equal(stored.stored,true);
 // Simulate loss of the first receipt: caller repeats original full message.
 assert.equal((await importGmailReply(message(),env,config)).id,stored.id);assert.equal(db.prepare('SELECT COUNT(*) n FROM communication_messages').get().n,1);
 }finally{db.close();}
});
test('bounded reader advances only after failures/unassigned references are durably retained',async()=>{
 const {db,env}=setup();try{
 let fail=true;const reader={account:async()=>config.authorizedMailbox,list:async args=>{assert.equal(args.maxResults,25);assert.equal(args.includeSpamTrash,false);return{messages:[{id:'abc123'},{id:'abc124'}],nextPageToken:'next'}},get:async id=>{if(id==='abc124'&&fail)throw Error('provider private error');return message(id)}};
 const first=await collectGmailReplyPage(reader,env,config);assert.equal(first.advanceAllowed,true);assert.equal(first.results[1].state,'retry');assert.equal(JSON.stringify(first).includes('private error'),false);
 fail=false;const second=await collectGmailReplyPage(reader,env,config);assert.equal(second.advanceAllowed,true);assert.equal(second.nextPageToken,'next');assert.equal(db.prepare('SELECT COUNT(*) n FROM communication_messages').get().n,2);
 reader.account=async()=> 'other@example.invalid';assert.equal((await collectGmailReplyPage(reader,env,config)).reason,'wrong_mailbox');
 }finally{db.close();}
});
test('deployed script scope and schedule are unchanged; adapter is not reachable from Worker',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../operations/google-alerts/appsscript.json',import.meta.url),'utf8'));
 assert.equal(manifest.oauthScopes.some(s=>s.includes('gmail.')),false);
 assert.doesNotMatch(readFileSync(new URL('../operations/enquiries/worker.mjs',import.meta.url),'utf8'),/gmail-replies/);
 assert.doesNotMatch(readFileSync(new URL('../operations/google-alerts/Code.gs',import.meta.url),'utf8'),/GmailApp|collectGmailReply|importGmailReply/);
});
