// Disabled, server-side adapter. No HTTP route, credentials, Gmail grants or schedule.
// A future authorized reader supplies full Gmail messages; originals stay in Gmail.
import {recordCommunication} from './communications.mjs';
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
export async function importGmailReply(message,env,config={}){
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
  const enquiryId=refs[0]||known[0];if(!enquiryId)return hold('unassigned_reference');
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

// One bounded provider page. Caller must persist review outcomes before advancing;
// this module cannot mark messages read, move/delete them, send, or schedule itself.
export async function collectGmailReplyPage(reader,env,config={},pageToken){
 if(config.enabled!==true||config.authorizedMailbox!=='east.yorker111@gmail.com'||config.verifiedRecipient!=='hello@vianovamarketing.ca')return {state:'disabled',results:[],advanceAllowed:false};
 try{
  if(await reader.account()!==config.authorizedMailbox)return {state:'blocked',reason:'wrong_mailbox',results:[],advanceAllowed:false};
  const page=await reader.list({q:'to:hello@vianovamarketing.ca -in:spam -in:trash -in:sent -in:drafts',maxResults:25,pageToken,includeSpamTrash:false});
  if(!Array.isArray(page.messages||[])||(page.messages||[]).length>25)throw Error('page_limit');
  const results=[];
  for(const item of page.messages||[]){
   if(!providerId(item.id)){results.push({state:'needs_review',reason:'invalid_provider_reference',stored:false});continue;}
   try{
    const message=await reader.get(item.id,{format:'full'});
    if(message.id!==item.id)results.push({state:'needs_review',reason:'provider_reference_mismatch',stored:false});
    else results.push({providerId:item.id,...await importGmailReply(message,env,config)});
   }catch{results.push({providerId:item.id,state:'retry',reason:'provider_read_failed',stored:false});}
  }
  return {state:results.every(r=>r.stored)?'stored':'needs_review',results,nextPageToken:page.nextPageToken||null,advanceAllowed:results.every(r=>r.stored),originalsRetained:true};
 }catch{return {state:'retry',reason:'provider_read_failed',results:[],advanceAllowed:false};}
}
