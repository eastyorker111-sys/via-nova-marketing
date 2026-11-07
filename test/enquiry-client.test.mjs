import test from 'node:test';
import assert from 'node:assert/strict';
import {createSubmission,createReceiptReporter} from '../operations/enquiries/client.mjs';

test('confirmed receipt reporting excludes tests, failures, mismatches and duplicates without customer fields',()=>{
 const events=[],report=createReceiptReporter(e=>events.push(e)),payload={id:'receipt-id',kind:'quick',email:'private@example.com'},good={ok:true,stored:true,id:'receipt-id',isTest:false};
 report(payload,{...good,isTest:true});report(payload,{...good,stored:false});report(payload,{...good,id:'different'});assert.equal(events.length,0);
 report(payload,good);report(payload,good);assert.deepEqual(events,[{kind:'quick'}]);
});

test('ambiguous transport retry reuses ID; double click and receipt replay do not duplicate', async () => {
  const ids=[]; let attempt=0;
  const submit=createSubmission({newId:()=> 'test-reference',send:async p=>{ids.push(p.id); if(++attempt===1)throw new Error('lost response');return {ok:true,stored:true,id:p.id,isTest:true};}});
  const input={name:'TEST',email:'test@example.invalid',message:'TEST ONLY'};
  assert.equal((await submit(input)).state,'retry');
  assert.equal((await submit({...input,message:'changed'})).state,'uncertain');
  const result=await submit(input);
  assert.equal(result.state,'saved');
  assert.match(result.message,/Synthetic tests are excluded from automatic email alerts/);
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
test('definite validation rejection permits corrected input without retaining an uncertain request',async()=>{
 let attempt=0;const submit=createSubmission({newId:()=>String(++attempt),send:async p=>{if(p.message==='bad'){const error=Error('Correct your message');error.definite=true;throw error;}return {ok:true,stored:true,id:p.id};}});
 assert.equal((await submit({message:'bad'})).state,'invalid');
 assert.equal((await submit({message:'corrected'})).state,'saved');
});
import {bindForm} from '../operations/enquiries/client.mjs';
test('reopening a guided contact form retains the saved receipt and does not send twice',async()=>{
 const OriginalFormData=globalThis.FormData;
 globalThis.FormData=class{get(k){return {name:'TEST',email:'test@example.invalid',message:'Same brief'}[k]||'';}};
 let sends=0;const send=async p=>{sends++;return {ok:true,stored:true,id:p.id,isTest:true};};
 const shared=createSubmission({send,newId:()=> 'shared-reference'});
 const createForm=()=>{const status={textContent:'',focus(){}},button={disabled:false};let handler;return {querySelector:s=>s==='[data-enquiry-status]'?status:button,reportValidity:()=>true,addEventListener:(type,fn)=>handler=fn,removeEventListener(){},fire:()=>handler({preventDefault(){},defaultPrevented:false}),status};};
 try{const first=createForm();bindForm(first,{send,submit:shared});await first.fire();const reopened=createForm();bindForm(reopened,{send,submit:shared});await reopened.fire();assert.equal(sends,1);assert.equal(reopened.status.textContent,first.status.textContent);}
 finally{globalThis.FormData=OriginalFormData;}
});
