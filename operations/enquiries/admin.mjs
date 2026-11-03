const json = (status, body) => new Response(JSON.stringify(body), {status, headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function admin(request, env) {
  if (!env.ADMIN_TOKEN || env.ADMIN_TOKEN.length < 40) return json(503,{error:'Private access is not configured'});
  const provided = request.headers.get('Authorization') || '';
  const digest = async value => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
  const [a,b] = await Promise.all([digest(provided),digest(`Bearer ${env.ADMIN_TOKEN}`)]);
  let mismatch=0; for(let i=0;i<a.length;i++) mismatch |= a[i]^b[i];
  if(mismatch) return json(401,{error:'Authentication required'});
  try {
    if(request.method==='GET') {
      const cursor=new URL(request.url).searchParams.get('before') || '9999';
      if(cursor.length>80)return json(400,{error:'Invalid cursor'});
      const data=await env.DB.prepare(`SELECT e.id,e.received_at,e.form_kind,e.name,e.email,e.business,e.message,e.is_test,e.marketing_consent,e.owner_status,e.owner_notes,e.follow_up_due,e.revision,n.state AS notification_state,n.attempts FROM enquiries e LEFT JOIN notification_outbox n ON n.enquiry_id=e.id WHERE e.received_at < ? ORDER BY e.received_at DESC,e.id DESC LIMIT 101`).bind(cursor).all();
      const rows=data.results || [];
      return json(200,{rows:rows.slice(0,100),more:rows.length>100,refreshedAt:new Date().toISOString(),source:'Via Nova Marketing dedicated database',mode:env.MODE||'staging'});
    }
    if(request.method!=='PATCH')return json(405,{error:'Method not allowed'});
    const raw=await request.text();if(raw.length>12000)return json(413,{error:'Update too large'});
    const input=JSON.parse(raw);
    if(!/^[\da-f-]{36}$/i.test(input.id)||!Number.isSafeInteger(input.revision)||input.revision<0||!['New','Discussing','Quoted','Won','Lost','On hold','Spam','Closed'].includes(input.status)||typeof input.notes!=='string'||input.notes.length>5000||(input.due!==''&&!/^\d{4}-\d{2}-\d{2}$/.test(input.due)))return json(400,{error:'Check status, notes and follow-up date'});
    const eventId=crypto.randomUUID(),now=new Date().toISOString();
    // Both audit and update use the expected revision; stale tabs cannot erase owner edits.
    await env.DB.batch([
      env.DB.prepare('INSERT INTO owner_audit (id,enquiry_id,changed_at,actor,previous_revision) SELECT ?,id,?,?,revision FROM enquiries WHERE id=? AND revision=?').bind(eventId,now,'Nabil via private owner inbox',input.id,input.revision),
      env.DB.prepare('UPDATE enquiries SET owner_status=?,owner_notes=?,follow_up_due=?,revision=revision+1 WHERE id=? AND revision=?').bind(input.status,input.notes,input.due||null,input.id,input.revision)
    ]);
    const applied=await env.DB.prepare('SELECT id FROM owner_audit WHERE id=?').bind(eventId).first();
    if(!applied)return json(409,{error:'This record changed elsewhere. Reload before saving; your text is still on screen.'});
    return json(200,{ok:true,id:input.id,revision:input.revision+1});
  } catch {return json(503,{error:'Could not confirm the operation. Keep your notes and refresh before retrying.'});}
}
