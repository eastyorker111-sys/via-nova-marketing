import test from 'node:test';
import assert from 'node:assert/strict';
import {createSubmission} from '../operations/enquiries/client.mjs';

test('ambiguous transport retry reuses ID; double click and receipt replay do not duplicate', async () => {
  const ids=[]; let attempt=0;
  const submit=createSubmission({newId:()=> 'test-reference',send:async p=>{ids.push(p.id); if(++attempt===1)throw new Error('lost response');return {ok:true,stored:true,id:p.id,isTest:true};}});
  const input={name:'TEST',email:'test@example.invalid',message:'TEST ONLY'};
  assert.equal((await submit(input)).state,'retry');
  assert.equal((await submit({...input,message:'changed'})).state,'uncertain');
  const result=await submit(input);
  assert.equal(result.state,'saved');
  assert.match(result.message,/Notification delivery is not configured/);
  assert.deepEqual(await submit(input),result);
  assert.deepEqual(ids,['test-reference','test-reference']);
});
test('only a matching durable receipt is success; simultaneous requests are blocked', async()=>{
  let release;
  const submit=createSubmission({newId:()=> 'reference',send:()=>new Promise(r=>release=r)});
  const first=submit({message:'TEST'});
  assert.equal((await submit({message:'TEST'})).state,'busy');
  release({ok:true,stored:true,id:'different'});
  assert.equal((await first).state,'retry');
});
