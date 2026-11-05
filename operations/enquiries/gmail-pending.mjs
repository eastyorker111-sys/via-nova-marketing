// Private metadata only: no subjects, addresses of correspondents, bodies or attachments.
export const gmailEnabled=c=>c?.enabled===true&&c.authorizedMailbox==='east.yorker111@gmail.com'&&c.verifiedRecipient==='vianovamarketing@outlook.com';
export const gmailKey=(account,id)=>`gmail:${account}:${id}`;
export const validGmailId=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{1,128}$/.test(id);
export async function messageFingerprint(m){
 const text=JSON.stringify([m.id,m.threadId,m.internalDate,m.payload]);
 if(text.length>250000)throw Error('bounded_message_required');
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join('');
}
export async function pendingReply(env,config,id,message){
 if(!gmailEnabled(config)||!validGmailId(id))throw Error('disabled_or_invalid_reference');
 const key=gmailKey(config.authorizedMailbox,id),now=new Date().toISOString();
 const hash=message?await messageFingerprint(message):null;
 const thread=validGmailId(message?.threadId)?message.threadId:null;
 await env.DB.prepare('INSERT OR IGNORE INTO gmail_pending_replies (provider_key,mailbox,message_id,thread_id,source_reference,message_hash,first_seen,last_seen) VALUES (?,?,?,?,?,?,?,?)').bind(key,config.authorizedMailbox,id,thread,`Gmail private message ${id}`,hash,now,now).run();
 // Hydrate metadata after an earlier provider-read failure, never overwrite a fingerprint.
 await env.DB.prepare('UPDATE gmail_pending_replies SET message_hash=COALESCE(message_hash,?),thread_id=COALESCE(thread_id,?),last_seen=?,attempts=attempts+1 WHERE provider_key=?').bind(hash,thread,now,key).run();
 const row=await env.DB.prepare('SELECT * FROM gmail_pending_replies WHERE provider_key=?').bind(key).first();
 if(hash&&row.message_hash!==hash)throw Error('source_message_changed');
 return row;
}
export async function finishPending(env,key,result){
 // Imported is terminal: a failed or delayed competing retry cannot downgrade it.
 const state=result.stored?'imported':result.state==='retry'?'retry':'needs_review';
 await env.DB.prepare("UPDATE gmail_pending_replies SET state=?,reason=?,classification=CASE WHEN ? IS NOT NULL THEN 'marketing' ELSE classification END,enquiry_id=COALESCE(enquiry_id,?),last_seen=? WHERE provider_key=? AND state!='imported'").bind(state,result.reason||'',result.enquiry_id||null,result.enquiry_id||null,new Date().toISOString(),key).run();
 return {...result,durablePending:true};
}
export async function matchPendingReply(env,config,input,owner){
 // Owner context must be supplied by a future authenticated server boundary, never request JSON.
 if(!gmailEnabled(config)||owner?.verified!==true||owner.email!==config.authorizedMailbox)return {state:'blocked',reason:'owner_authorization_required'};
 if(input.confirmMarketing!==true||!Number.isSafeInteger(input.revision)||!validGmailId(input.messageId)||!/^([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i.test(input.enquiryId||'')||typeof input.evidenceReference!=='string'||!input.evidenceReference.trim()||input.evidenceReference.length>200||/[\r\n\x00-\x1f]/.test(input.evidenceReference))return {state:'blocked',reason:'explicit_match_and_evidence_required'};
 const key=gmailKey(config.authorizedMailbox,input.messageId);
 const enquiry=await env.DB.prepare('SELECT id,is_test FROM enquiries WHERE id=?').bind(input.enquiryId).first();
 if(!enquiry||Boolean(enquiry.is_test)!==(config.allowTests===true))return {state:'blocked',reason:'business_or_test_boundary'};
 const auditId=crypto.randomUUID(),now=new Date().toISOString();
 // One transaction ties an explicit owner assignment to its audit; stale revisions lose.
 await env.DB.batch([
  env.DB.prepare("INSERT INTO gmail_reply_match_audit (id,provider_key,actor,changed_at,previous_revision,previous_enquiry_id,next_enquiry_id,evidence_reference) SELECT ?,provider_key,?,?,revision,enquiry_id,?,? FROM gmail_pending_replies WHERE provider_key=? AND revision=? AND state IN ('pending','needs_review','retry','matched') AND NOT EXISTS(SELECT 1 FROM communication_messages WHERE channel='email' AND provider_message_id=provider_key)").bind(auditId,owner.email,now,input.enquiryId,input.evidenceReference,key,input.revision),
  env.DB.prepare("UPDATE gmail_pending_replies SET enquiry_id=?,classification='marketing',state='matched',revision=revision+1,last_seen=? WHERE provider_key=? AND revision=? AND EXISTS(SELECT 1 FROM gmail_reply_match_audit WHERE id=?)").bind(input.enquiryId,now,key,input.revision,auditId)
 ]);
 const saved=await env.DB.prepare('SELECT id FROM gmail_reply_match_audit WHERE id=?').bind(auditId).first();
 return saved?{state:'matched',revision:input.revision+1,auditId}:{state:'conflict',reason:'stale_or_imported_record'};
}
