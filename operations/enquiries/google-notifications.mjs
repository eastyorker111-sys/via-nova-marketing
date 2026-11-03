import {createRemoteJWKSet,jwtVerify} from 'jose';
const keys=createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const json=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export async function verifyGoogleIdentity(token,env,keySet=keys){
 if(!env.GOOGLE_NOTIFICATION_CLIENT_ID||!env.GOOGLE_NOTIFICATION_OWNER)throw Error('Not configured');
 const {payload}=await jwtVerify(token,keySet,{algorithms:['RS256'],issuer:['https://accounts.google.com','accounts.google.com'],audience:env.GOOGLE_NOTIFICATION_CLIENT_ID,requiredClaims:['exp','iat','sub','email','email_verified']});
 if(payload.email!==env.GOOGLE_NOTIFICATION_OWNER||payload.email_verified!==true)throw Error('Wrong owner');
 return payload.sub;
}
export async function notificationOperation(request,env){
 if(request.method==='GET'){
  const tests=new URL(request.url).searchParams.get('tests')==='true';
  const result=await env.DB.prepare("SELECT n.enquiry_id AS id,e.received_at,e.is_test,n.state,n.last_error AS attempt FROM notification_outbox n JOIN enquiries e ON e.id=n.enquiry_id WHERE e.is_test=? AND n.state IN ('pending_configuration','ready','sending') ORDER BY e.received_at,n.enquiry_id LIMIT 10").bind(tests?1:0).all();
  return json(200,{items:result.results||[],source:'Via Nova Marketing notification outbox'});
 }
 if(request.method!=='POST')return json(405,{error:'Method not allowed'});
 const raw=await request.text();if(raw.length>2000)return json(413,{error:'Too large'});
 let input;try{input=JSON.parse(raw);}catch{return json(400,{error:'Invalid request'});}
 const {id,attempt,action}=input;
 if(!/^[\da-f-]{36}$/i.test(id)||!/^[\da-f-]{36}$/i.test(attempt)||!['claim','sent','uncertain'].includes(action))return json(400,{error:'Invalid operation'});
 if(action==='claim'){
  const r=await env.DB.prepare("UPDATE notification_outbox SET state='sending',attempts=attempts+1,last_error=? WHERE enquiry_id=? AND state IN ('pending_configuration','ready')").bind(attempt,id).run();
  return json(200,{claimed:Boolean(r.meta?.changes??r.changes)});
 }
 const state=action==='sent'?'sent':'needs_review';
 const r=await env.DB.prepare("UPDATE notification_outbox SET state=?,last_error=? WHERE enquiry_id=? AND state='sending' AND last_error=?").bind(state,action==='sent'?null:'Google send result uncertain; inspect Sent mail before any resend.',id,attempt).run();
 return json(200,{updated:Boolean(r.meta?.changes??r.changes),state});
}
export async function googleNotifications(request,env){
 if(env.GOOGLE_NOTIFICATIONS_ENABLED!=='true')return json(503,{error:'Google notifications are not enabled'});
 try{const header=request.headers.get('Authorization')||'';if(!header.startsWith('Bearer '))return json(401,{error:'Google identity required'});await verifyGoogleIdentity(header.slice(7),env);}catch{return json(401,{error:'Authorized Google owner and project required'});}
 try{return await notificationOperation(request,env);}catch{return json(503,{error:'Notification store unavailable'});}
}
