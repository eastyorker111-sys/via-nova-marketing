import test from 'node:test';
import assert from 'node:assert/strict';
import {submissionId,requestSignal} from '../operations/enquiries/client.mjs';

test('older browsers still create valid unique version 4 enquiry references',()=>{
 const descriptor=Object.getOwnPropertyDescriptor(crypto,'randomUUID');
 Object.defineProperty(crypto,'randomUUID',{value:undefined,configurable:true});
 try{const a=submissionId(),b=submissionId();assert.match(a,/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);assert.notEqual(a,b);}
 finally{if(descriptor)Object.defineProperty(crypto,'randomUUID',descriptor);else delete crypto.randomUUID;}
});
test('request timeout fallback aborts without native AbortSignal.timeout',()=>{
 const descriptor=Object.getOwnPropertyDescriptor(AbortSignal,'timeout'),timer=globalThis.setTimeout;
 Object.defineProperty(AbortSignal,'timeout',{value:undefined,configurable:true});
 let delay;globalThis.setTimeout=(fn,ms)=>{delay=ms;fn();return 0;};
 try{assert.equal(requestSignal(20000).aborted,true);assert.equal(delay,20000);}
 finally{Object.defineProperty(AbortSignal,'timeout',descriptor);globalThis.setTimeout=timer;}
});
