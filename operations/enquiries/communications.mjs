const json=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
export async function recordCommunication(input,env,source='manual'){
 if(!input||!uuid(input.id)||!uuid(input.enquiry_id))return json(400,{error:'Valid message and enquiry references are required'});
 const text=(v,max,required=false)=>typeof v==='string'&&v.length<=max&&(!required||v.trim())&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v);
 if(!['email','whatsapp','phone','other'].includes(input.channel)||!['incoming','outgoing'].includes(input.direction)||!['qualification','proposal','delivery','invoice','support'].includes(input.workflow)||!text(input.body,5000,true)||!text(input.project_reference||'',120)||!text(input.invoice_reference||'',120)||!text(input.provider_message_id||'',300)||!text(input.provider_thread_id||'',300))return json(400,{error:'Check channel, direction, workflow, references and message (maximum 5,000 characters)'});
 if(!['not_specified','customer','business','supplier','other'].includes(input.sender_role||'not_specified')||!text(input.attachment_reference||'',500))return json(400,{error:'Check sender role and protected attachment reference'});
 const states=input.direction==='incoming'?['received']:['draft','recorded_sent','failed'];
 if(!states.includes(input.delivery_state)||!/^\d{4}-\d{2}-\d{2}T/.test(input.occurred_at)||!Number.isFinite(Date.parse(input.occurred_at)))return json(400,{error:'Check message time and delivery state. A draft is never sent automatically.'});
 if(!['manual','verified_import'].includes(source))return json(400,{error:'Invalid source'});
 const enquiry=await env.DB.prepare('SELECT id FROM enquiries WHERE id=?').bind(input.enquiry_id).first();if(!enquiry)return json(404,{error:'Enquiry not found in Via Nova Marketing'});
 const canonicalFields=[input.enquiry_id,input.channel,input.direction,source,input.provider_message_id||null,input.provider_thread_id||null,input.occurred_at,input.body,input.delivery_state,input.workflow,input.project_reference||'',input.invoice_reference||''];
 if(input.sender_role||input.attachment_reference)canonicalFields.push(input.sender_role||'not_specified',input.attachment_reference||'');
 const canonical=JSON.stringify(canonicalFields);
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical))),b=>b.toString(16).padStart(2,'0')).join('');
 await env.DB.prepare('INSERT OR IGNORE INTO communication_messages (id,enquiry_id,channel,direction,source,provider_message_id,provider_thread_id,occurred_at,recorded_at,body,delivery_state,workflow,project_reference,invoice_reference,payload_hash,sender_role,attachment_reference) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(input.id,input.enquiry_id,input.channel,input.direction,source,input.provider_message_id||null,input.provider_thread_id||null,input.occurred_at,new Date().toISOString(),input.body,input.delivery_state,input.workflow,input.project_reference||'',input.invoice_reference||'',hash,input.sender_role||'not_specified',input.attachment_reference||'').run();
 const saved=await env.DB.prepare('SELECT id,payload_hash FROM communication_messages WHERE id=? OR (channel=? AND provider_message_id=?)').bind(input.id,input.channel,input.provider_message_id||null).all();
 if(!saved.results?.length||saved.results.some(r=>r.payload_hash!==hash))return json(409,{error:'This message reference already exists with different content or linkage. Nothing was overwritten; review the original.'});
 return json(200,{ok:true,stored:true,id:saved.results[0].id,enquiry_id:input.enquiry_id,source,delivery_state:input.delivery_state,sentByThisAction:false});
}
export async function communications(request,env){
 const params=new URL(request.url).searchParams;
 if(request.method==='GET'){
  const id=params.get('enquiry_id'),before=params.get('message_before')||'9999',beforeId=params.get('message_before_id')||'ffffffff-ffff-ffff-ffff-ffffffffffff';
  if(!uuid(id)||before.length>80||beforeId.length>36)return json(400,{error:'Invalid conversation cursor'});
  if(!await env.DB.prepare('SELECT id FROM enquiries WHERE id=?').bind(id).first())return json(404,{error:'Enquiry not found in Via Nova Marketing'});
  const data=await env.DB.prepare('SELECT * FROM communication_messages WHERE enquiry_id=? AND (recorded_at<? OR (recorded_at=? AND id<?)) ORDER BY recorded_at DESC,id DESC LIMIT 101').bind(id,before,before,beforeId).all();
  const rows=data.results||[],last=rows[99];return json(200,{rows:rows.slice(0,100).map(({payload_hash,...r})=>r),next:rows.length>100?{message_before:last.recorded_at,message_before_id:last.id}:null,connectors:{email:'pending_access',whatsapp:'pending_access'},source:'Via Nova Marketing dedicated database'});
 }
 if(request.method!=='POST')return json(405,{error:'Method not allowed'});
 if(params.get('import')==='provider')return json(503,{error:'Provider synchronization is disabled pending verified provider authorization and mapping'});
 const raw=await request.text();if(raw.length>18000)return json(413,{error:'Message too large'});
 let input;try{input=JSON.parse(raw)}catch{return json(400,{error:'Invalid message'})}
 return recordCommunication(input,env,'manual');
}
