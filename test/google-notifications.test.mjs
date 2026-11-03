import test from 'node:test';import assert from 'node:assert/strict';import {generateKeyPair,SignJWT} from 'jose';import {verifyGoogleIdentity} from '../operations/enquiries/google-notifications.mjs';
test('Google alert identity requires signature, exact project, verified owner and current expiry',async()=>{
 const {privateKey,publicKey}=await generateKeyPair('RS256');const env={GOOGLE_NOTIFICATION_CLIENT_ID:'agency-client',GOOGLE_NOTIFICATION_OWNER:'owner@gmail.com'};
 const token=(overrides={})=>new SignJWT({email:'owner@gmail.com',email_verified:true,...overrides}).setProtectedHeader({alg:'RS256'}).setIssuer('https://accounts.google.com').setAudience(overrides.aud||'agency-client').setSubject('owner-id').setIssuedAt().setExpirationTime(overrides.exp||'5m').sign(privateKey);
 assert.equal(await verifyGoogleIdentity(await token(),env,publicKey),'owner-id');
 for(const claims of [{email:'other@gmail.com'},{email_verified:false},{aud:'other-app'},{exp:1}])await assert.rejects(()=>token(claims).then(t=>verifyGoogleIdentity(t,env,publicKey)));
 const other=await generateKeyPair('RS256');await assert.rejects(()=>token().then(t=>verifyGoogleIdentity(t,env,other.publicKey)));
});
