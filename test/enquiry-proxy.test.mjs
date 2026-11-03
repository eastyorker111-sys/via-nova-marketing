import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/enquiries.mjs';
function response(){return {code:200,headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(body){this.body=body;return this;}};}
test('public proxy rejects cross-site requests and never exposes its server credential',async()=>{
 const original=globalThis.fetch,oldToken=process.env.ENQUIRY_PROXY_TOKEN,oldUrl=process.env.ENQUIRY_BACKEND_URL;
 process.env.ENQUIRY_PROXY_TOKEN='test-server-only';process.env.ENQUIRY_BACKEND_URL='https://backend.example.invalid';let calls=0;
 globalThis.fetch=async(url,options)=>{calls++;assert.equal(url.pathname,'/api/enquiries');assert.equal(options.headers['X-VNM-Proxy'],'test-server-only');return new Response(JSON.stringify({ok:true,stored:true,id:'record'}),{status:200});};
 try{
  const base={method:'POST',headers:{host:'vianovamarketing.ca',origin:'https://evil.invalid','content-type':'application/json'},body:{message:'test'}};
  let res=response();await handler(base,res);assert.equal(res.code,403);assert.equal(calls,0);
  res=response();await handler({...base,headers:{...base.headers,origin:'https://vianovamarketing.ca'}},res);assert.equal(res.code,200);assert.equal(calls,1);assert.equal(JSON.stringify(res.body).includes('test-server-only'),false);
  res=response();await handler({...base,method:'GET'},res);assert.equal(res.code,405);
 }finally{globalThis.fetch=original;if(oldToken===undefined)delete process.env.ENQUIRY_PROXY_TOKEN;else process.env.ENQUIRY_PROXY_TOKEN=oldToken;if(oldUrl===undefined)delete process.env.ENQUIRY_BACKEND_URL;else process.env.ENQUIRY_BACKEND_URL=oldUrl;}
});
