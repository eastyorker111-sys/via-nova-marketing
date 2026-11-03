// This entire project must have Vercel Authentication enabled for ALL deployments.
// No custom/public domain or share links. The backend credential never reaches a browser.
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');
  const fail=(status,error)=>res.status(status).json({error});
  if(!['GET','PATCH'].includes(req.method))return fail(405,'Method not allowed');
  if(process.env.OWNER_INBOX_ENABLED!=='true'||!process.env.ENQUIRY_ADMIN_TOKEN)return fail(503,'Private inbox is not configured');
  if(req.method==='PATCH'){
    const host=req.headers.host;
    if(req.headers.origin!==`https://${host}`||req.headers['x-vnm-action']!=='owner-update')return fail(403,'Open the private inbox to update records');
  }
  try{
    const url=new URL('/api/admin/enquiries',process.env.ENQUIRY_BACKEND_URL);
    if(req.query?.before)url.searchParams.set('before',String(req.query.before));
    if(req.query?.before_id)url.searchParams.set('before_id',String(req.query.before_id));
    if(req.query?.export==='backup')url.searchParams.set('export','backup');
    const body=req.method==='PATCH'?JSON.stringify(req.body):undefined;
    if(body&&body.length>12000)return fail(413,'Notes are too long');
    const r=await fetch(url,{method:req.method,redirect:'error',signal:AbortSignal.timeout(15000),headers:{Authorization:`Bearer ${process.env.ENQUIRY_ADMIN_TOKEN}`,'Content-Type':'application/json'},body});
    const data=await r.json();return res.status(r.status).json(data);
  }catch{return fail(503,'Could not reach the enquiry store. Keep your notes and retry.');}
}
