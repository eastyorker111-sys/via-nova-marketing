const $=id=>document.getElementById(id), el=(tag,text,cls)=>{const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n;};
let rows=[],loading=false;
function render(){
  $('records').replaceChildren();const live=rows.filter(r=>!r.is_test);
  $('count').textContent=live.length;$('new').textContent=live.filter(r=>r.owner_status==='New').length;$('alerts').textContent=live.filter(r=>r.notification_state!=='sent').length;
  const visible=rows.filter(r=>$('tests').checked||!r.is_test);
  if(!visible.length)$('records').append(el('p','No matching records loaded. Refresh to check for new enquiries.'));
  for(const r of visible){
    const card=el('article','');card.append(el('h2',(r.is_test?'TEST · ':'')+r.name));card.append(el('p',`${r.id} · ${r.received_at} · ${r.form_kind} · ${r.email}`,'meta'));
    if(r.business)card.append(el('p',r.business));card.append(el('p',r.message,'message'));
    card.append(el('p',`Marketing permission: ${r.marketing_consent}. Email alert: ${r.notification_state||'unknown'}.`,'meta'));
    const form=el('form',''),cols=el('div','','columns'),status=el('select','');
    for(const value of ['New','Discussing','Quoted','Won','Lost','On hold','Spam','Closed']){const option=el('option',value);option.value=value;status.append(option);}status.value=r.owner_status;
    const statusLabel=el('label','Stage ');statusLabel.append(status);
    const due=document.createElement('input');due.type='date';due.value=r.follow_up_due||'';const dueLabel=el('label','Follow-up date ');dueLabel.append(due);cols.append(statusLabel,dueLabel);
    const notes=el('textarea','');notes.maxLength=5000;notes.value=r.owner_notes;const notesLabel=el('label','Owner notes and next action ');notesLabel.append(notes);
    const button=el('button','Save owner fields');button.type='submit';const feedback=el('p','');feedback.setAttribute('role','status');feedback.tabIndex=-1;form.append(cols,notesLabel,button,feedback);
    form.addEventListener('submit',async e=>{e.preventDefault();button.disabled=true;feedback.textContent='Saving…';try{
      const response=await fetch('/api/enquiries',{method:'PATCH',credentials:'same-origin',headers:{'Content-Type':'application/json','X-VNM-Action':'owner-update'},body:JSON.stringify({id:r.id,revision:r.revision,status:status.value,due:due.value,notes:notes.value})});
      const result=await response.json();if(!response.ok)throw Error(result.error||'Save could not be confirmed');
      r.revision=result.revision;r.owner_status=status.value;r.owner_notes=notes.value;r.follow_up_due=due.value;feedback.textContent='Saved. Original submission unchanged.';
    }catch(error){feedback.textContent=error.message;feedback.className='error';}finally{button.disabled=false;feedback.focus();}});
    card.append(form);$('records').append(card);
  }
}
async function refresh(){if(loading)return;loading=true;$('refresh').disabled=true;$('connection').textContent='Refreshing…';try{const response=await fetch('/api/enquiries',{credentials:'same-origin',cache:'no-store'});const data=await response.json();if(!response.ok)throw Error(data.error||'Request failed');rows=data.rows;$('connection').textContent=`${data.source} · ${data.mode} · refreshed ${new Date(data.refreshedAt).toLocaleString()}`;$('more').textContent=data.more?'Showing the newest 100 records. Older records remain in the store; request an authorized export.':'';render();}catch{$('connection').textContent='Refresh failed. Displayed records, if any, may be old. Sign in again or retry; no data was deleted.';}finally{loading=false;$('refresh').disabled=false;}}
$('refresh').addEventListener('click',refresh);$('tests').addEventListener('change',render);refresh();
