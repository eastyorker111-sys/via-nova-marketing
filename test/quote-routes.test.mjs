import test from 'node:test';
import assert from 'node:assert/strict';
import { activeQuestions, hasService } from '../public/assets/quote-questions.js';
const ids = a => activeQuestions(a).map(q => q.id);
test('launch video only does not expand into strategy or commercial questions', () => {
 const route=ids({'Project goal':'Launch a product','Product stage':'Ready to launch',Services:['Video']});
 for(const id of ['Product stage','Product readiness','Video purpose','Video message','Video production']) assert.ok(route.includes(id));
 for(const id of ['Commercial context','Alternatives and differences','Product problem and evidence','Website action']) assert.ok(!route.includes(id));
});
test('idea-stage discovery is optional and only offered for strategy support',()=>{
 const base={'Project goal':'Launch a product','Product stage':'An idea'};
 assert.ok(ids({...base,Services:['Strategy']}).includes('Discovery next step'));
 assert.ok(!ids({...base,Services:['Video']}).includes('Discovery next step'));
 assert.ok(!ids({...base,'Product stage':'In development',Services:['Strategy']}).includes('Discovery next step'));
});
test('guidance requires confirmation before adding a service',()=>{
 const a={Services:['Help me decide'],'Support direction':'Website'};
 assert.equal(hasService(a,'Website'),false);
 assert.equal(hasService({...a,'Confirm suggested support':'Keep it for discussion'},'Website'),false);
 assert.equal(hasService({...a,'Confirm suggested support':'Yes, include this support'},'Website'),true);
 assert.equal(hasService({...a,Services:['Video'],'Confirm suggested support':'Yes, include this support'},'Website'),false);
});
test('multiple services share details and do not retain removed branch requirements',()=>{
 const a={Services:['Logo & brand identity','Website','Video','Content & social media'],'Brand starting point':'Refresh an existing identity','Website starting point':'Improve an existing website'};
 const route=ids(a);
 for(const id of ['Business','Audience','Existing assets','Content channels','Budget direction','Timing']) assert.equal(route.filter(x=>x===id).length,1);
 assert.ok(route.includes('Brand to preserve')); assert.ok(route.includes('Website challenge'));
 const changed=ids({...a,Services:['Video']});
 assert.ok(!changed.includes('Brand to preserve')); assert.ok(!changed.includes('Website challenge')); assert.ok(changed.includes('Audience'));
});
test('changing goal and budget removes irrelevant follow-up questions',()=>{
 const a={Services:['Strategy'],'Project goal':'Launch a product','Product stage':'In development','Budget direction':'I have a budget in mind',Timing:'I have a specific date'};
 assert.ok(ids(a).includes('Commercial context')); assert.ok(ids(a).includes('Budget details'));
 const b=ids({...a,'Project goal':'Improve my current presence','Budget direction':'I need guidance',Timing:'Exploring / not sure yet'});
 for(const id of ['Product stage','Product readiness','Commercial context','Budget details','Timing details']) assert.ok(!b.includes(id));
});
