// Owner recording only: this page has no customer-send operation.
window.attachCommunication=(card,record,{dirty,saving})=>{
 const make=(tag,text='')=>{const n=document.createElement(tag);n.textContent=text;return n;};
 const section=make('section'),heading=make('h3','Communication timeline'),status=make('p'),list=make('div');
 section.setAttribute('aria-label',`Communication for enquiry ${record.id}`);status.setAttribute('role','status');
 section.append(heading,make('p','Automatic email import is not connected. Website enquiries are saved here; Outlook replies currently need recording below. WhatsApp synchronization remains deferred. Entries below are manual records, not proof of provider delivery. Recording does not send a message. WhatsApp uses one number shared by five businesses. Record here only after explicitly confirming Via Nova Marketing and this enquiry reference. Keep ambiguous messages unassigned for owner review in the shared channel; never infer the business from a phone number.'),status,list);card.append(section);
 const emailHelp=make('details'),summary=make('summary','Find and record email replies');emailHelp.append(summary,make('p','Your business mailbox is vianovamarketing@outlook.com. Reply using your installed email app and keep the enquiry reference in the subject. Select the Via Nova Marketing sender before sending. Internal website alerts are not customer replies.'));
 const reference='[VNM:'+record.id+']',subject=make('input');subject.readOnly=true;subject.value=reference;const referenceLabel=make('label','Email subject reference ');referenceLabel.append(subject);emailHelp.append(referenceLabel);
 const reply=make('a','Write email with enquiry reference');
 const safeEmail=typeof record.email==='string'&&/^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(record.email);
 if(safeEmail){reply.href='mailto:'+encodeURIComponent(record.email)+'?subject='+encodeURIComponent('Via Nova Marketing '+reference);emailHelp.append(reply);}
 emailHelp.append(make('p','This opens an email draft; it does not send or save a CRM message. For an existing reply, search the enquiry reference in your Outlook app. Record the relevant text below with Incoming / Received. After sending an email, record it as Outgoing / Sent elsewhere. Attachments stay in the original mailbox.'));section.append(emailHelp);
 const reload=make('button','Refresh timeline'),older=make('button','Load older messages');reload.type=older.type='button';older.hidden=true;section.append(reload,older);
 let cursor=null,reading=false;
 const states={received:'Received — owner recorded',draft:'Draft — not sent',recorded_sent:'Sent elsewhere — owner reported',failed:'Failed elsewhere — owner reported'};
 async function read(append=false){
  if(reading)return;reading=true;reload.disabled=older.disabled=true;status.textContent='Loading saved messages…';
  try{const query=new URLSearchParams({enquiry_id:record.id,...(append?cursor:{})});const response=await fetch('/api/messages?'+query,{credentials:'same-origin',cache:'no-store'});const data=await response.json();if(!response.ok)throw Error(data.error||'Could not load messages');
   if(!append)list.replaceChildren();for(const row of data.rows){const item=make('div');item.className='communication-entry';
    item.append(make('h4',`${row.channel} · ${row.direction} · ${states[row.delivery_state]||row.delivery_state}`),make('p',`Occurred: ${row.occurred_at} · Recorded: ${row.recorded_at} · Source: ${row.source==='manual'?'Manual owner entry':'Verified import'}`));
    item.append(make('p',`Sender role: ${row.sender_role||'not specified'} · Protected attachment reference: ${row.attachment_reference||'none'}`));
    const body=make('p',row.body);body.className='message';item.append(body,make('p',`Workflow: ${row.workflow} · Project: ${row.project_reference||'not linked'} · Invoice: ${row.invoice_reference||'not linked'}`),make('p',`Message reference: ${row.id}${row.provider_message_id?' · Provider message: '+row.provider_message_id:''}${row.provider_thread_id?' · Provider thread: '+row.provider_thread_id:''}`));list.append(item);
   }cursor=data.next;older.hidden=!cursor;status.textContent=data.rows.length?'Saved timeline loaded. No messages sent.':'No saved messages. Original enquiry remains above.';
  }catch(error){status.textContent=error.message+' Previously displayed messages may be old. Retry refresh.';}finally{reading=false;reload.disabled=older.disabled=false;}
 }
 reload.addEventListener('click',()=>read());older.addEventListener('click',()=>read(true));
 const form=make('form');form.setAttribute('aria-label',`Record communication for ${record.id}`);const controls={};
 function field(name,label,options){const input=make(options?'select':name==='body'?'textarea':'input');input.name=name;input.autocomplete='off';
  if(options)for(const [value,text] of options){const option=make('option',text);option.value=value;input.append(option);}else{input.type=name==='occurred_at'?'datetime-local':'text';input.maxLength=name==='body'?5000:name.startsWith('provider_')?300:120;}
  const wrapper=make('label',label+' ');wrapper.append(input);form.append(wrapper);controls[name]=input;return input;
 }
 field('channel','Channel',[['email','Email'],['whatsapp','WhatsApp'],['phone','Phone'],['other','Other']]);
 field('direction','Direction',[['incoming','Incoming'],['outgoing','Outgoing']]);
 const delivery=field('delivery_state','Message state',[['received',states.received]]);
 function setStates(){delivery.replaceChildren();for(const value of controls.direction.value==='incoming'?['received']:['draft','recorded_sent','failed']){const option=make('option',states[value]);option.value=value;delivery.append(option);}delivery.value=controls.direction.value==='incoming'?'received':'draft';}
 controls.direction.addEventListener('change',setStates);
 field('workflow','Related work',[['qualification','Qualification'],['proposal','Proposal'],['delivery','Delivery'],['invoice','Invoice'],['support','Support']]);
 const time=field('occurred_at','When it happened (your local time)');time.required=true;
 const now=new Date();time.value=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,16);
 field('sender_role','Sender role',[['not_specified','Not specified'],['customer','Customer'],['business','Business'],['supplier','Supplier'],['other','Other']]);
 field('body','Message or call notes').required=true;
 const attachment=field('attachment_reference','Protected attachment reference (optional; file stays in its source)');attachment.maxLength=500;form.append(make('p','Reference only: attachments remain in the authorized mailbox, private Drive folder or project files. Do not paste access tokens or public sharing links. This form does not upload, share or fetch files. Verify source permissions before referring to an attachment.'));
 field('project_reference','Project reference (optional)');field('invoice_reference','Invoice reference (optional)');
 field('provider_message_id','Provider message ID (optional; must be exact)');field('provider_thread_id','Provider thread ID (optional)');
 const submit=make('button','Record message — does not send'),discard=make('button','Discard unsaved message'),feedback=make('p');submit.type='submit';discard.type='button';feedback.setAttribute('role','status');feedback.tabIndex=-1;
 form.append(submit,discard,feedback);section.append(form);
 const key='message:'+record.id;let pending=null,busy=false;
 form.addEventListener('input',()=>dirty.add(key));form.addEventListener('change',()=>dirty.add(key));
 const lock=value=>{for(const control of Object.values(controls))control.disabled=value;discard.disabled=value;};
 discard.addEventListener('click',()=>{if(pending)return;form.reset();time.value=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16);setStates();dirty.delete(key);feedback.textContent='Unsaved message discarded.';});
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;
  if(!pending){if(!form.reportValidity())return;pending={id:crypto.randomUUID(),enquiry_id:record.id};for(const [name,input] of Object.entries(controls))pending[name]=input.value;pending.occurred_at=new Date(pending.occurred_at).toISOString();}
  busy=true;dirty.add(key);saving.add(key);lock(true);submit.disabled=true;feedback.textContent='Saving record…';
  try{const response=await fetch('/api/messages',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-VNM-Action':'record-message'},body:JSON.stringify(pending)});const data=await response.json();
   if(!response.ok){if([400,404,409,413].includes(response.status)){pending=null;lock(false);}throw Error(data.error||'Save not confirmed');}
   if(!data.stored||data.sentByThisAction!==false||data.enquiry_id!==record.id)throw Error('Save receipt could not be verified');
   pending=null;dirty.delete(key);form.reset();setStates();lock(false);time.value=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16);feedback.textContent='Message recorded. Nothing sent to the customer.';await read();
  }catch(error){feedback.textContent=error.message+(pending?' Your original entry is locked for a safe retry. Retry uses the same reference and cannot create a duplicate. For a reference conflict, review the saved timeline and reconcile before leaving.':' Your text is retained; correct it and retry.');}
  finally{busy=false;saving.delete(key);submit.disabled=false;submit.textContent=pending?'Retry recording same message':'Record message — does not send';feedback.focus();}
 });
 read();
};
