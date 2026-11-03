import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import worker from '../operations/enquiries/worker.mjs';
const sample={id:'e5f5e031-a391-4f99-b230-09cd8e204411',kind:'quick',name:'TEST ONLY',email:'test@example.invalid',business:'TEST ONLY',message:'Synthetic test. No customer message.',isTest:true};
function setup(){const db=new DatabaseSync(':memory:');db.exec(readFileSync(new URL('../operations/enquiries/schema.sql',import.meta.url),'utf8'));const DB={prepare(sql){return {bind(...params){return {run:()=>db.prepare(sql).run(...params),first:()=>db.prepare(sql).get(...params),all:()=>({results:db.prepare(sql).all(...params)})}}}},async batch(statements){db.exec('BEGIN');try{const rows=statements.map(x=>x.run());db.exec('COMMIT');return rows}catch(e){db.exec('ROLLBACK');throw e}}};return {db,env:{DB,MODE:'staging',LIMITER:{limit:async()=>({success:true})}}};}
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
