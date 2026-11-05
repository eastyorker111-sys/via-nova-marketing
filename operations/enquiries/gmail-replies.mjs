// Server-side adapter behind the disabled-by-default private reply review route.
// The authorized reader supplies full Gmail messages; originals stay in Gmail.
import {recordCommunication} from './communications.mjs';
import {pendingReply,finishPending,gmailKey,gmailEnabled,validGmailId} from './gmail-pending.mjs';
const reference=/\[VNM:([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\]/gi;
const providerId=v=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,128}$/.test(v);
const hold=reason=>({state:'needs_review',reason,stored:false,originalRetained:true});
const header=(m,name)=>{
 const found=(m.payload?.headers||[]).filter(h=>h.name?.toLowerCase()===name.toLowerCase());
 return found.length===1?found[0].value:'';
};
function mailbox(value){
 if(typeof value!=='string'||/[\r\n,;]/.test(value))return null;
 const v=value.trim(),m=v.match(/^(?:[^<>]*<)?([^\s<>@]+@[^\s<>@]+\.[^\s<>@]+)>?$/);
 return m?m[1].toLowerCase():null;
}
function content(message,account){
 const texts=[];let attachments=false,nodes=0;
 function walk(p,depth=0){
  if(!p||++nodes>100||depth>10)throw Error('mime_limit');
  if(p.filename||p.body?.attachmentId){attachments=true;return;}
  if(p.mimeType==='text/plain'&&p.body?.data){
   if(p.body.data.length>30000)throw Error('body_limit');
   const raw=atob(p.body.data.replace(/-/g,'+').replace(/_/g,'/'));
   texts.push(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(raw,c=>c.charCodeAt(0))));
  }
  for(const child of p.parts||[])walk(child,depth+1);
 }
 walk(message.payload);const body=texts.join('\n').trim();
 if(!body||body.length>5000)throw Error('body_review');
 // Private locator only. Does not fetch media or establish source-file permissions.
 return {body,attachment_reference:attachments?`Gmail private source: ${account}; message ${message.id}; attachments require authorized source review`:''};
}
async function stableUuid(value){
 const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));
 bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
 const h=Array.from(bytes.slice(0,16),b=>b.toString(16).padStart(2,'0')).join('');
 return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}
async function importCheckedReply(message,env,config={},ownerMatch){
 if(config.enabled!==true||config.authorizedMailbox!=='east.yorker111@gmail.com'||config.verifiedRecipient!=='hello@vianovamarketing.ca')return {state:'disabled',stored:false};
 try{
  if(!providerId(message?.id)||!providerId(message?.threadId))return hold('invalid_provider_reference');
  if((message.labelIds||[]).some(x=>['SENT','DRAFT','SPAM','TRASH'].includes(x)))return hold('not_eligible_incoming');
  // Conservative single From/To. Multi-recipient, forwarded or changed participants need owner review.
  const from=mailbox(header(message,'From')),to=mailbox(header(message,'To'));
  if(!from||to!==config.verifiedRecipient||from===config.authorizedMailbox)return hold('identity_or_recipient');
  const subject=header(message,'Subject');
  if(/^\s*(?:fw|fwd):/i.test(subject))return hold('forwarded_message_review');
  const refs=[...new Set(Array.from(subject.matchAll(reference),m=>m[1].toLowerCase()))];
  if(refs.length>1||/\[(?!VNM:)[A-Z][A-Z0-9_-]*:/i.test(subject))return hold('ambiguous_business_reference');
  const provider=`gmail:${config.authorizedMailbox}:${message.id}`;
  const thread=`gmail:${config.authorizedMailbox}:${message.threadId}`;
  const linked=await env.DB.prepare("SELECT DISTINCT enquiry_id FROM communication_messages WHERE channel='email' AND source='verified_import' AND provider_thread_id=?").bind(thread).all();
  const known=(linked.results||[]).map(r=>r.enquiry_id);
  if(known.length>1||(refs.length&&known.some(id=>id!==refs[0])))return hold('thread_reference_conflict');
  if(ownerMatch&&((refs.length&&refs[0]!==ownerMatch)||known.some(id=>id!==ownerMatch)))return hold('owner_match_reference_conflict');
  const enquiryId=ownerMatch||refs[0]||known[0];if(!enquiryId)return hold('unassigned_reference');
  const enquiry=await env.DB.prepare('SELECT id,email,is_test FROM enquiries WHERE id=?').bind(enquiryId).first();
  if(!enquiry||enquiry.email.toLowerCase()!==from)return hold('unverified_participant');
  if(Boolean(enquiry.is_test)!==(config.allowTests===true))return hold('test_live_boundary');
  const timestamp=Number(message.internalDate);
  if(!Number.isSafeInteger(timestamp)||timestamp<0||timestamp>8640000000000000)return hold('invalid_time');
  let text;try{text=content(message,config.authorizedMailbox);}catch{return hold('body_or_attachment_review');}
  const receipt=await recordCommunication({id:await stableUuid(provider),enquiry_id:enquiry.id,channel:'email',direction:'incoming',provider_message_id:provider,provider_thread_id:thread,occurred_at:new Date(timestamp).toISOString(),...text,delivery_state:'received',workflow:'qualification',sender_role:'customer'},env,'verified_import');
  if(receipt.status===409)return hold('duplicate_content_conflict');
  if(receipt.status!==200)return hold('message_validation');
  const saved=await receipt.json();return {state:'stored',stored:true,id:saved.id,enquiry_id:enquiry.id,originalRetained:true,sentByThisAction:false};
 }catch{return {state:'retry',reason:'storage_not_confirmed',stored:false,originalRetained:true};}
}

export async function importGmailReply(message,env,config={}){
 if(!gmailEnabled(config))return {state:'disabled',stored:false};
 try{
  const pending=await pendingReply(env,config,message?.id,message);
  // Freeze the mapping while recording. A crash in processing may be replayed
  // with the same fingerprint/mapping; owner changes cannot race the writer.
  if(pending.state!=='imported'){
   const claim=crypto.randomUUID();
   await env.DB.prepare("UPDATE gmail_pending_replies SET state='processing',reason=?,revision=revision+1 WHERE provider_key=? AND revision=?").bind(claim,pending.provider_key,pending.revision).run();
   const current=await env.DB.prepare('SELECT reason FROM gmail_pending_replies WHERE provider_key=?').bind(pending.provider_key).first();
   if(current.reason!==claim)return {state:'retry',reason:'concurrent_processing',stored:false,durablePending:true,originalRetained:true};
  }
  // Only an audited explicit match may fill an absent reference. Participant and
  // foreign-reference checks still run; owner assignment never bypasses them.
  const audit=pending.enquiry_id?await env.DB.prepare('SELECT id FROM gmail_reply_match_audit WHERE provider_key=? AND next_enquiry_id=? LIMIT 1').bind(pending.provider_key,pending.enquiry_id).first():null;
  const result=await importCheckedReply(message,env,config,audit?pending.enquiry_id:undefined);
  return await finishPending(env,pending.provider_key,result);
 }catch{return {state:'retry',reason:'pending_or_storage_not_confirmed',stored:false,originalRetained:true,durablePending:false};}
}

export async function replayPendingReply(reader,env,config={},messageId){
 if(!gmailEnabled(config)||!validGmailId(messageId))return {state:'disabled',stored:false};
 try{
  if(await reader.account()!==config.authorizedMailbox)return {state:'blocked',reason:'wrong_mailbox',stored:false};
  const row=await env.DB.prepare('SELECT provider_key FROM gmail_pending_replies WHERE provider_key=?').bind(gmailKey(config.authorizedMailbox,messageId)).first();
  if(!row)return hold('pending_reference_not_found');
  const message=await reader.get(messageId,{format:'full'});
  if(message.id!==messageId)return hold('provider_reference_mismatch');
  return importGmailReply(message,env,config);
 }catch{return {state:'retry',reason:'provider_read_failed',stored:false,originalRetained:true};}
}

// One bounded provider page. Persist review outcomes and cursor before advancing;
// this module cannot mark messages read, move/delete them, send, or schedule itself.
export async function collectGmailReplyPage(reader,env,config={},pageToken){
 if(config.enabled!==true||config.authorizedMailbox!=='east.yorker111@gmail.com'||config.verifiedRecipient!=='hello@vianovamarketing.ca')return {state:'disabled',results:[],advanceAllowed:false};
 try{
  if(await reader.account()!==config.authorizedMailbox)return {state:'blocked',reason:'wrong_mailbox',results:[],advanceAllowed:false};
  await env.DB.prepare('INSERT OR IGNORE INTO gmail_reply_cursor (mailbox,last_checked) VALUES (?,?)').bind(config.authorizedMailbox,new Date().toISOString()).run();
  const cursor=await env.DB.prepare('SELECT * FROM gmail_reply_cursor WHERE mailbox=?').bind(config.authorizedMailbox).first();
  if(pageToken!==undefined&&pageToken!==cursor.page_token)return {state:'blocked',reason:'stale_page_cursor',results:[],advanceAllowed:false};
  const page=await reader.list({q:'to:hello@vianovamarketing.ca -in:spam -in:trash -in:sent -in:drafts',maxResults:25,pageToken:cursor.page_token||undefined,includeSpamTrash:false});
  if(!Array.isArray(page.messages||[])||(page.messages||[]).length>25)throw Error('page_limit');
  const results=[];
  for(const item of page.messages||[]){
   if(!providerId(item.id)){results.push({state:'needs_review',reason:'invalid_provider_reference',stored:false});continue;}
   try{
    const message=await reader.get(item.id,{format:'full'});
    if(message.id!==item.id)results.push({state:'needs_review',reason:'provider_reference_mismatch',stored:false});
    else results.push({providerId:item.id,...await importGmailReply(message,env,config)});
   }catch{
    const result={providerId:item.id,state:'retry',reason:'provider_read_failed',stored:false};
    try{const pending=await pendingReply(env,config,item.id);results.push(await finishPending(env,pending.provider_key,result));}
    catch{results.push({...result,durablePending:false});}
   }
  }
  const next=page.nextPageToken||null;
  if(next!==null&&(typeof next!=='string'||next.length>2000))throw Error('invalid_page_token');
  let advanceAllowed=false;
  if(results.every(r=>r.durablePending===true)){
   await env.DB.prepare('UPDATE gmail_reply_cursor SET page_token=?,revision=revision+1,last_checked=? WHERE mailbox=? AND revision=?').bind(next,new Date().toISOString(),config.authorizedMailbox,cursor.revision).run();
   const saved=await env.DB.prepare('SELECT revision,page_token FROM gmail_reply_cursor WHERE mailbox=?').bind(config.authorizedMailbox).first();
   advanceAllowed=saved.revision===cursor.revision+1&&saved.page_token===next;
  }
  return {state:results.every(r=>r.stored)?'stored':'needs_review',results,nextPageToken:next,advanceAllowed,originalsRetained:true};
 }catch{return {state:'retry',reason:'provider_read_failed',results:[],advanceAllowed:false};}
}
