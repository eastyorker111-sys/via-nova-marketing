import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../operations/owner-inbox/public/communications.js',import.meta.url),'utf8');
function setup(){
 const nodes=[],requests=[],dirty=new Set(),saving=new Set(),window={};let failure='network';
 const node=tag=>{const n={tag,children:[],listeners:{},value:'',append(...children){this.children.push(...children);if(this.tag==='select'&&!this.value)this.value=children[0]?.value||''},replaceChildren(){this.children=[];this.value=''},setAttribute(){},addEventListener(k,f){this.listeners[k]=f},focus(){},reportValidity(){return true},reset(){for(const input of nodes.filter(x=>x.name))input.value=input.tag==='select'?input.children[0].value:''}};nodes.push(n);return n;};
 const fetch=async(url,options)=>{if(!options?.method)return{ok:true,json:async()=>({rows:[],next:null})};requests.push(JSON.parse(options.body));if(failure==='network')throw Error('Network interrupted');return{ok:failure===null,status:failure||200,json:async()=>failure?{error:'Validation failed'}:{stored:true,sentByThisAction:false,enquiry_id:'test-enquiry'}}};
 vm.runInNewContext(source,{window,document:{createElement:node},fetch,URLSearchParams,Date,crypto:{randomUUID:()=> 'stable-'+(requests.length+1)}});
 window.attachCommunication(node('article'),{id:'test-enquiry'},{dirty,saving});
 return{nodes,requests,dirty,saving,setFailure:v=>failure=v,field:name=>nodes.find(n=>n.name===name),form:nodes.find(n=>n.tag==='form'),submit:()=>nodes.find(n=>n.tag==='form').listeners.submit({preventDefault(){}})};
}

test('timeline retains locked payload after uncertain save, retries same ID and clears only after confirmed receipt',async()=>{
 const c=setup();c.field('body').value='TEST ONLY original reply';c.form.listeners.input();assert.ok(c.dirty.size);
 await c.submit();assert.equal(c.requests.length,1);assert.equal(c.field('body').disabled,true);assert.equal(c.dirty.size,1);assert.equal(c.saving.size,0);
 c.field('body').value='Attempted change';c.setFailure(null);await c.submit();assert.deepEqual(c.requests[1],c.requests[0]);assert.equal(c.dirty.size,0);assert.equal(c.field('body').disabled,false);
});

test('outgoing defaults to unsent draft; definite conflict preserves editable text for reconciliation',async()=>{
 const c=setup();c.field('direction').value='outgoing';c.field('direction').listeners.change();assert.equal(c.field('delivery_state').value,'draft');
 c.field('body').value='TEST ONLY unsent';c.setFailure(409);await c.submit();assert.equal(c.field('body').value,'TEST ONLY unsent');assert.equal(c.field('body').disabled,false);assert.equal(c.dirty.size,1);
 c.setFailure(null);await c.submit();assert.notEqual(c.requests[0].id,c.requests[1].id);assert.equal(c.requests[1].delivery_state,'draft');assert.equal(c.dirty.size,0);
});
