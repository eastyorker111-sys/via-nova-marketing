// Vercel Authentication must cover ALL deployments, as for the existing inbox.
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');
 const fail=(code,error)=>res.status(code).json({error});
 if(!['GET','POST'].includes(req.method))return fail(405,'Method not allowed');
 if(process.env.OWNER_INBOX_ENABLED!=='true'||!process.env.ENQUIRY_ADMIN_TOKEN)return fail(503,'Private inbox is not configured');
 if(req.method==='POST'&&(req.headers.origin!==`https://${req.headers.host}`||req.headers['x-vnm-action']!=='review-reply'))return fail(403,'Open the private reply review to make changes');
 try{
  const url=new URL('/api/admin/replies',process.env.ENQUIRY_BACKEND_URL);
  for(const key of ['before','before_id'])if(req.query?.[key])url.searchParams.set(key,String(req.query[key]));
  const body=req.method==='POST'?JSON.stringify(req.body):undefined;
  if(body&&body.length>4000)return fail(413,'Request too large');
  const response=await fetch(url,{method:req.method,redirect:'error',signal:AbortSignal.timeout(55000),headers:{Authorization:`Bearer ${process.env.ENQUIRY_ADMIN_TOKEN}`,'Content-Type':'application/json'},body});
  return res.status(response.status).json(await response.json());
 }catch{return fail(503,'Reply operation not confirmed. Keep your selection and retry.');}
}
