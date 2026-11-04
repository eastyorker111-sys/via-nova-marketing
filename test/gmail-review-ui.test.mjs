import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../operations/owner-inbox/public/replies.js',import.meta.url),'utf8');
const settle=()=>new Promise(r=>setImmediate(r));
function setup({disabled=false}={}){
 const all=[],ids=new Map(),windows={};let fail=false,hold=null;const calls=[];
 const node=tag=>{const n={tag,children:[],listeners:{},value:'',checked:false,append(...c){this.children.push(...c)},replaceChildren(){this.children=[]},setAttribute(){},addEventListener(k,f){this.listeners[k]=f},focus(){}};all.push(n);return n;};
 const get=id=>{if(!ids.has(id))ids.set(id,node(id));return ids.get(id)};
 const fetch=async(url,opt)=>{calls.push({url,opt});if(opt?.method==='POST')return{ok:!fail,json:async()=>fail?{error:'Stale revision'}:{state:'matched',revision:2}};if(hold)await hold;return{ok:true,json:async()=>({configured:!disabled,readerReady:!disabled,rows:disabled?[]:[{message_id:'fixture1',state:'needs_review',classification:'unassigned',source_reference:'TEST ONLY original',revision:1,attempts:1}],next:null})};};
 vm.runInNewContext(source,{document:{getElementById:get,createElement:node},window:{addEventListener(k,f){windows[k]=f}},fetch,URLSearchParams});
 return{all,get,windows,calls,setFail:v=>fail=v,hold:p=>hold=p,form:()=>all.find(n=>n.tag==='form'),inputs:()=>all.filter(n=>n.tag==='input')};
}
test('Disabled page does not poll or enable collection',async()=>{const c=setup({disabled:true});await settle();assert.equal(c.calls.length,1);assert.equal(c.get('discover').disabled,true);assert.equal(c.get('check').disabled,true);assert.match(c.get('connection').textContent,/not activated/);});
test('Failed match preserves fields, blocks refresh/retry and warns before close; explicit discard releases guard',async()=>{
 const c=setup();await settle();const form=c.form(),[id,evidence,confirmation]=c.inputs();id.value='existing-id';evidence.value='Keep this evidence';confirmation.checked=true;form.listeners.input();
 await c.get('refresh').listeners.click();assert.equal(c.calls.length,1);assert.match(c.get('connection').textContent,/Save or discard/);
 c.setFail(true);await form.listeners.submit({preventDefault(){}});assert.equal(evidence.value,'Keep this evidence');assert.equal(confirmation.checked,true);
 let prevented=false;c.windows.beforeunload({preventDefault(){prevented=true}});assert.equal(prevented,true);
 await c.all.find(n=>n.textContent==='Retry original').listeners.click();assert.equal(c.calls.length,2);
 c.all.find(n=>n.textContent==='Discard unsaved match').listeners.click();assert.equal(evidence.value,'');await c.get('refresh').listeners.click();assert.equal(c.calls.length,3);
});
test('Refresh arriving during edit preserves the original form; successful match uses current revision and releases guard',async()=>{
 const c=setup();await settle();let release;c.hold(new Promise(r=>release=r));const refresh=c.get('refresh').listeners.click();const form=c.form(),inputs=c.inputs();inputs[1].value='Typed during fetch';form.listeners.input();release();await refresh;
 assert.equal(c.form(),form);assert.equal(inputs[1].value,'Typed during fetch');assert.match(c.get('connection').textContent,/preserved/);
 c.hold(null);inputs[0].value='id';inputs[2].checked=true;await form.listeners.submit({preventDefault(){}});
 const sent=JSON.parse(c.calls.at(-1).opt.body);assert.equal(sent.revision,1);assert.equal(sent.confirmMarketing,true);assert.equal(sent.owner,undefined);
 let prevented=false;c.windows.beforeunload({preventDefault(){prevented=true}});assert.equal(prevented,false);
});
