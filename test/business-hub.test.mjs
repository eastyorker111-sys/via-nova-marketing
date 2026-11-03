import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const script=fs.readFileSync(new URL('../operations/owner-inbox/public/hub.js',import.meta.url),'utf8');
const markup=fs.readFileSync(new URL('../operations/owner-inbox/public/hub.html',import.meta.url),'utf8');
function setup({protocol='https:',fetch=async()=>({ok:false})}={}){
 const elements=new Map();const element=id=>{if(!elements.has(id))elements.set(id,{id,value:'',textContent:'',hidden:false,disabled:false,dataset:{tab:id.replace('tab-','')},listeners:{},setAttribute(k,v){this[k]=v},removeAttribute(k){delete this[k]},addEventListener(k,fn){this.listeners[k]=fn},focus(){this.focused=true},select(){this.selected=true}});return elements.get(id)};
 const tabs=[...markup.matchAll(/role="tab" id="(tab-[^"]+)"/g)].map(m=>element(m[1]));
 const context={document:{getElementById:element,querySelectorAll:s=>s==='[role="tab"]'?tabs:s==='[data-open-tab]'?[]:[element('local-file')],querySelector:()=>element('inbox')},location:{protocol,hash:''},history:{replaceState(){}},navigator:{clipboard:{writeText:async()=>{}}},fetch,Intl,Date,URL,module:{exports:{}}};vm.runInNewContext(script,context);return{...context,element,tabs,build:context.module.exports.build};
}
test('campaign builder confines links to agency and validates labels without input markup',()=>{
 const {build}=setup();const input={page:'/contact.html',source:'linkedin',medium:'organic_social',campaign:'2026_11_service_intro',content:'profile_link'};
 const url=new URL(build(input));assert.equal(url.origin,'https://vianovamarketing.ca');assert.equal(url.searchParams.get('utm_campaign'),input.campaign);
 assert.throws(()=>build({...input,page:'https://evil.example'}));assert.throws(()=>build({...input,campaign:'name@example.com'}));assert.throws(()=>build({...input,content:'<script>'}));
});
test('hub tabs support selection and arrow keyboard navigation; local launcher never fetches records',()=>{
 const {tabs,element}=setup({protocol:'file:'});tabs.find(t=>t.id==='tab-connections').listeners.click();assert.equal(element('connections').hidden,false);assert.equal(element('operations').hidden,true);tabs.find(t=>t.id==='tab-connections').listeners.keydown({key:'ArrowDown',preventDefault(){}});assert.equal(tabs.find(t=>t.id==='tab-campaign').focused,true);assert.equal(element('campaign').hidden,false);assert.equal(element('refresh-live').disabled,true);assert.match(element('live-state').textContent,/Local launcher/);
});
test('live summary excludes tests, shows actual refresh, and clears figures after failure',async()=>{
 let fails=false;const c=setup({fetch:async()=>{if(fails)return{ok:false};return{ok:true,json:async()=>({rows:[{is_test:1,owner_status:'New'},{is_test:0,owner_status:'New',follow_up_due:'2000-01-01'},{is_test:0,owner_status:'Closed',follow_up_due:'2000-01-01'}],source:'Verified source',mode:'production',refreshedAt:new Date().toISOString(),more:true})}}});
 await c.element('refresh-live').listeners.click();assert.equal(c.element('live-count').textContent,2);assert.equal(c.element('live-new').textContent,1);assert.equal(c.element('live-due').textContent,1);assert.match(c.element('live-state').textContent,/Newest 100/);
 fails=true;await c.element('refresh-live').listeners.click();assert.equal(c.element('live-count').textContent,'Unavailable');assert.match(c.element('live-state').textContent,/Refresh failed/);
});
