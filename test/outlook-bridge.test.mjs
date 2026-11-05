import test from 'node:test';
import assert from 'node:assert/strict';
import {outlookBridge} from '../operations/enquiries/outlook-bridge.mjs';
const env={OUTLOOK_BRIDGE_ENABLED:'true',GMAIL_PENDING_SCHEMA_READY:'true',GMAIL_READ_AUTHORIZED:'true',GMAIL_ROUTE_VERIFIED:'true'};
const request=()=>new Request('https://example.invalid/api/outlook-replies',{method:'POST',headers:{Authorization:'Bearer signed-identity','X-VNM-Google-Access':'ephemeral-secret'}});
test('bridge stays disabled until all four provider and schema gates are met',async()=>{
 for(const key of Object.keys(env)){let touched=false;const r=await outlookBridge(request(),{...env,[key]:'false'},{verify(){touched=true}});assert.equal(r.status,503);assert.equal(touched,false);}
});
test('bridge rejects invalid identity before mailbox access',async()=>{
 let read=false;const r=await outlookBridge(request(),env,{verify(){throw Error('invalid')},reader(){read=true}});assert.equal(r.status,401);assert.equal(read,false);
});
test('bridge rejects the wrong mailbox before collection',async()=>{
 let collect=false;const r=await outlookBridge(request(),env,{verify:async()=>{},reader:()=>({account:async()=> 'wrong@example.com'}),collect(){collect=true}});assert.equal(r.status,403);assert.equal(collect,false);
});
test('bridge pins both accounts, excludes tests, and does not expose credentials or customer content',async()=>{
 let received;const r=await outlookBridge(request(),env,{verify:async()=>{},reader:e=>{assert.equal(e.GMAIL_ACCESS_TOKEN,'ephemeral-secret');return {account:async()=> 'east.yorker111@gmail.com'}},collect:async(reader,e,config)=>{received=config;return {state:'stored',advanceAllowed:true,results:[{stored:true,body:'private customer body'}]}}});
 assert.equal(received.verifiedRecipient,'vianovamarketing@outlook.com');assert.equal(received.allowTests,false);const data=await r.text();assert.equal(r.status,200);assert.doesNotMatch(data,/ephemeral-secret|private customer body/);assert.equal(JSON.parse(data).stored,1);
});
test('provider errors are retryable and redact private error data',async()=>{
 const r=await outlookBridge(request(),env,{verify:async()=>{},reader:()=>({account:async()=>{throw Error('ephemeral-secret')}})});assert.equal(r.status,503);assert.doesNotMatch(await r.text(),/ephemeral-secret/);
});
