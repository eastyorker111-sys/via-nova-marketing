// Read-only, bounded REST transport. No token acquisition, refresh, sending or schedule.
import {validGmailId} from './gmail-pending.mjs';
export const MAILBOX='east.yorker111@gmail.com';
export const RECIPIENT='vianovamarketing@outlook.com';
export const REPLY_QUERY='to:vianovamarketing@outlook.com subject:VNM -from:east.yorker111@gmail.com -in:spam -in:trash -in:sent -in:drafts';
export function readerReady(env){return env.GMAIL_READ_AUTHORIZED==='true'&&env.GMAIL_ROUTE_VERIFIED==='true'&&Boolean(env.GMAIL_ACCESS_TOKEN);}
export function createGmailReader(env,fetcher=fetch,permittedIds=[]){
 const allowed=new Set(permittedIds.filter(validGmailId));let verified=false;
 async function request(path,params={}){
  if(!readerReady(env))throw Error('gmail_access_not_verified');
  const url=new URL('https://gmail.googleapis.com/gmail/v1/users/me/'+path);
  for(const [key,value] of Object.entries(params))if(value!==undefined)url.searchParams.set(key,String(value));
  const response=await fetcher(url,{method:'GET',redirect:'error',signal:AbortSignal.timeout(8000),headers:{Authorization:`Bearer ${env.GMAIL_ACCESS_TOKEN}`}});
  if(!response.ok)throw Error(response.status===401?'gmail_access_expired':response.status===403?'gmail_access_denied':'gmail_unavailable');
  const reader=response.body.getReader();let size=0;const chunks=[];
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>350000){await reader.cancel();throw Error('gmail_response_too_large');}chunks.push(value);}}finally{reader.releaseLock();}
  const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
  return JSON.parse(new TextDecoder().decode(bytes));
 }
 return {
  async account(){verified=false;const p=await request('profile');if(p.emailAddress!==MAILBOX)throw Error('wrong_mailbox');verified=true;return p.emailAddress;},
  async list({q,pageToken}){
   if(!verified||q!==REPLY_QUERY)throw Error('business_scope_required');
   if(pageToken!==undefined&&(typeof pageToken!=='string'||pageToken.length>2000))throw Error('invalid_cursor');
   const page=await request('messages',{q:REPLY_QUERY,maxResults:5,includeSpamTrash:false,pageToken});
   if(!Array.isArray(page.messages||[])||(page.messages||[]).length>5)throw Error('gmail_page_limit');
   for(const m of page.messages||[])if(validGmailId(m.id))allowed.add(m.id);
   return page;
  },
  async get(id){if(!verified||!validGmailId(id)||!allowed.has(id))throw Error('scoped_message_required');return request('messages/'+encodeURIComponent(id),{format:'full'});}
 };
}
