// Via Nova Marketing only. No passwords, API keys or customer text in this project.
const VNM={endpoint:'https://via-nova-marketing-enquiries.east-yorker111.workers.dev/api/notifications',owner:'east.yorker111@gmail.com',recipient:'vianovamarketing@outlook.com',inbox:'https://via-nova-marketing-owner-inbox.vercel.app/'};
function verifySetup(){
 const token=ScriptApp.getIdentityToken();if(!token)throw new Error('Authorize this Google project first.');
 const claims=JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(token.split('.')[1])).getDataAsString());
 if(claims.email!==VNM.owner)throw new Error('Use the agency owner Google account.');
 console.log('Google client ID: '+claims.aud);console.log('Owner verified: '+claims.email);
 // Client ID is public configuration, not a secret. Never print the token.
}
function vnmRequest_(method,payload,tests){
 const token=ScriptApp.getIdentityToken();if(!token)throw new Error('Google authorization required.');
 const response=UrlFetchApp.fetch(VNM.endpoint+(tests?'?tests=true':''),{method:method,headers:{Authorization:'Bearer '+token},contentType:'application/json',payload:payload?JSON.stringify(payload):undefined,muteHttpExceptions:true,followRedirects:false});
 if(response.getResponseCode()!==200)throw new Error('Notification service returned '+response.getResponseCode()+'. No customer data was included in this error.');
 return JSON.parse(response.getContentText());
}
function sendPendingAlerts(){vnmSend_(false);}
function sendTestAlert(){vnmSend_(true);}
function vnmSend_(tests){
 const lock=LockService.getScriptLock();if(!lock.tryLock(1000))return;
 try{
  const props=PropertiesService.getScriptProperties();
  const items=vnmRequest_('get',null,tests).items;
  for(const item of items.slice(0,tests?1:10)){
   const key='accepted_'+item.id,accepted=props.getProperty(key);
   if(item.state==='sending'){
    if(accepted===item.attempt){vnmRequest_('post',{action:'sent',id:item.id,attempt:accepted});props.deleteProperty(key);}
    else vnmRequest_('post',{action:'uncertain',id:item.id,attempt:item.attempt});
    continue;
   }
   if(MailApp.getRemainingDailyQuota()<1)throw new Error('Google daily email quota exhausted; pending alerts are retained.');
   const attempt=Utilities.getUuid();if(!vnmRequest_('post',{action:'claim',id:item.id,attempt:attempt}).claimed)continue;
   try{
    MailApp.sendEmail({to:VNM.recipient,name:'Via Nova Marketing operations',subject:(tests?'TEST ONLY — ':'')+'Via Nova Marketing enquiry '+item.id,body:(tests?'Synthetic verification only. No customer or booking.\n\n':'A new website enquiry is ready for your review.\n\n')+'Reference: '+item.id+'\nReceived: '+item.received_at+'\n\nOpen your private inbox: '+VNM.inbox+'\n\nThis alert contains no customer name, email or message. Review and reply through the approved business channel.'});
    props.setProperty(key,attempt);
   }catch(error){vnmRequest_('post',{action:'uncertain',id:item.id,attempt:attempt});throw new Error('Google send result is uncertain. Inspect Sent mail and the private inbox; do not blindly resend.');}
   vnmRequest_('post',{action:'sent',id:item.id,attempt:attempt});props.deleteProperty(key);
  }
 }finally{lock.releaseLock();}
}
function installSchedule(){
 vnmRequest_('get'); // Do not schedule an unconfigured backend.
 const existing=ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='sendPendingAlerts');
 if(!existing.length)ScriptApp.newTrigger('sendPendingAlerts').timeBased().everyMinutes(5).create();
 console.log('Via Nova Marketing five-minute Google alert check is installed. Observe an execution before calling it verified.');
}
function pauseSchedule(){
 ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='sendPendingAlerts').forEach(t=>ScriptApp.deleteTrigger(t));
 console.log('Only this project’s Via Nova Marketing alert schedule was removed. Records are preserved.');
}
