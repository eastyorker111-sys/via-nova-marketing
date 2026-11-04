import test from 'node:test';
import assert from 'node:assert/strict';
import {filterRecords,needsFollowUp,torontoDate,handoverText} from '../operations/owner-inbox/public/crm.mjs';
const base={id:'one',name:'Test',email:'test@example.invalid',message:'Branding enquiry',owner_status:'Discussing',follow_up_due:'2026-11-04',customer_reference:'VNM-C-example',is_test:0};
test('CRM defaults exclude labelled tests and search original request plus customer reference',()=>{
 const rows=[base,{...base,id:'test',is_test:1}];
 assert.equal(filterRecords(rows).length,1);
 assert.equal(filterRecords(rows,{query:'vnm-c-example',tests:true}).length,2);
 assert.equal(filterRecords(rows,{query:'branding',stage:'Quoted'}).length,0);
});
test('CRM due work uses Toronto date and excludes closed outcomes but keeps won follow-ups',()=>{
 assert.equal(torontoDate(new Date('2026-11-05T02:00:00Z')),'2026-11-04');
 assert.equal(needsFollowUp(base,'2026-11-04'),true);
 assert.equal(needsFollowUp({...base,owner_status:'Closed'},'2026-11-04'),false);
 assert.equal(needsFollowUp({...base,owner_status:'Won'},'2026-11-04'),true);
 assert.equal(filterRecords([base,{...base,id:'future',follow_up_due:'2026-11-06'}],{followup:'due'},'2026-11-04').length,1);
});
test('CRM undated work and handover preserve identity and do not imply booking or payment',()=>{
 assert.equal(filterRecords([{...base,follow_up_due:''}],{followup:'undated'}).length,1);
 const text=handoverText({...base,is_test:1});
 assert.match(text,/TEST ONLY/);assert.match(text,/VNM-C-example/);assert.match(text,/not payment evidence/);
 assert.match(text,/Branding enquiry/);
});
