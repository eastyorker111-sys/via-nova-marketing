export function torontoDate(now=new Date()){
 return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Toronto',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
}
export function needsFollowUp(row,today=torontoDate()){
 return Boolean(row.follow_up_due&&row.follow_up_due<=today&&!['Closed','Lost','Spam'].includes(row.owner_status));
}
export function filterRecords(rows,{query='',stage='',followup='',tests=false}={},today=torontoDate()){
 const q=query.trim().toLowerCase();
 return rows.filter(r=>(tests||!r.is_test)&&(!stage||r.owner_status===stage)&&(!q||[r.id,r.customer_reference,r.name,r.email,r.business,r.message,r.owner_notes].some(v=>String(v||'').toLowerCase().includes(q)))&&(!followup||(followup==='due'?needsFollowUp(r,today):!r.follow_up_due&&!['Closed','Lost','Spam'].includes(r.owner_status))));
}
export function handoverText(r){
 return `${r.is_test?'TEST ONLY — not a customer project\n':''}Via Nova Marketing project handover\nEnquiry: ${r.id}\nCustomer: ${r.customer_reference}\nName: ${r.name}\nEmail: ${r.email}\nBusiness: ${r.business||'Not provided'}\nStage: ${r.owner_status}\nFollow-up: ${r.follow_up_due||'Not set'}\n\nOriginal request\n${r.message}\n\nOwner notes / next action\n${r.owner_notes||'Not recorded'}\n\nBefore creating a project: confirm scope, price, acceptance and capacity. Carry the enquiry and customer references into the existing Projects workbook. An enquiry or Won stage is not payment evidence. Record invoices and actual payment references separately. Calendar booking remains an owner action.`;
}
