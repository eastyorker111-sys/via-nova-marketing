import {admin} from './admin.mjs';
import {googleNotifications} from './google-notifications.mjs';
const origin='https://vianovamarketing.ca';
const maxBytes=24576;
const response=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function boundedJson(request){
 const reader=request.body?.getReader(); if(!reader)throw new Error('body');
 let size=0;const chunks=[];
 try {while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBytes){await reader.cancel();throw new Error('size');}chunks.push(value);}}
 finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let pos=0;for(const c of chunks){bytes.set(c,pos);pos+=c.length;}
 return JSON.parse(new TextDecoder().decode(bytes));
}
export function validate(input){
 if(!input || typeof input!=='object' || Array.isArray(input))return null;
 const text=(key,max,required=false)=>{const v=input[key];if(v===undefined&&!required)return '';if(typeof v!=='string')throw new Error('field');const t=v.trim();if(t.length>max||(required&&!t)||/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(t))throw new Error('field');return t;};
 try{
  const id=text('id',36,true);if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))return null;
  const name=text('name',120,true), email=text('email',254,true).toLowerCase(),business=text('business',160),message=text('message',18000,true);
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||/[\r\n]/.test(name+email+business))return null;
  if(!['quick','brief'].includes(input.kind))return null;
  return {id,name,email,business,message,kind:input.kind,isTest:email.endsWith('.invalid'),honeypot:text('website',200)};
 }catch{return null;}
}
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname==='/api/admin/enquiries')return admin(request,env);
  if(url.pathname==='/api/notifications')return googleNotifications(request,env);
  const live=env.MODE==='production'&&env.OWNER_READY==='true'&&Boolean(env.INTAKE_PROXY_TOKEN)&&Boolean(env.ADMIN_TOKEN);
  if(url.pathname==='/health'&&request.method==='GET')return response(200,{service:'via-nova-marketing-enquiries',mode:env.MODE||'staging',customerIntake:live,notifications:'private_inbox',emailAlerts:env.GOOGLE_NOTIFICATIONS_ENABLED==='true'?'google_owner_alerts':'not_configured'});
  // No customer records or admin operations are exposed over HTTP.
  if(url.pathname!=='/api/enquiries')return response(404,{error:'Not found'});
  if(request.method!=='POST')return response(405,{error:'Use POST'});
  if(request.headers.get('Origin')!==origin)return response(403,{error:'Open the form on our website'});
  if(env.INTAKE_PROXY_TOKEN&&request.headers.get('X-VNM-Proxy')!==env.INTAKE_PROXY_TOKEN)return response(403,{error:'Use the website enquiry route'});
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))return response(415,{error:'Use JSON'});
  try{
   const input=validate(await boundedJson(request));if(!input)return response(400,{error:'Check your name, email and message'});
   if(input.honeypot)return response(400,{error:'Please use the contact alternatives'});
   // Deliberately fail closed until notification and owner-review connections are verified.
   if(!live&&!input.isTest)return response(503,{error:'This replacement is being tested. Please contact hello@vianovamarketing.ca.'});
   if(!env.LIMITER)return response(503,{error:'Spam protection unavailable'});
   const visitor=env.INTAKE_PROXY_TOKEN?request.headers.get('X-VNM-Visitor'):request.headers.get('CF-Connecting-IP');
   const limit=await env.LIMITER.limit({key:visitor||'unknown'});
   if(!limit.success)return response(429,{error:'Please wait one minute before trying again'});
   const canonical=JSON.stringify([input.name,input.email,input.business,input.message,input.kind,input.isTest]);
   const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical))),b=>b.toString(16).padStart(2,'0')).join('');
   const now=new Date().toISOString();
   // Atomic batch: a saved enquiry always has an outbox row. A repeated ID never overwrites owner edits.
   await env.DB.batch([
    env.DB.prepare('INSERT OR IGNORE INTO enquiries (id,payload_hash,received_at,form_kind,name,email,business,message,is_test) VALUES (?,?,?,?,?,?,?,?,?)').bind(input.id,hash,now,input.kind,input.name,input.email,input.business,input.message,input.isTest?1:0),
    env.DB.prepare('INSERT OR IGNORE INTO notification_outbox (enquiry_id) SELECT id FROM enquiries WHERE id=? AND payload_hash=?').bind(input.id,hash)
   ]);
   const row=await env.DB.prepare('SELECT payload_hash FROM enquiries WHERE id=?').bind(input.id).first();
   if(!row||row.payload_hash!==hash)return response(409,{error:'This request reference was already used. Start a new request.'});
   return response(200,{ok:true,id:input.id,isTest:input.isTest,stored:true,notification:'private_inbox',emailAlert:'pending_configuration'});
  }catch{
   return response(503,{error:'We could not confirm storage. Keep your text and retry with the same reference.'});
  }
 }
};
