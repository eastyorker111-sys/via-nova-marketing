import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import worker from '../operations/enquiries/worker.mjs';
import {notificationOperation} from '../operations/enquiries/google-notifications.mjs';
const sample={id:'e5f5e031-a391-4f99-b230-09cd8e204411',kind:'quick',name:'TEST ONLY',email:'test@example.invalid',business:'TEST ONLY',message:'Synthetic test. No customer message.',isTest:true};

test('notification outbox claims once, excludes tests and retains uncertain delivery without retrying',async()=>{
 const {db,env}=setup();const call=(action,attempt='00000000-0000-4000-8000-000000000001')=>notificationOperation(new Request('https://example.invalid/api/notifications',{method:'POST',body:JSON.stringify({action,id:sample.id,attempt})}),env);
 try{await worker.fetch(req(),env);
 const normal=await(await notificationOperation(new Request('https://example.invalid/api/notifications'),env)).json();assert.equal(normal.items.length,0);
 const tests=await(await notificationOperation(new Request('https://example.invalid/api/notifications?tests=true'),env)).json();assert.equal(tests.items.length,1);assert.equal(tests.items[0].email,undefined);assert.equal(tests.items[0].message,undefined);
 assert.equal((await(await call('claim')).json()).claimed,true);assert.equal((await(await call('claim')).json()).claimed,false);
 assert.equal((await(await call('sent','00000000-0000-4000-8000-000000000099')).json()).updated,false);
 assert.equal((await(await call('uncertain')).json()).updated,true);assert.equal(db.prepare('SELECT state FROM notification_outbox').get().state,'needs_review');assert.equal((await(await call('claim')).json()).claimed,false);
 }finally{db.close();}
});
function setup(){const db=new DatabaseSync(':memory:');db.exec(readFileSync(new URL('../operations/enquiries/schema.sql',import.meta.url),'utf8'));const DB={prepare(sql){return {bind(...params){return {run:()=>/^SELECT/i.test(sql)?{results:db.prepare(sql).all(...params)}:db.prepare(sql).run(...params),first:()=>db.prepare(sql).get(...params),all:()=>({results:db.prepare(sql).all(...params)})}}}},async batch(statements){db.exec('BEGIN');try{const rows=statements.map(x=>x.run());db.exec('COMMIT');return rows}catch(e){db.exec('ROLLBACK');throw e}}};return {db,env:{DB,MODE:'staging',LIMITER:{limit:async()=>({success:true})}}};}
function req(body=sample,options={}){return new Request('https://example.invalid/api/enquiries',{method:options.method||'POST',headers:{Origin:options.origin||'https://vianovamarketing.ca','Content-Type':'application/json'},body:options.method==='GET'?undefined:JSON.stringify(body)});}
test('durable receipt, repeated request and owner edits survive retry',async()=>{const {db,env}=setup();try{assert.equal((await worker.fetch(req(),env)).status,200);db.prepare('UPDATE enquiries SET owner_notes=? WHERE id=?').run('Owner edit',sample.id);assert.equal((await worker.fetch(req(),env)).status,200);assert.equal(db.prepare('SELECT COUNT(*) n FROM enquiries').get().n,1);assert.equal(db.prepare('SELECT COUNT(*) n FROM notification_outbox').get().n,1);assert.equal(db.prepare('SELECT owner_notes FROM enquiries').get().owner_notes,'Owner edit');assert.equal((await worker.fetch(req({...sample,message:'Changed'}),env)).status,409);}finally{db.close()}});
test('input and access boundaries fail closed',async()=>{const {db,env}=setup();try{for(const [body,options,status]of [[sample,{origin:'https://other.invalid'},403],[sample,{method:'GET'},405],[{...sample,email:'bad'}, {},400],[{...sample,website:'spam'}, {},400],[{...sample,message:'x'.repeat(25000)}, {},503],[{...sample,isTest:false,email:'real@example.com'}, {},503]])assert.equal((await worker.fetch(req(body,options),env)).status,status);assert.equal(db.prepare('SELECT COUNT(*) n FROM enquiries').get().n,0);}finally{db.close()}});
test('rate limits and storage failures never claim success',async()=>{const {db,env}=setup();try{env.LIMITER.limit=async()=>({success:false});assert.equal((await worker.fetch(req(),env)).status,429);env.LIMITER.limit=async()=>({success:true});env.DB.batch=async()=>{throw Error('offline')};assert.equal((await worker.fetch(req(),env)).status,503);}finally{db.close()}});

test('private review rejects strangers and preserves edits across stale updates',async()=>{
 const {db,env}=setup();env.ADMIN_TOKEN='x'.repeat(64);
 const access=(method='GET',body,token=env.ADMIN_TOKEN)=>new Request('https://example.invalid/api/admin/enquiries',{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
 try{
  await worker.fetch(req(),env);
  assert.equal((await worker.fetch(access('GET',undefined,'wrong'),env)).status,401);
  assert.equal((await worker.fetch(access('GET'),env)).status,200);
  const edit={id:sample.id,revision:0,status:'Discussing',notes:'Owner notes survive',due:'2026-11-05'};
  assert.equal((await worker.fetch(access('PATCH',edit),env)).status,200);
  assert.equal((await worker.fetch(access('PATCH',{...edit,notes:'Stale overwrite'}),env)).status,409);
  assert.equal((await worker.fetch(req(),env)).status,200);
  const saved=db.prepare('SELECT * FROM enquiries').get();assert.equal(saved.owner_notes,'Owner notes survive');assert.equal(saved.revision,1);assert.equal(saved.message,sample.message);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM owner_audit').get().n,1);
 }finally{db.close()}
});
test('production requires owner readiness and trusted proxy; client cannot label genuine records as tests',async()=>{
 const {db,env}=setup();env.MODE='production';env.ADMIN_TOKEN='a'.repeat(64);env.INTAKE_PROXY_TOKEN='b'.repeat(64);
 const body={...sample,email:'person@example.org',isTest:true};
 const request=()=>{const r=req(body);r.headers.set('X-VNM-Proxy',env.INTAKE_PROXY_TOKEN);return r;};
 try{
  assert.equal((await worker.fetch(req(body),env)).status,403);
  assert.equal((await worker.fetch(request(),env)).status,503);
  env.OWNER_READY='true';assert.equal((await worker.fetch(request(),env)).status,200);
  assert.equal(db.prepare('SELECT is_test FROM enquiries').get().is_test,0);
 }finally{db.close();}
});

test('private pagination preserves equal timestamps and backup contains original and owner history',async()=>{
 const {db,env}=setup();env.ADMIN_TOKEN='a'.repeat(64);
 const read=path=>worker.fetch(new Request('https://example.invalid/api/admin/enquiries'+path,{headers:{Authorization:`Bearer ${env.ADMIN_TOKEN}`}}),env);
 try{
  await worker.fetch(req(),env);const original=db.prepare('SELECT * FROM enquiries').get();
  for(let i=1;i<=105;i++){const id='00000000-0000-4000-8000-'+String(i).padStart(12,'0');db.prepare('INSERT INTO enquiries SELECT ?,payload_hash,received_at,form_kind,name,email,business,message,is_test,marketing_consent,owner_status,owner_notes,follow_up_due,synced_at,revision FROM enquiries WHERE id=?').run(id,sample.id);}
  const first=await(await read('')).json();assert.equal(first.rows.length,100);assert.ok(first.more);
  const second=await(await read('?'+new URLSearchParams(first.next))).json();assert.equal(second.rows.length,6);assert.equal(second.more,false);assert.equal(new Set([...first.rows,...second.rows].map(r=>r.id)).size,106);
  const backup=await(await read('?export=backup')).json();assert.equal(backup.format,'via-nova-marketing-backup');assert.equal(backup.tables[0].rows.length,106);assert.equal(backup.tables[1].rows.length,1);assert.deepEqual(backup.tables[0].rows.find(r=>r.id===sample.id),{...original});
  assert.equal((await worker.fetch(new Request('https://example.invalid/api/admin/enquiries?export=backup'),env)).status,401);
 }finally{db.close();}
});

test('communication records are private, immutable, deduplicated and included in restorable backups',async()=>{
 const {db,env}=setup();env.ADMIN_TOKEN='c'.repeat(64);
 const call=(method,body,query='',token=env.ADMIN_TOKEN)=>worker.fetch(new Request('https://example.invalid/api/admin/messages'+query,{method,headers:{Authorization:`Bearer ${token}`},body:body?JSON.stringify(body):undefined}),env);
 const message={id:crypto.randomUUID(),enquiry_id:sample.id,channel:'email',direction:'incoming',source:'verified_import',provider_message_id:'synthetic-1',provider_thread_id:'synthetic-thread',occurred_at:'2026-11-03T20:00:00.000Z',body:'TEST ONLY incoming reply',delivery_state:'received',workflow:'proposal',project_reference:'TEST-PROJECT',invoice_reference:''};
 try{
  await worker.fetch(req(),env);db.prepare('UPDATE enquiries SET owner_notes=?').run('Preserved owner next action');
  assert.equal((await call('POST',message,'','wrong')).status,401);
  const receipt=await(await call('POST',message)).json();assert.equal(receipt.stored,true);assert.equal(receipt.sentByThisAction,false);assert.equal(receipt.source,'manual');
  assert.equal((await call('POST',message)).status,200);
  const providerDuplicate=await(await call('POST',{...message,id:crypto.randomUUID()})).json();assert.equal(providerDuplicate.id,message.id);
  assert.equal((await call('POST',{...message,body:'Overwrite attempt'})).status,409);
  assert.equal((await call('POST',{...message,id:crypto.randomUUID(),enquiry_id:crypto.randomUUID()})).status,404);
  assert.equal((await call('POST',{...message,id:crypto.randomUUID(),provider_message_id:'second',delivery_state:'draft'})).status,400);
  assert.equal((await call('POST',message,'?import=provider')).status,503);
  const outgoing={...message,id:crypto.randomUUID(),provider_message_id:'synthetic-2',direction:'outgoing',delivery_state:'draft',body:'TEST ONLY unsent proposal',invoice_reference:'TEST-INVOICE'};
  assert.equal((await call('POST',outgoing)).status,200);
  const timeline=await(await call('GET',null,'?enquiry_id='+sample.id)).json();assert.equal(timeline.rows.length,2);assert.equal(timeline.connectors.email,'pending_access');assert.equal(timeline.rows[0].payload_hash,undefined);
  assert.equal(db.prepare('SELECT owner_notes FROM enquiries').get().owner_notes,'Preserved owner next action');assert.equal(db.prepare('SELECT message FROM enquiries').get().message,sample.message);
  const backup=await(await worker.fetch(new Request('https://example.invalid/api/admin/enquiries?export=backup',{headers:{Authorization:`Bearer ${env.ADMIN_TOKEN}`}}),env)).json();assert.equal(backup.version,2);assert.equal(backup.tables.find(t=>t.table==='communication_messages').rows.length,2);
  const restored=new DatabaseSync(':memory:');try{restored.exec(readFileSync(new URL('../operations/enquiries/schema.sql',import.meta.url),'utf8'));for(const {table,rows} of backup.tables)for(const row of rows){const keys=Object.keys(row);restored.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(()=>'?').join(',')})`).run(...Object.values(row));}for(const {table} of backup.tables)assert.deepEqual(restored.prepare('SELECT * FROM '+table+' ORDER BY 1').all(),db.prepare('SELECT * FROM '+table+' ORDER BY 1').all());}finally{restored.close()}
  env.DB.prepare=()=>{throw Error('storage unavailable')};assert.equal((await call('POST',{...outgoing,id:crypto.randomUUID()})).status,503);
 }finally{db.close()}
});

test('message pagination retains equal timestamps without gaps or duplicate records',async()=>{
 const {db,env}=setup();env.ADMIN_TOKEN='d'.repeat(64);try{
  await worker.fetch(req(),env);
  for(let i=0;i<103;i++)db.prepare('INSERT INTO communication_messages VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run('00000000-0000-4000-8000-'+String(i).padStart(12,'0'),sample.id,'email','incoming','manual',null,null,'2026-11-03T00:00:00Z','2026-11-03T01:00:00Z','TEST ONLY','received','support','','','hash');
  const read=async(cursor={})=>(await(await worker.fetch(new Request('https://example.invalid/api/admin/messages?'+new URLSearchParams({enquiry_id:sample.id,...cursor}),{headers:{Authorization:`Bearer ${env.ADMIN_TOKEN}`}}),env)).json());
  const first=await read(),second=await read(first.next);assert.equal(first.rows.length,100);assert.equal(second.rows.length,3);assert.equal(second.next,null);assert.equal(new Set([...first.rows,...second.rows].map(r=>r.id)).size,103);
 }finally{db.close()}
});

test('retention review uses latest recorded activity, excludes tests by default and never deletes; case export is isolated',async()=>{
 const {db,env}=setup();env.ADMIN_TOKEN='r'.repeat(64);const read=q=>worker.fetch(new Request('https://example.invalid/api/admin/enquiries?'+q,{headers:{Authorization:`Bearer ${env.ADMIN_TOKEN}`}}),env);
 try{await worker.fetch(req(),env);db.prepare('UPDATE enquiries SET received_at=?').run('2020-01-01T00:00:00.000Z');
  assert.equal((await read('review=retention&review_before=2026-02-30')).status,400);
  let review=await(await read('review=retention&review_before=2026-11-03')).json();assert.equal(review.rows.length,0);assert.equal(review.automaticDeletion,false);assert.equal(review.retentionPeriod,'not_decided');
  review=await(await read('review=retention&review_before=2026-11-03&include_tests=true')).json();assert.equal(review.rows.length,1);assert.equal(review.rows[0].email,undefined);assert.equal(review.rows[0].message,undefined);
  db.prepare('INSERT INTO owner_audit VALUES (?,?,?,?,?)').run(crypto.randomUUID(),sample.id,'2026-11-03T15:00:00.000Z','test',0);
  review=await(await read('review=retention&review_before=2026-11-03&include_tests=true')).json();assert.equal(review.rows.length,0);
  const other={...sample,id:crypto.randomUUID()};await worker.fetch(req(other),env);
  const exported=await(await read('export=case&id='+sample.id)).json();assert.equal(exported.format,'via-nova-marketing-case-review');assert.equal(exported.tables[0].rows.length,1);assert.equal(exported.tables[0].rows[0].id,sample.id);assert.equal(exported.tables[0].rows[0].payload_hash,undefined);assert.equal(exported.tables[2].rows.length,1);
  assert.equal((await read('export=case&id='+crypto.randomUUID())).status,404);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM enquiries').get().n,2);
  assert.equal((await worker.fetch(new Request('https://example.invalid/api/admin/enquiries?export=case&id='+sample.id),env)).status,401);
 }finally{db.close()}
});
