// Optional Outlook redirect bridge. Disabled until both providers are authorized.
// Only the existing signed Google project can invoke it. Access tokens are never stored.
import {verifyGoogleIdentity} from './google-notifications.mjs';
import {createGmailReader,MAILBOX,RECIPIENT} from './gmail-reader.mjs';
import {collectGmailReplyPage} from './gmail-replies.mjs';
const json=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export async function outlookBridge(request,env,deps={}){
 if(env.OUTLOOK_BRIDGE_ENABLED!=='true'||env.GMAIL_PENDING_SCHEMA_READY!=='true'||env.GMAIL_READ_AUTHORIZED!=='true'||env.GMAIL_ROUTE_VERIFIED!=='true')return json(503,{error:'Outlook reply bridge is not activated'});
 if(request.method!=='POST')return json(405,{error:'Use POST'});
 const identity=request.headers.get('Authorization')||'',access=request.headers.get('X-VNM-Google-Access')||'';
 if(!identity.startsWith('Bearer ')||!access||access.length>8192)return json(401,{error:'Authorized Google project required'});
 try{await (deps.verify||verifyGoogleIdentity)(identity.slice(7),env);}catch{return json(401,{error:'Authorized Google project required'});}
 try{
  const reader=(deps.reader||createGmailReader)({...env,GMAIL_ACCESS_TOKEN:access});
  // Do not accept profile identity asserted by request content.
  if(await reader.account()!==MAILBOX)return json(403,{error:'Wrong Google mailbox'});
  const result=await (deps.collect||collectGmailReplyPage)(reader,env,{enabled:true,authorizedMailbox:MAILBOX,verifiedRecipient:RECIPIENT,allowTests:false});
  // No customer bodies, access tokens or contact details in response/logs.
  return json(result.state==='retry'?503:200,{state:result.state,stored:(result.results||[]).filter(r=>r.stored).length,review:(result.results||[]).filter(r=>r.state==='needs_review').length,advanceAllowed:result.advanceAllowed===true,sendsMail:false});
 }catch{return json(503,{error:'Reply check failed; original emails retained. No credential or customer details logged.'});}
}
