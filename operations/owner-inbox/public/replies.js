(()=>{
 const get=id=>document.getElementById(id),state=get('connection'),list=get('reply-list');
 const drafts=new Set();let busy=false,next=null,ready=false;
 const node=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
 const say=text=>{state.textContent=text;};
 async function api(body,query=''){
  const r=await fetch('/api/replies'+query,body?{method:'POST',headers:{'Content-Type':'application/json','X-VNM-Action':'review-reply'},body:JSON.stringify(body)}:{cache:'no-store'});
  const data=await r.json();if(!r.ok)throw Error(data.error||data.reason||'Operation not confirmed');return data;
 }
 function controls(){get('check').disabled=busy||!ready;get('discover').disabled=busy||!ready;get('refresh').disabled=busy;get('more').disabled=busy;}
 function render(row){
  const card=node('article'),title=node('h2','Reply '+row.message_id),meta=node('p',`${row.state} · ${row.classification} · ${row.reason||'No review reason'} · Attempts: ${row.attempts}`);meta.className='meta';
  card.append(title,meta,node('p',row.source_reference),node('p','Current enquiry: '+(row.enquiry_id||'Unassigned')));
  const result=node('p');result.setAttribute('role','status');
  if(row.state!=='imported'&&row.state!=='processing'){
   const form=node('form'),enquiry=node('input'),evidence=node('input'),confirm=node('input');
   enquiry.value=row.enquiry_id||'';enquiry.required=true;enquiry.maxLength=36;enquiry.pattern='[0-9a-fA-F-]{36}';
   evidence.required=true;evidence.maxLength=200;confirm.type='checkbox';confirm.required=true;
   for(const [text,input] of [['Existing Marketing enquiry ID',enquiry],['Private evidence reference',evidence],['I reviewed the original and confirm this reply belongs to this Marketing enquiry',confirm]]){const label=node('label',text);label.append(input);form.append(label);}
   const save=node('button','Save explicit match'),discard=node('button','Discard unsaved match');discard.type='button';
   form.append(save,discard);card.append(form);
   form.addEventListener('input',()=>drafts.add(form));
   discard.addEventListener('click',()=>{if(busy)return;enquiry.value=row.enquiry_id||'';evidence.value='';confirm.checked=false;drafts.delete(form);result.textContent='Unsaved match discarded.';});
   form.addEventListener('submit',async event=>{
    event.preventDefault();if(busy)return;busy=true;save.disabled=true;controls();
    try{const r=await api({action:'match',messageId:row.message_id,enquiryId:enquiry.value.trim(),revision:row.revision,confirmMarketing:confirm.checked,evidenceReference:evidence.value.trim()});row.revision=r.revision;row.enquiry_id=enquiry.value.trim();drafts.delete(form);result.textContent='Match saved with audit. Retry this original to attempt recording; participant checks still apply.';}
    catch(error){drafts.add(form);result.textContent=error.message+' Your fields remain on this page. For a conflict, retain your evidence before discarding and refreshing.';}
    finally{busy=false;save.disabled=false;controls();}
   });
  }
  const retry=node('button','Retry original');retry.disabled=!ready;
  retry.addEventListener('click',async()=>{
   if(busy)return;if(drafts.size){say('Save or discard unsaved matches before retrying.');return;}
   busy=true;retry.disabled=true;controls();
   try{const r=await api({action:'retry',messageId:row.message_id});result.textContent=r.stored?'Stored in the existing conversation history. No message sent. Refresh to see the current review state.':`Not imported: ${r.reason||r.state}. Original retained. Refresh before changing its match.`;}
   catch(error){result.textContent=error.message+' Original retained; retry is safe.';}
   finally{busy=false;retry.disabled=!ready;controls();}
  });
  card.append(retry,result);list.append(card);
 }
 async function load(older=false){
  if(busy)return;if(drafts.size){say('Save or discard unsaved matches before refreshing.');return;}
  busy=true;controls();
  try{const q=older&&next?'?'+new URLSearchParams(next):'';const r=await api(null,q);
   if(drafts.size){say('A match was edited during refresh; your fields were preserved.');return;}
   ready=r.readerReady===true;if(!older)list.replaceChildren();(r.rows||[]).forEach(render);next=r.next||null;get('more').hidden=!next;
   say(r.configured?`${(r.rows||[]).length} references loaded. ${ready?'Read access is configured; check it before collection.':'Gmail reader disabled or awaiting route/access verification.'}`:'Reply review is prepared but not activated. No mailbox messages were read.');
   get('last-check').textContent=r.lastDiscoveryAt?'Last recorded discovery: '+r.lastDiscoveryAt:'No discovery execution recorded.';
  }catch(error){say(error.message+' Existing list and fields preserved.');}finally{busy=false;controls();}
 }
 for(const action of ['check','discover'])get(action).addEventListener('click',async()=>{
  if(busy||!ready)return;if(drafts.size){say('Save or discard unsaved matches first.');return;}
  busy=true;controls();try{const r=await api({action});say(action==='check'?'Correct mailbox verified now. This does not prove forwarding or future access.':`Collection result: ${r.state}. Refresh the review list. Originals retained; no mail sent.`);}catch(error){say(error.message);}finally{busy=false;controls();}
 });
 get('refresh').addEventListener('click',()=>load());get('more').addEventListener('click',()=>load(true));
 window.addEventListener('beforeunload',event=>{if(drafts.size||busy){event.preventDefault();event.returnValue='';}});
 load();
})();
