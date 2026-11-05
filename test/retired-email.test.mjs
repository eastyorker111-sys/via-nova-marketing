import test from 'node:test';import assert from 'node:assert/strict';import worker from '../operations/enquiries/worker.mjs';
test('retired mail endpoint cannot return records or act with old configuration',async()=>{
 let read=false;const env={GOOGLE_NOTIFICATIONS_ENABLED:'true',DB:{prepare(){read=true;throw Error('No DB read allowed')}}};
 for(const method of ['GET','POST']){const r=await worker.fetch(new Request('https://example.invalid/api/notifications',{method}),env);assert.equal(r.status,410);}
 assert.equal(read,false);
 const health=await (await worker.fetch(new Request('https://example.invalid/health'),env)).json();assert.equal(health.emailAlerts,'not_configured');
});
