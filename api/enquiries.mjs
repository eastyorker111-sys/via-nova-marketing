export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');
 const fail=(code,error)=>res.status(code).json({error});
 if(req.method!=='POST')return fail(405,'Use the website enquiry form');
 if(req.headers.origin!==`https://${req.headers.host}`)return fail(403,'Open the form on our website');
 if(!String(req.headers['content-type']||'').startsWith('application/json'))return fail(415,'Use the website form or contact us by email');
 if(!process.env.ENQUIRY_PROXY_TOKEN)return fail(503,'Enquiries are temporarily unavailable. Please email vianovamarketing@outlook.com.');
 try{
  const body=JSON.stringify(req.body);if(body.length>24576)return fail(413,'Please shorten your message');
  const target=new URL('/api/enquiries',process.env.ENQUIRY_BACKEND_URL);
  const result=await fetch(target,{method:'POST',redirect:'error',signal:AbortSignal.timeout(15000),headers:{'Content-Type':'application/json',Origin:'https://vianovamarketing.ca','X-VNM-Proxy':process.env.ENQUIRY_PROXY_TOKEN,'X-VNM-Visitor':String(req.headers['x-vercel-forwarded-for']||req.headers['x-real-ip']||'unknown').slice(0,100)},body});
  return res.status(result.status).json(await result.json());
 }catch{return fail(503,'Storage could not be confirmed. Keep your details and retry using the same reference.');}
}
