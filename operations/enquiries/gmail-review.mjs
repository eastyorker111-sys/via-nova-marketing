// Called only after admin.mjs authenticates the private owner proxy.
import {matchPendingReply,validGmailId,gmailKey} from './gmail-pending.mjs';
import {collectGmailReplyPage,replayPendingReply} from './gmail-replies.mjs';
import {createGmailReader,readerReady,MAILBOX,RECIPIENT} from './gmail-reader.mjs';
const json=(status,data)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export async function gmailReview(request,env,fetcher=fetch){
 const configured=env.GMAIL_PENDING_SCHEMA_READY==='true'&&env.GMAIL_OWNER_REVIEW_ENABLED==='true';
 const base={configured,readerReady:configured&&readerReady(env),mailbox:MAILBOX,recipient:RECIPIENT,mode:'manual',sendsMail:false};
 if(!['GET','POST'].includes(request.method))return json(405,{error:'Method not allowed'});
 if(!configured)return json(request.method==='GET'?200:503,{...base,state:'disabled',rows:[],error:request.method==='POST'?'Reply review is not activated':undefined});
 const config={enabled:true,authorizedMailbox:MAILBOX,verifiedRecipient:RECIPIENT,allowTests:env.GMAIL_TEST_MODE==='true'};
 try{
  if(request.method==='GET'){
   const params=new URL(request.url).searchParams,before=params.get('before')||'9999',id=params.get('before_id')||'~';
   if(before.length>80||(id!=='~'&&!validGmailId(id)))return json(400,{error:'Invalid cursor'});
   const data=await env.DB.prepare('SELECT message_id,thread_id,source_reference,classification,state,reason,enquiry_id,revision,first_seen,last_seen,attempts FROM gmail_pending_replies WHERE mailbox=? AND (first_seen<? OR (first_seen=? AND message_id<?)) ORDER BY first_seen DESC,message_id DESC LIMIT 51').bind(MAILBOX,before,before,id).all();
   const rows=data.results||[],last=rows[49];
   const cursor=await env.DB.prepare('SELECT last_checked FROM gmail_reply_cursor WHERE mailbox=?').bind(MAILBOX).first();
   return json(200,{...base,state:'ready_for_review',rows:rows.slice(0,50),next:rows.length>50?{before:last.first_seen,before_id:last.message_id}:null,lastDiscoveryAt:cursor?.last_checked||null});
  }
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json(415,{error:'Use JSON'});
  const raw=await request.text();if(raw.length>4000)return json(413,{error:'Request too large'});
  let input;try{input=JSON.parse(raw);}catch{return json(400,{error:'Invalid request'});}
  if(!input||typeof input!=='object')return json(400,{error:'Invalid request'});
  if(input.action==='match'){
   // Actor derives from the existing single-owner authenticated service boundary,
   // not client-provided identity. Do not enable this on a shared/public deployment.
   const result=await matchPendingReply(env,config,input,{verified:true,email:MAILBOX});
   return json(result.state==='matched'?200:result.state==='conflict'?409:400,result);
  }
  if(!['check','discover','retry'].includes(input.action))return json(400,{error:'Choose a supported action'});
  if(!readerReady(env))return json(503,{...base,error:'Mailbox route and read access are not verified. No Gmail request made.'});
  if(input.action==='retry'){
   if(!validGmailId(input.messageId))return json(400,{error:'Invalid message reference'});
   const row=await env.DB.prepare('SELECT provider_key FROM gmail_pending_replies WHERE provider_key=?').bind(gmailKey(MAILBOX,input.messageId)).first();
   if(!row)return json(404,{error:'Pending reference not found'});
  }
  const reader=createGmailReader(env,fetcher,input.action==='retry'?[input.messageId]:[]);
  // Explicit preflight exposes expired/denied/wrong-account state without any mail read.
  await reader.account();
  if(input.action==='check')return json(200,{...base,state:'account_verified',verifiedAt:new Date().toISOString()});
  const result=input.action==='discover'?await collectGmailReplyPage(reader,env,config):await replayPendingReply(reader,env,config,input.messageId);
  return json(result.state==='retry'?503:200,result);
 }catch(error){
  const known=['gmail_access_expired','gmail_access_denied','wrong_mailbox','gmail_unavailable'];
  return json(503,{...base,error:known.includes(error.message)?error.message:'Reply operation not confirmed. Keep your selection and retry.'});
 }
}
