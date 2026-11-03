// This entire project must have Vercel Authentication enabled for ALL deployments.
// No custom/public domain or share links. The backend credential never reaches a browser.
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');
  const fail=(status,error)=>res.status(status).json({error});
  if(!['GET','POST'].includes(req.method))return fail(405,'Method not allowed');
  if(process.env.OWNER_INBOX_ENABLED!=='true'||!process.env.ENQUIRY_ADMIN_TOKEN)return fail(503,'Private inbox is not configured');
  if(req.method==='POST'){
    const host=req.headers.host;
    if(req.headers.origin!==`https://${host}`||req.headers['x-vnm-action']!=='record-message')return fail(403,'Open the private inbox to update records');
  }
  try{
    const url=new URL('/api/admin/messages',process.env.ENQUIRY_BACKEND_URL);
    for(const key of ['enquiry_id','message_before','message_before_id'])if(req.query?.[key])url.searchParams.set(key,String(req.query[key]));
    const body=req.method==='POST'?JSON.stringify(req.body):undefined;
    if(body&&body.length>18000)return fail(413,'Message is too long');
    const r=await fetch(url,{method:req.method,redirect:'error',signal:AbortSignal.timeout(15000),headers:{Authorization:`Bearer ${process.env.ENQUIRY_ADMIN_TOKEN}`,'Content-Type':'application/json'},body});
    const data=await r.json();return res.status(r.status).json(data);
  }catch{return fail(503,'Could not reach the enquiry store. Keep your notes and retry.');}
}
