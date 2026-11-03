const json=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export async function retention(params,env){
 if(params.get('export')==='case'){
  const id=params.get('id');if(!/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(id||''))return json(400,{error:'A valid enquiry reference is required'});
  const tables=['enquiries','notification_outbox','owner_audit','communication_messages'];
  const data=await env.DB.batch(tables.map(table=>env.DB.prepare(`SELECT * FROM ${table} WHERE ${table==='enquiries'?'id':'enquiry_id'}=? ORDER BY ${table==='notification_outbox'?'enquiry_id':'id'} LIMIT 1001`).bind(id)));
  if(!data[0].results.length)return json(404,{error:'Marketing enquiry not found'});
  if(data.some(t=>t.results.length>1000))return json(413,{error:'Case exceeds export limit. Request a complete authorized D1 export; no partial file returned.'});
  return json(200,{format:'via-nova-marketing-case-review',version:1,id,exportedAt:new Date().toISOString(),purpose:'Internal review only. Check identity and remove internal notes before any customer disclosure.',tables:tables.map((table,i)=>({table,rows:data[i].results.map(({payload_hash,...row})=>row)}))});
 }
 const cutoff=params.get('review_before');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(cutoff||'')||!Number.isFinite(Date.parse(cutoff))||new Date(cutoff).toISOString().slice(0,10)!==cutoff)return json(400,{error:'Choose a valid review cutoff date; this is not a deletion deadline.'});
 const data=await env.DB.prepare(`SELECT * FROM (SELECT e.id,e.received_at,e.owner_status,e.follow_up_due,e.is_test,MAX(e.received_at,COALESCE((SELECT MAX(changed_at) FROM owner_audit WHERE enquiry_id=e.id),e.received_at),COALESCE((SELECT MAX(recorded_at) FROM communication_messages WHERE enquiry_id=e.id),e.received_at)) AS last_activity,(SELECT COUNT(*) FROM communication_messages WHERE enquiry_id=e.id) AS messages FROM enquiries e) WHERE last_activity<? AND (?=1 OR is_test=0) ORDER BY last_activity,id LIMIT 1001`).bind(cutoff+'T00:00:00.000Z',params.get('include_tests')==='true'?1:0).all();
 if(data.results.length>1000)return json(413,{error:'More than 1,000 review candidates. Use a complete authorized D1 review export; no partial list returned.'});
 return json(200,{rows:data.results,reviewBefore:cutoff,checkedAt:new Date().toISOString(),automaticDeletion:false,retentionPeriod:'not_decided',scope:'Recorded Marketing database activity only; check mailbox, workbook, contracts and disputes separately.'});
}
