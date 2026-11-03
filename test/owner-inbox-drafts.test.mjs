import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../operations/owner-inbox/public/inbox.js',import.meta.url),'utf8');
function setup(){
 const all=[],ids=new Map(),windows={};let calls=0,fail=false,hold=null;
 const node=tag=>{const n={tag,children:[],listeners:{},value:'',checked:false,append(...children){this.children.push(...children)},replaceChildren(){this.children=[]},setAttribute(){},addEventListener(k,fn){this.listeners[k]=fn},focus(){}};all.push(n);return n;};
 const get=id=>{if(!ids.has(id))ids.set(id,node(id));return ids.get(id)};
 const record={id:'one',name:'Synthetic',email:'test@example.invalid',message:'Test',is_test:0,owner_status:'New',owner_notes:'Saved note',follow_up_due:'',revision:0};
 const fetch=async(url,options)=>{calls++;if(options?.method==='PATCH')return{ok:!fail,json:async()=>fail?{error:'Conflict: refresh and reconcile'}:{revision:1}};if(hold)await hold;return{ok:true,json:async()=>({rows:[{...record}],source:'Test',mode:'test',refreshedAt:new Date().toISOString(),more:false})}};
 vm.runInNewContext(source,{document:{getElementById:get,createElement:node},window:{addEventListener(k,fn){windows[k]=fn}},fetch,Date,URLSearchParams,URL,Blob,setTimeout});
 return{all,get,windows,calls:()=>calls,setFail:v=>fail=v,hold:p=>hold=p,controls:()=>{const form=all.filter(n=>n.tag==='form').at(-1);return{form,notes:all.filter(n=>n.tag==='textarea').at(-1),discard:form.children.find(n=>n.textContent==='Discard unsaved changes')}}};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
test('unsaved owner notes survive refresh/filter and save failures; discard explicitly restores saved values',async()=>{
 const c=setup();await settle();const {form,notes,discard}=c.controls();notes.value='Unsaved important next action';form.listeners.input();
 await c.get('refresh').listeners.click();assert.equal(c.calls(),1);assert.match(c.get('connection').textContent,/Save or discard/);assert.equal(notes.value,'Unsaved important next action');
 c.get('tests').checked=true;c.get('tests').listeners.change();assert.equal(c.get('tests').checked,false);
 let prevented=false;c.windows.beforeunload({preventDefault(){prevented=true}});assert.equal(prevented,true);
 c.setFail(true);await form.listeners.submit({preventDefault(){}});assert.equal(notes.value,'Unsaved important next action');await c.get('refresh').listeners.click();assert.equal(c.calls(),2);
 discard.listeners.click();assert.equal(notes.value,'Saved note');await c.get('refresh').listeners.click();assert.equal(c.calls(),3);
});
test('successful save releases draft guard and refresh arriving during editing cannot replace notes',async()=>{
 const c=setup();await settle();let release;c.hold(new Promise(r=>release=r));const refreshing=c.get('refresh').listeners.click();
 const {form,notes}=c.controls();notes.value='Typed during refresh';form.listeners.input();release();await refreshing;assert.equal(c.controls().notes,notes);assert.equal(notes.value,'Typed during refresh');
 c.hold(null);await form.listeners.submit({preventDefault(){}});let prevented=false;c.windows.beforeunload({preventDefault(){prevented=true}});assert.equal(prevented,false);await c.get('refresh').listeners.click();assert.equal(c.calls(),4);
});
