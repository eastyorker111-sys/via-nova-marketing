import {filterRecords,needsFollowUp,handoverText} from './crm.mjs';
const $=id=>document.getElementById(id), el=(tag,text,cls)=>{const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n;};
let appliedFilters={query:'',stage:'',followup:''};
let rows=[],loading=false,next=null;
const dirty=new Set(),saving=new Set();
function protectDrafts(){
 if(!dirty.size&&!saving.size)return false;
 $('connection').textContent='Save or discard your unsaved changes before refreshing or changing the filter. Your unsaved text is still on this page.';
 return true;
}
window.addEventListener('beforeunload',event=>{if(dirty.size||saving.size){event.preventDefault();event.returnValue='';}});
function render(){
  $('records').replaceChildren();const live=rows.filter(r=>!r.is_test);
  $('count').textContent=live.length;$('new').textContent=live.filter(r=>r.owner_status==='New').length;$('alerts').textContent=live.filter(r=>r.notification_state!=='sent').length;
  if($('due-count'))$('due-count').textContent=live.filter(r=>needsFollowUp(r)).length;
  const visible=filterRecords(rows,{...appliedFilters,tests:$('tests').checked});
  if($('filter-state'))$('filter-state').textContent=`Showing ${visible.length} of ${rows.length} loaded records. Search and filters apply to loaded records; load older records to search further.`;
  if(!visible.length)$('records').append(el('p','No matching records loaded. Refresh to check for new enquiries.'));
  for(const r of visible){
    const card=el('article','');card.id='enquiry-'+r.id;const title=el('h2',(r.is_test?'TEST · ':'')+r.name);title.id='heading-'+r.id;card.setAttribute('aria-labelledby',title.id);card.append(title);card.append(el('p',`${r.id} · ${r.received_at} · ${r.form_kind} · ${r.email}`,'meta'));
    if(r.business)card.append(el('p',r.business));card.append(el('p',r.message,'message'));
    if(needsFollowUp(r))card.append(el('p','Follow-up due '+r.follow_up_due,'notice'));
    card.append(el('p',`Marketing permission: ${r.marketing_consent}. Email alert: ${r.notification_state||'unknown'}.`,'meta'));
    const form=el('form',''),cols=el('div','','columns'),status=el('select','');
    form.setAttribute('aria-label','Owner fields for enquiry '+r.id);status.name='status';
    for(const value of ['New','Discussing','Quoted','Won','Lost','On hold','Spam','Closed']){const option=el('option',value);option.value=value;status.append(option);}status.value=r.owner_status;
    const statusLabel=el('label','Stage ');statusLabel.append(status);
    const due=document.createElement('input');due.type='date';due.name='follow_up_due';due.value=r.follow_up_due||'';const dueLabel=el('label','Follow-up date ');dueLabel.append(due);cols.append(statusLabel,dueLabel);
    const notes=el('textarea','');notes.name='owner_notes';notes.autocomplete='off';notes.maxLength=5000;notes.value=r.owner_notes;const notesLabel=el('label','Owner notes and next action ');notesLabel.append(notes);
    const customer=document.createElement('input');customer.name='customer_reference';customer.value=r.customer_reference||'';customer.autocomplete='off';const customerLabel=el('label','Customer reference (change only after verifying an existing Marketing customer) ');customerLabel.append(customer);
    const confirmCustomer=document.createElement('input');confirmCustomer.type='checkbox';const confirmLabel=el('label','I verified this customer assignment, independently of name or phone matches ');confirmLabel.append(confirmCustomer);
    const button=el('button','Save owner fields');button.type='submit';const feedback=el('p','');feedback.setAttribute('role','status');feedback.tabIndex=-1;
    const discard=el('button','Discard unsaved changes');discard.type='button';
    form.append(cols,customerLabel,confirmLabel,notesLabel,button,discard,feedback);
    const track=()=>{if(status.value!==r.owner_status||notes.value!==r.owner_notes||due.value!==(r.follow_up_due||'')||customer.value!==(r.customer_reference||''))dirty.add(r.id);else dirty.delete(r.id);};
    form.addEventListener('input',track);form.addEventListener('change',track);
    discard.addEventListener('click',()=>{status.value=r.owner_status;notes.value=r.owner_notes;due.value=r.follow_up_due||'';customer.value=r.customer_reference||'';confirmCustomer.checked=false;dirty.delete(r.id);feedback.textContent='Unsaved changes discarded. Saved record unchanged.';});
    form.addEventListener('submit',async e=>{e.preventDefault();saving.add(r.id);for(const control of [button,discard,status,due,notes,customer,confirmCustomer])control.disabled=true;feedback.textContent='Saving…';try{
      const response=await fetch('/api/enquiries',{method:'PATCH',credentials:'same-origin',headers:{'Content-Type':'application/json','X-VNM-Action':'owner-update'},body:JSON.stringify({id:r.id,revision:r.revision,status:status.value,due:due.value,notes:notes.value,customer_reference:customer.value,confirm_customer_link:confirmCustomer.checked})});
      const result=await response.json();if(!response.ok)throw Error(result.error||'Save could not be confirmed');
      r.revision=result.revision;r.owner_status=status.value;r.owner_notes=notes.value;r.follow_up_due=due.value;r.customer_reference=customer.value;confirmCustomer.checked=false;dirty.delete(r.id);feedback.textContent='Saved. Original submission unchanged.';
    }catch(error){feedback.textContent=error.message;feedback.className='error';}finally{saving.delete(r.id);for(const control of [button,discard,status,due,notes,customer,confirmCustomer])control.disabled=false;feedback.focus();}});
    card.append(form);
    const handover=el('button','Copy project handover');handover.type='button';
    handover.addEventListener('click',async()=>{if(dirty.has(r.id)||saving.has(r.id)){feedback.textContent='Save your owner fields before copying the handover.';return;}try{await navigator.clipboard.writeText(handoverText(r));feedback.textContent='Copied for your private project workbook. No project, invoice, booking or message was created.';}catch{feedback.textContent='Clipboard unavailable. Use the private case export to preserve this record.';}});
    card.append(handover);
    const conversationButton=el('button','Open communication timeline');conversationButton.type='button';
    conversationButton.addEventListener('click',()=>{if(conversationButton.disabled)return;conversationButton.disabled=true;window.attachCommunication(card,r,{dirty,saving});});
    card.append(conversationButton);$('records').append(card);
  }
}
async function refresh(older=false){
 if(loading||protectDrafts())return;loading=true;$('refresh').disabled=true;$('load-older').disabled=true;$('connection').textContent='Refreshing…';
 try{
  const query=older&&next?'?'+new URLSearchParams(next):'';
  const response=await fetch('/api/enquiries'+query,{credentials:'same-origin',cache:'no-store'});const data=await response.json();if(!response.ok)throw Error(data.error||'Request failed');
  if(protectDrafts())return;
  rows=older?[...new Map([...rows,...data.rows].map(r=>[r.id,r])).values()]:data.rows;next=data.next;
  $('connection').textContent=`${data.source} · ${data.mode} · refreshed ${new Date(data.refreshedAt).toLocaleString()}`;
  $('more').textContent=data.more?`${rows.length} records loaded. More records are available.`:`All ${rows.length} records loaded.`;$('load-older').hidden=!data.more;render();
 }catch{$('connection').textContent='Refresh failed. Displayed records, if any, may be old. Sign in again or retry; no data was deleted.';}
 finally{loading=false;$('refresh').disabled=false;$('load-older').disabled=false;}
}
$('refresh').addEventListener('click',()=>refresh());$('load-older').addEventListener('click',()=>refresh(true));$('tests').addEventListener('change',()=>{if(loading||protectDrafts()){$('tests').checked=!$('tests').checked;return;}render();});
$('download-backup').addEventListener('click',async()=>{
 const button=$('download-backup'),status=$('backup-state');button.disabled=true;status.textContent='Preparing a consistent private snapshot…';
 try{const response=await fetch('/api/enquiries?export=backup',{credentials:'same-origin',cache:'no-store'});const data=await response.json();if(!response.ok)throw Error(data.error||'Backup failed');if(data.format!=='via-nova-marketing-backup'||!Array.isArray(data.tables))throw Error('Invalid backup response');
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='via-nova-marketing-backup-'+data.exportedAt.replace(/[:.]/g,'-')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='Backup download started. Keep it private and confirm the file was saved. '+data.tables.map(t=>t.table+': '+t.rows.length).join('; ');
 }catch(error){status.textContent=error.message+' No partial backup was offered.';}finally{button.disabled=false;}
});
if($('crm-filters'))$('crm-filters').addEventListener('submit',event=>{event.preventDefault();if(loading||protectDrafts())return;appliedFilters={query:$('crm-search').value,stage:$('crm-stage').value,followup:$('crm-followup').value};render();});
refresh();
