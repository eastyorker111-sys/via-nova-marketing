// PREPARED ONLY. Install after owner approval of the Outlook redirect and Gmail read scope.
// Keep existing alert functions and their trigger unchanged.
function syncOutlookReplies(){
 const lock=LockService.getScriptLock();if(!lock.tryLock(1000))return;
 try{
  const identity=ScriptApp.getIdentityToken(),access=ScriptApp.getOAuthToken();
  if(!identity||!access)throw new Error('Authorize the existing Via Nova Google project first.');
  const response=UrlFetchApp.fetch('https://via-nova-marketing-enquiries.east-yorker111.workers.dev/api/outlook-replies',{
   method:'post',headers:{Authorization:'Bearer '+identity,'X-VNM-Google-Access':access},
   muteHttpExceptions:true,followRedirects:false
  });
  if(response.getResponseCode()!==200)throw new Error('Reply check not confirmed; original email retained. HTTP '+response.getResponseCode());
  const result=JSON.parse(response.getContentText());
  console.log('Reply check: '+result.state+'; stored '+result.stored+'; review '+result.review);
 }finally{lock.releaseLock();}
}
function installOutlookReplySchedule(){
 syncOutlookReplies(); // No schedule unless provider and storage preflight succeeds.
 if(!ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='syncOutlookReplies'))
  ScriptApp.newTrigger('syncOutlookReplies').timeBased().everyMinutes(5).create();
}
