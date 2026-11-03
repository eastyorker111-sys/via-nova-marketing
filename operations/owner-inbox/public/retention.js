(()=>{
 const $=id=>document.getElementById(id),make=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;return n;};
 const status=$('review-state'),results=$('review-results');let running=false;
 $('review-form').addEventListener('submit',async event=>{
  event.preventDefault();if(running)return;running=true;results.replaceChildren();status.textContent='Checking recorded activity…';
  const params=new URLSearchParams({review:'retention',review_before:$('review-before').value,include_tests:String($('include-tests').checked)});
  try{const response=await fetch('/api/enquiries?'+params,{credentials:'same-origin',cache:'no-store'});const data=await response.json();if(!response.ok)throw Error(data.error||'Review unavailable');
   if(!Array.isArray(data.rows)||data.automaticDeletion!==false)throw Error('Invalid review response');
   for(const row of data.rows){const item=make('section','');item.className='review-row';item.append(make('h2',(row.is_test?'TEST · ':'')+row.id),make('p',`Stage: ${row.owner_status}. Last recorded activity: ${row.last_activity}. Follow-up: ${row.follow_up_due||'not set'}. Saved messages: ${row.messages}.`));
    const exportButton=make('button','Export this case for private review');exportButton.type='button';exportButton.setAttribute('aria-label','Export case '+row.id);const feedback=make('p','');feedback.setAttribute('role','status');
    exportButton.addEventListener('click',async()=>{exportButton.disabled=true;feedback.textContent='Preparing private case export…';try{const r=await fetch('/api/enquiries?export=case&id='+encodeURIComponent(row.id),{credentials:'same-origin',cache:'no-store'});const file=await r.json();if(!r.ok)throw Error(file.error||'Export failed');if(file.format!=='via-nova-marketing-case-review'||file.id!==row.id)throw Error('Case identity mismatch');
      const url=URL.createObjectURL(new Blob([JSON.stringify(file,null,2)],{type:'application/json'})),a=make('a','');a.href=url;a.download='vnm-private-case-'+row.id+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);feedback.textContent='Download started. Confirm the private file was saved; review it before any disclosure.';
     }catch(error){feedback.textContent=error.message+' No case export was offered.';}finally{exportButton.disabled=false;}});
    item.append(exportButton,feedback);results.append(item);
   }
   status.textContent=`${data.rows.length} review candidates. Checked ${new Date(data.checkedAt).toLocaleString()}. Nothing deleted. ${data.scope}`;
  }catch(error){results.replaceChildren();status.textContent=error.message+' Retry after checking access. No records changed.';}finally{running=false;status.focus();}
 });
})();
