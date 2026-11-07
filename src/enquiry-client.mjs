import {requestSignal,bindForm,createReceiptReporter} from '../operations/enquiries/client.mjs';
// Register guided validation and brief serialization before the shared submit handler.
import '../public/assets/quote.js';
const reportReceipt=createReceiptReporter(detail=>document.dispatchEvent(new CustomEvent('vnm:enquiry-saved',{detail})));
const send=async payload=>{
  const response=await fetch('/api/enquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),credentials:'same-origin',signal:requestSignal(20000)});
  const receipt=await response.json();
  if(!response.ok){const error=Error(response.status===429?'Please wait a minute, then try again. Your details are still here.':response.status===413?'Please shorten your message and try again.':'Please check your name, email and message, then try again.');error.definite=[400,403,413,415,429].includes(response.status);throw error;}
  reportReceipt(payload,receipt);
  return receipt;
};
const quick=document.getElementById('enquiry-form');
if(quick)bindForm(quick,{send,isTest:false,kind:'quick',getMessage:values=>`Service: ${values.get('service')||'Not specified'}\n\n${values.get('message')||''}`});
const brief=document.getElementById('quote-form');
if(brief)bindForm(brief,{send,isTest:false,kind:'brief'});
