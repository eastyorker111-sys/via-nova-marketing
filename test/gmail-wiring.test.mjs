import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import worker from '../operations/enquiries/worker.mjs';
import {gmailReview} from '../operations/enquiries/gmail-review.mjs';
import {createGmailReader,MAILBOX,RECIPIENT,REPLY_QUERY} from '../operations/enquiries/gmail-reader.mjs';
import proxy from '../operations/owner-inbox/api/replies.mjs';
const eid='00000000-0000-4000-8000-000000000001',token='TEST-ONLY-'+'x'.repeat(50);
function fixture(){
 const db=new DatabaseSync(':memory:');for(const f of ['schema.sql','gmail-pending-schema.sql'])db.exec(readFileSync(new URL('../operations/enquiries/'+f,import.meta.url),'utf8'));
 db.prepare('INSERT INTO enquiries(id,payload_hash,received_at,form_kind,name,email,business,message,is_test,owner_notes) VALUES(?,?,?,?,?,?,?,?,?,?)').run(eid,'x','2026-11-03','quick','TEST ONLY','client@example.invalid','','Original',1,'Keep notes');
 const DB={prepare(sql){return{bind(...p){return{first:async()=>db.prepare(sql).get(...p),all:async()=>({results:db.prepare(sql).all(...p)}),run:async()=>db.prepare(sql).run(...p)}}}},async batch(statements){db.exec('BEGIN');try{const r=[];for(const s of statements)r.push(s.all?await s.all():await s.run());db.exec('COMMIT');return r;}catch(e){db.exec('ROLLBACK');throw e;}}};
 return{db,env:{DB,ADMIN_TOKEN:token,GMAIL_PENDING_SCHEMA_READY:'true',GMAIL_OWNER_REVIEW_ENABLED:'true',GMAIL_TEST_MODE:'true',GMAIL_READ_AUTHORIZED:'true',GMAIL_ROUTE_VERIFIED:'true',GMAIL_ACCESS_TOKEN:'SYNTHETIC_TOKEN'}};
}
const request=(body,auth=token,path='/api/admin/replies')=>new Request('https://worker.invalid'+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+auth,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
const message={id:'fixture1',threadId:'thread1',internalDate:'1793707200000',labelIds:['INBOX'],payload:{mimeType:'text/plain',headers:[{name:'From',value:'client@example.invalid'},{name:'To',value:RECIPIENT},{name:'Subject',value:'TEST ONLY unmatched reply'}],body:{data:Buffer.from('TEST ONLY later reply').toString('base64url')}}};
function provider(email=MAILBOX){const calls=[];return{calls,fetch:async(url,options)=>{calls.push({url:String(url),options});assert.equal(options.method,'GET');assert.equal(options.redirect,'error');return Response.json(String(url).includes('/profile')?{emailAddress:email}:String(url).includes('/messages/fixture1')?message:{messages:[{id:message.id}],nextPageToken:'next-page'});}};}
test('Worker authenticates review before disabled response; disabled mode does not touch DB',async()=>{
 const env={ADMIN_TOKEN:token,DB:{prepare(){throw Error('must not touch DB')}}};
 assert.equal((await worker.fetch(request(null,'wrong'),env)).status,401);
 const r=await worker.fetch(request(),env);assert.equal(r.status,200);assert.equal((await r.json()).state,'disabled');
 assert.equal((await worker.fetch(request({action:'discover'}),env)).status,503);
});
test('REST reader refuses unverified account, wrong query and arbitrary IDs; all calls are scoped GETs',async()=>{
 const {db,env}=fixture();try{
  const p=provider(),reader=createGmailReader(env,p.fetch);
  await assert.rejects(()=>reader.get('fixture1'),/scoped_message/);assert.equal(p.calls.length,0);
  await reader.account();await assert.rejects(()=>reader.list({q:'in:anywhere'}),/business_scope/);
  await reader.list({q:REPLY_QUERY});await reader.get('fixture1');await assert.rejects(()=>reader.get('unrelated'),/scoped_message/);
  assert.equal(p.calls.length,3);const url=new URL(p.calls[1].url);assert.equal(url.searchParams.get('q'),REPLY_QUERY);assert.equal(url.searchParams.get('maxResults'),'5');
  const wrong=createGmailReader(env,provider('other@example.invalid').fetch);await assert.rejects(()=>wrong.account(),/wrong_mailbox/);
  const disabled=createGmailReader({...env,GMAIL_READ_AUTHORIZED:'false'},()=>{throw Error('network should not run')});await assert.rejects(()=>disabled.account(),/access_not_verified/);
 }finally{db.close();}
});
test('Reader reports access expiry/denial, rejects redirects and bounds oversized responses',async()=>{
 const {db,env}=fixture();try{
  for(const [status,reason] of [[401,'expired'],[403,'denied'],[500,'unavailable']])await assert.rejects(()=>createGmailReader(env,async()=>new Response('',{status})).account(),new RegExp(reason));
  await assert.rejects(()=>createGmailReader(env,async()=>new Response('x'.repeat(350001))).account(),/too_large/);
 }finally{db.close();}
});
test('New review route discovers metadata, audits explicit match, retries into same timeline and exports all seven tables',async()=>{
 const {db,env}=fixture(),p=provider();try{
  let r=await gmailReview(request({action:'discover'}),env,p.fetch);assert.equal(r.status,200);assert.equal((await r.json()).advanceAllowed,true);
  const listed=await (await gmailReview(request(),env,p.fetch)).json();assert.equal(listed.rows.length,1);assert.equal(listed.rows[0].enquiry_id,null);assert.equal(JSON.stringify(listed).includes('later reply'),false);
  const match={action:'match',messageId:'fixture1',revision:listed.rows[0].revision,enquiryId:eid,confirmMarketing:true,evidenceReference:'TEST ONLY source inspected',owner:{email:'forged'}};
  assert.equal((await gmailReview(request(match),env,p.fetch)).status,200);assert.equal((await gmailReview(request(match),env,p.fetch)).status,409);
  assert.equal(db.prepare('SELECT actor FROM gmail_reply_match_audit').get().actor,MAILBOX);
  for(let i=0;i<2;i++)assert.equal((await (await gmailReview(request({action:'retry',messageId:'fixture1'}),env,p.fetch)).json()).stored,true);
  assert.equal(db.prepare('SELECT count(*) n FROM communication_messages').get().n,1);assert.equal(db.prepare('SELECT owner_notes FROM enquiries').get().owner_notes,'Keep notes');
  const backup=await (await worker.fetch(request(null,token,'/api/admin/enquiries?export=backup'),env)).json();assert.equal(backup.version,4);assert.equal(backup.tables.length,7);
  const restored=new DatabaseSync(':memory:');try{
   for(const f of ['schema.sql','gmail-pending-schema.sql'])restored.exec(readFileSync(new URL('../operations/enquiries/'+f,import.meta.url),'utf8'));
   for(const table of backup.tables)for(const row of table.rows){const keys=Object.keys(row);restored.prepare(`INSERT INTO ${table.table} (${keys.join(',')}) VALUES (${keys.map(()=>'?').join(',')})`).run(...keys.map(k=>row[k]));}
   assert.equal(restored.prepare('SELECT state FROM gmail_pending_replies').get().state,'imported');assert.equal(restored.prepare('SELECT count(*) n FROM gmail_reply_match_audit').get().n,1);assert.equal(restored.prepare('SELECT page_token FROM gmail_reply_cursor').get().page_token,'next-page');
  }finally{restored.close();}
 }finally{db.close();}
});
test('Review rejects unknown retry IDs before provider access and reports wrong account/expired access without importing',async()=>{
 const {db,env}=fixture();try{
  const p=provider();assert.equal((await gmailReview(request({action:'retry',messageId:'absent'}),env,p.fetch)).status,404);assert.equal(p.calls.length,0);
  const r=await gmailReview(request({action:'discover'}),env,provider('wrong@example.invalid').fetch);assert.equal((await r.json()).error,'wrong_mailbox');
  const expired=await gmailReview(request({action:'check'}),env,async()=>new Response('',{status:401}));assert.equal((await expired.json()).error,'gmail_access_expired');
  assert.equal(db.prepare('SELECT count(*) n FROM gmail_pending_replies').get().n,0);
 }finally{db.close();}
});
test('Private proxy rejects cross-origin writes and keeps credentials server-side',async()=>{
 const saved={...process.env},oldFetch=globalThis.fetch;let calls=0;
 Object.assign(process.env,{OWNER_INBOX_ENABLED:'true',ENQUIRY_ADMIN_TOKEN:token,ENQUIRY_BACKEND_URL:'https://backend.invalid'});
 const res=()=>({headers:{},setHeader(k,v){this.headers[k]=v},status(n){this.code=n;return this},json(data){this.data=data;return this}});
 try{
  globalThis.fetch=async(url,opt)=>{calls++;assert.equal(new URL(url).pathname,'/api/admin/replies');assert.equal(opt.headers.Authorization,'Bearer '+token);return Response.json({state:'disabled'});};
  const denied=res();await proxy({method:'POST',headers:{host:'private.invalid',origin:'https://other.invalid','x-vnm-action':'review-reply'},body:{action:'check'}},denied);assert.equal(denied.code,403);assert.equal(calls,0);
  const ok=res();await proxy({method:'POST',headers:{host:'private.invalid',origin:'https://private.invalid','x-vnm-action':'review-reply'},body:{action:'check'}},ok);assert.equal(ok.code,200);assert.equal(JSON.stringify(ok.data).includes(token),false);
 }finally{globalThis.fetch=oldFetch;for(const key of ['OWNER_INBOX_ENABLED','ENQUIRY_ADMIN_TOKEN','ENQUIRY_BACKEND_URL'])if(saved[key]===undefined)delete process.env[key];else process.env[key]=saved[key];}
});
