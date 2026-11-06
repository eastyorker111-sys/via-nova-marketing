import {bindForm,createReceiptReporter,createSubmission} from '../operations/enquiries/client.mjs';
import {contactForm} from './contact-form.mjs';

const $=s=>document.querySelector(s);let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;let ambientPlaying=!reduced;let playing=!reduced,mode='intro',elapsed=0,index=0,last=performance.now(),beat=-1;const tabs=[...document.querySelectorAll('[role=tab]')];
const scenarios=[{eye:'Launching something new?',title:'Turn your idea into a clear offer.',body:'You have an idea. I help choose the priorities, shape the message and create what you need to launch.',cta:'Let’s plan your launch',cards:['Choose what comes first.','Branding, website and launch content.','A clear route to enquire, book or buy.'],question:'What are you getting ready to launch?',choices:['A new business','A new service or product','A new location','I need guidance']},{eye:'Does your business take too much explaining?',title:'Help people get it.',body:'I help turn a complicated offer into a clear message, then bring it into your branding, website and content.',cta:'Let’s clarify your offer',cards:['Work out what customers need to understand.','Make the message and visuals work together.','Give people one clear next step.'],question:'Where is your business hardest to explain?',choices:['On my website','In my marketing','When speaking to customers','I need guidance']},{eye:'Getting enquiries that don’t fit?',title:'Speak to the right need.',body:'I help review who you want to reach, what you say and what people see before they contact you.',cta:'Let’s review your enquiries',cards:['Review the audience and offer.','Create relevant content and campaign materials.','Ask useful questions before the conversation.'],question:'What is happening with your enquiries?',choices:['Too few enquiries','Mostly the wrong fit','People ask, then disappear','I need guidance']},{eye:'Messages arrive. Then what?',title:'Keep the conversation moving.',body:'I help organise the enquiry route, replies and follow-up around the way your business works.',cta:'Let’s look at your follow-up',cards:['Find where the conversation gets stuck.','Make useful pages, messages and information.','Organise replies, bookings and follow-up.'],question:'Where do things get stuck?',choices:['Messages arrive in too many places','Replying takes too long','Booking the next step','I need guidance']}];
function txt(s,t){$(s).textContent=t}function status(){txt('#pause',ambientPlaying?'Pause':'Play');$('#pause').setAttribute('aria-label',ambientPlaying?'Pause motion':'Play motion')}
function select(i,manual=false){mode='carousel';index=(i+scenarios.length)%scenarios.length;elapsed=0;$('.film').classList.add('hide');$('.experience').classList.add('live');$('.experience').classList.remove('questions-mode','gallery-mode');$('#skip').hidden=true;txt('#mode-label','Choose your situation');const d=scenarios[index];txt('#eyebrow',d.eye);txt('#headline',d.title);txt('#description',d.body);txt('#main-action',d.cta);['plan','creative','connect'].forEach((k,j)=>txt('#body-'+k,d.cards[j]));tabs.forEach((t,j)=>t.setAttribute('aria-selected',String(j===index)));if(!reduced)document.querySelectorAll('.object').forEach((e,j)=>e.animate([{opacity:0,translate:'0 30px'},{opacity:1,translate:'0 0'}],{duration:450,delay:j*140,easing:'cubic-bezier(.2,.7,.2,1)'}));if(manual)playing=false;status()}
function introBeat(n){
 if(n===beat)return;const prior=beat;beat=n;
 const film=$('.film'),title=$('#film-title');film.classList.toggle('noise',n<2);film.dataset.beat=n;
 if(n===3){txt('#film-caption','Business planning, branding, websites and customer follow-up.');return}
 title.getAnimations().forEach(a=>a.cancel());
 title.textContent=['Not sure what your\nbusiness needs next?','A clear plan.\nThe right work behind it.','VIA NOVA'][n];
 txt('#brand-sub',n===2?'MARKETING':'');txt('#film-caption',n===0?'Starting out, changing direction or trying to get better enquiries?':n===1?'I help you decide what needs attention, then create the branding, website or content to support it.':'');
 if(!reduced)title.animate([{opacity:0,transform:'translate3d(0,18px,0)'},{opacity:1,transform:'translate3d(0,0,0)'}],{duration:650,easing:'cubic-bezier(.16,1,.3,1)'});
}

function replay(){mode='intro';elapsed=0;beat=-1;playing=true;ambientPlaying=!reduced;$('.experience').classList.remove('live');$('.film').classList.remove('hide');$('#skip').hidden=false;txt('#mode-label','10-second brand opening');introBeat(0);status();if(reduced)select(0,true)}
const canvas=$('canvas'),ctx=canvas.getContext('2d');let w=0,h=0;function resize(){w=innerWidth;h=innerHeight;const d=Math.min(devicePixelRatio,1.5);canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0)}addEventListener('resize',resize);resize();const points=Array.from({length:95},()=>({x:Math.random()*2-1,y:Math.random()*2-1,z:Math.random(),s:Math.random()}));let visual=0;
function paint(dt){if(ambientPlaying&&!reduced&&performance.now()>=interactionUntil&&!dialog.open)visual+=dt*.001;ctx.clearRect(0,0,w,h);const cx=w*.72,cy=h*.52;ctx.strokeStyle='#0E6F6B';ctx.lineWidth=.6;for(let row=0;row<19;row++){ctx.beginPath();for(let x=0;x<=w;x+=18){const y=h*.68+row*row*.6+Math.sin(x*.004+visual*.35+row*.12)*18; x?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.globalAlpha=.10+row*.008;ctx.stroke()}ctx.globalAlpha=1;for(const p of points){let z=(p.z+visual*(mode==='intro'?.035:.003))%1;let d=.1+z;let x=cx+p.x*w*d,y=cy+p.y*h*d;ctx.globalAlpha=(1-z)*.65;ctx.strokeStyle=p.s>.84?'#D4AF7C':'#2c8a8c';ctx.lineWidth=p.s>.9?1.5:.7;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+p.x*(mode==='intro'?65:5),y+p.y*(mode==='intro'?35:3));ctx.stroke()}ctx.globalAlpha=1;const glow=ctx.createLinearGradient(0,h*.85,w,h*.52);glow.addColorStop(0,'#d4af7c00');glow.addColorStop(.65,'#ffe3a9');glow.addColorStop(1,'#d4af7c00');ctx.strokeStyle=glow;ctx.shadowColor='#D4AF7C';ctx.shadowBlur=24;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,h*.87);ctx.quadraticCurveTo(w*.43,h*.72,w,h*.51);ctx.stroke();ctx.shadowBlur=0;const travel=(visual*.028)%1;const sx=2*(1-travel)*travel*w*.43+travel*travel*w,sy=(1-travel)*(1-travel)*h*.87+2*(1-travel)*travel*h*.72+travel*travel*h*.51;ctx.fillStyle='#fff2cd';ctx.shadowColor='#e8c087';ctx.shadowBlur=20;ctx.beginPath();ctx.arc(sx,sy,2.2,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0}
function tick(now){const dt=now-last;last=now;if(playing&&!document.hidden&&now>=interactionUntil&&!dialog.open){elapsed+=dt;if(mode==='intro'){introBeat(elapsed<3200?0:elapsed<6400?1:elapsed<7800?2:3);if(elapsed>=10000)showQuestions()}else if(elapsed>=9500){elapsed=0}}if(!document.hidden&&(ambientPlaying||mode==='intro'))paint(Math.min(dt,50));$('.time').style.width=Math.min(100,elapsed/(mode==='intro'?10000:9500)*100)+'%';requestAnimationFrame(tick)}
tabs.forEach((t,i)=>{t.onclick=()=>select(i,true);t.onkeydown=e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();const n=(i+(e.key==='ArrowRight'?1:3))%4;tabs[n].focus();select(n,true)}}});$('#prev').onclick=()=>select(index-1,true);$('#next').onclick=()=>select(index+1,true);$('#skip').onclick=()=>showQuestions();$('#pause').onclick=()=>{ambientPlaying=!ambientPlaying;playing=ambientPlaying;document.getAnimations().forEach(a=>{if(a.effect?.getTiming().iterations===Infinity){ambientPlaying&&!reduced?a.play():a.pause()}else if(a.playState==='running')a.finish()});status()};$('#replay').onclick=replay;
let activePath='plan',step=0,answers={};const paths={plan:['Planning','What would you like to get clear on?',['The offer','The audience','What to do first','I need guidance']],creative:['Creative work','What would you like help creating?',['Branding or a logo','A website or store','Content or video','I need guidance']],connect:['Customer follow-up','What would you like to improve?',['Enquiries','Bookings','Replies and follow-up','I need guidance']],single:['One service','What do you need?',['A logo or brand materials','A website or store','A video or content','I need guidance']]};
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}function key(){return index+'-'+activePath+'-'+(enquiryContext?.[0]||situationSelection||'situation')}function record(){return answers[key()]||(answers[key()]={})}function open(path){if(mode==='intro')select(index,true);playing=false;status();activePath=path;step=0;render();$('dialog').showModal()}
function render(){const a=record(),d=scenarios[index],p=paths[activePath],host=$('#dialog-content');if(step<2){const q=step===0?(activePath==='single'?p[1]:enquiryContext?contextQuestion(enquiryContext)[0]:d.question):p[1],choices=step===0?(activePath==='single'?p[2]:enquiryContext?contextQuestion(enquiryContext)[1]:d.choices):p[2];host.innerHTML='<span class="progress-label">'+esc(p[0])+' · Your priorities</span><h2>'+esc(q)+'</h2><div class="choices">'+choices.map(v=>'<button class="'+(a[step]===v?'chosen':'')+'" aria-pressed="'+(a[step]===v)+'">'+esc(v)+'</button>').join('')+'</div><div class="dialog-actions">'+(step?'<button class="secondary" id="back">Back</button>':'<span></span>')+'<button class="primary" id="continue" '+(!a[step]?'disabled':'')+'>Continue</button></div>';host.querySelectorAll('.choices button').forEach(b=>b.onclick=()=>{a[step]=b.textContent;render()});$('#continue').onclick=()=>{step+=(activePath==='single'||enquiryContext)?2:1;render()}}else if(step===2){host.innerHTML='<span class="progress-label">Optional details</span><h2>Anything else I should know?</h2><label for="details">A few words about your business (optional)</label><textarea id="details" maxlength="2000" placeholder="What would you like to change?">'+esc(a.details||'')+'</textarea><div class="dialog-actions"><button class="secondary" id="back">Back</button><button class="primary" id="review">Review</button></div>';$('#details').oninput=e=>a.details=e.target.value;$('#review').onclick=()=>{step++;render()}}else{const summary='Situation: '+d.eye+'\n'+a[0]+'\nHelp: '+a[1]+'\n\n'+(a.details||'');host.innerHTML='<span class="progress-label">Ready to discuss</span><h2>Your starting point.</h2><div class="review">'+esc(summary)+'</div><p class="small">Private preview: nothing has been submitted. Open an email draft with these answers, or use the current website form.</p><a class="primary" href="mailto:vianovamarketing@outlook.com?subject='+encodeURIComponent('Project enquiry — '+p[0])+'&body='+encodeURIComponent(summary)+'">Open email draft</a><div class="quick-links"><a href="contact.html#enquiry-form">Current contact form</a><button class="secondary" id="back">Back</button></div>'}if($('#back'))$('#back').onclick=()=>{step--;render()}}
document.querySelectorAll('[data-path]').forEach(b=>b.onclick=()=>open(b.dataset.path));$('#main-action').onclick=()=>open('plan');$('#services').onclick=()=>open('single');$('#one-service').onclick=e=>{e.preventDefault();open('single')};$('#contact').onclick=()=>{playing=false;status();$('#dialog-content').innerHTML='<h2>Start a conversation.</h2><p>Tell me what’s getting in the way, or ask about a single service.</p><button class="primary" id="guided">Help me work it out</button><div class="quick-links"><a href="mailto:vianovamarketing@outlook.com">Email me</a><a href="contact.html#enquiry-form">Contact form</a></div>';$('#guided').onclick=()=>{activePath='plan';step=0;if(mode==='intro')select(0,true);render()};$('dialog').showModal()};$('#close').onclick=()=>$('dialog').close();let touch=0;$('.experience').addEventListener('touchstart',e=>touch=e.changedTouches[0].clientX,{passive:true});$('.experience').addEventListener('touchend',e=>{if(e.target.closest('button,a,.question-grid,.learning-grid'))return;const dx=e.changedTouches[0].clientX-touch;if(Math.abs(dx)>65)select(index+(dx<0?1:-1),true)},{passive:true});
function showQuestions(){queueMicrotask(()=>markDeck('questions'));select(index,true);$('.experience').classList.remove('gallery-mode');$('.experience').classList.add('questions-mode');txt('#mode-label','Choose your situation');tabs.forEach(t=>t.setAttribute('aria-selected','false'));$('.experience').scrollTop=0}
$('#show-questions').onclick=showQuestions;
document.querySelectorAll('[data-scenario]').forEach(b=>b.onclick=()=>{select(Number(b.dataset.scenario),true);$('.experience').scrollTop=0});
if($('#guidance-card'))$('#guidance-card').onclick=()=>open('plan');if($('#single-card'))$('#single-card').onclick=()=>open('single');
if(reduced)showQuestions();else introBeat(0);status();requestAnimationFrame(tick);

const deckData={learn:{label:'A little clarity',title:'How the pieces work together.',description:'Short answers to the questions business owners often face.',cards:[['Your message','What you do should be clear.','Before choosing colours or writing posts, explain who you help, what you offer and why it matters.','Clarify my offer',1,'plan'],['Your website','What should your website help people do?','It might explain a service, answer buying questions or help someone enquire. Decide that job before choosing the pages.','Talk about my website',1,'creative'],['Your content','What do customers need to know?','Answer a real customer question. Show relevant work. Make the next step clear. Posting more is not a plan by itself.','Plan my content',2,'creative'],['Your enquiries','Are the right people getting in touch?','The right information and useful enquiry questions help both sides judge whether the work is a fit.','Review my enquiries',2,'connect'],['Your follow-up','What happens after someone enquires?','Make it clear who replies, what information is needed and when the conversation continues.','Organise follow-up',3,'connect'],['Your decisions','How will you know what improved?','A new site or campaign is completed work. Enquiries, bookings and sales are separate outcomes to measure.','Discuss a review',2,'plan']]},hire:{label:'Working together',title:'Choose how we work together.',description:'Start with the level of help your business needs.',cards:[['Review and action plan','Review the problem and make a plan.','Review the problem and agree practical priorities. Decide what needs doing before committing to a larger project.','Start with a review',0,'plan'],['Defined project','Agree a project, price and timing.','A clear scope for a website, branding, content or connected project. We agree the price and timing before starting.','Discuss a project',0,'creative'],['Ongoing support','Arrange ongoing help when you need it.','Support after a project or help with ongoing marketing can be agreed separately, with clear tasks and expectations.','Ask about support',3,'connect'],['First, understand','Bring the real problem.','Tell me what is happening, what you have tried and where customers seem to get stuck. You do not need a perfect brief.','I need guidance',0,'plan'],['Then, build and review','Check it works for people.','Build the agreed pieces, test the customer steps and review the work together before handover.','Discuss implementation',1,'creative'],['Finally, hand over','Know how to use it.','Agree what is handed over, how to use it and what support is included. Further work is discussed separately.','Discuss the handover',3,'connect']]},services:{label:'One service or connected support',title:'Choose the help you need.',description:'You can start with one piece. You do not need to buy everything.',cards:[['Planning','Business and marketing direction.','Understand the customer, clarify the offer and agree what to prioritise.','Explore planning',0,'plan'],['Branding','Logos and brand materials.','Create a clear, consistent presentation for your business and the places customers see it.','Discuss branding',1,'creative'],['Websites','Business websites and stores.','Explain the offer, present the work and build the agreed enquiry or buying steps.','Discuss a website',1,'creative'],['Content','Video, photography and copy.','Create content around your message, your audience and the purpose it needs to serve.','Discuss content',2,'creative'],['Marketing','Social content and campaigns.','Connect the offer, creative and destination so the marketing has a clear purpose.','Discuss marketing',2,'creative'],['Customer steps','Enquiries and follow-up.','Improve the way people contact you and how their next steps are organised. Scope the tools to what can be reliably delivered.','Discuss customer steps',3,'connect']]}};
let currentDeck='questions',deckPage=0,qPage=0;
function markDeck(k){currentDeck=k;document.querySelectorAll('[data-deck]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.deck===k)))}
function questionPage(n){qPage=(n+2)%2;document.querySelectorAll('.question-card').forEach((c,i)=>c.hidden=Math.floor(i/4)!==qPage);txt('#q-count',(qPage+1)+' / 2');$('.question-grid').scrollLeft=0}
$('#q-prev').onclick=()=>questionPage(qPage-1);$('#q-next').onclick=()=>questionPage(qPage+1);
function showDeck(k,page=0){if(k==='questions'){showQuestions();markDeck(k);return}if(mode==='intro')select(0,true);playing=false;status();markDeck(k);deckPage=(page+2)%2;$('.experience').classList.remove('questions-mode');$('.experience').classList.add('gallery-mode');const d=deckData[k];txt('#learn-label',d.label);txt('#learn-title',d.title);txt('#learn-description',d.description);txt('#learn-page',(deckPage+1)+' / 2');$('#learning-grid').innerHTML=d.cards.slice(deckPage*3,deckPage*3+3).map((c,i)=>'<button class="learning-card" data-learn="'+(deckPage*3+i)+'"><span>'+esc(c[0])+'</span><strong>'+esc(c[1])+'</strong><p>'+esc(c[2])+'</p><em>'+esc(c[3])+' ↗</em></button>').join('');document.querySelectorAll('[data-learn]').forEach(b=>b.onclick=()=>{const c=d.cards[Number(b.dataset.learn)];index=c[4];enquiryContext=c;open(c[5])});$('.experience').scrollTop=0;$('#learning-grid').scrollLeft=0}
document.querySelectorAll('[data-deck]').forEach(b=>b.onclick=()=>showDeck(b.dataset.deck));$('#learn-prev').onclick=()=>showDeck(currentDeck,deckPage-1);$('#learn-next').onclick=()=>showDeck(currentDeck,deckPage+1);
document.querySelectorAll('[data-quick]').forEach(b=>b.onclick=()=>open(b.dataset.quick));
$('#show-questions').onclick=()=>showDeck('questions');
$('#prev').onclick=()=>{$('.experience').classList.contains('gallery-mode')?showDeck(currentDeck,deckPage-1):$('.experience').classList.contains('questions-mode')?questionPage(qPage-1):select(index-1,true)};
$('#next').onclick=()=>{$('.experience').classList.contains('gallery-mode')?showDeck(currentDeck,deckPage+1):$('.experience').classList.contains('questions-mode')?questionPage(qPage+1):select(index+1,true)};
questionPage(0);

let direction=1;const activeAnimations=new Set();
function animateIn(el,delay=0){if(reduced||!el)return;const animation=el.animate([{opacity:.05,transform:'translate3d('+direction*26+'px,12px,0)'},{opacity:1,transform:'translate3d(0,0,0)'}],{duration:430,delay,easing:'cubic-bezier(.18,.7,.2,1)',fill:'backwards'});activeAnimations.add(animation);animation.finished.then(()=>activeAnimations.delete(animation)).catch(()=>{});if(!ambientPlaying)animation.finish()}
function enterScene(){activeAnimations.forEach(a=>a.cancel());activeAnimations.clear();const stage=$('.experience');if(!stage.classList.contains('live'))return;const heading=stage.classList.contains('gallery-mode')?$('.deck-heading'):stage.classList.contains('questions-mode')?$('.question-scene h2'):$('.intro-copy');animateIn(heading);const cards=stage.classList.contains('gallery-mode')?[...document.querySelectorAll('.learning-card')]:stage.classList.contains('questions-mode')?[...document.querySelectorAll('.question-card:not([hidden])')]:[...document.querySelectorAll('.object')];cards.forEach((c,i)=>animateIn(c,70+i*85));wireCardMotion();updatePosition()}
function wireCardMotion(){document.querySelectorAll('.question-card,.learning-card,.object').forEach(c=>{if(c.dataset.motionReady)return;c.dataset.motionReady='true';c.addEventListener('pointermove',e=>{if(reduced||!ambientPlaying||e.pointerType!=='mouse')return;const b=c.getBoundingClientRect(),x=(e.clientX-b.left)/b.width,y=(e.clientY-b.top)/b.height;c.style.setProperty('--tilt-x',(1.5-y*3)+'deg');c.style.setProperty('--tilt-y',(x*4-2)+'deg');c.style.setProperty('--mx',(x*100)+'%');c.style.setProperty('--my',(y*100)+'%')});c.addEventListener('pointerleave',()=>{c.style.setProperty('--tilt-x','0deg');c.style.setProperty('--tilt-y','0deg')})})}
function updatePosition(){const el=$('#scene-position');if(!el)return;el.textContent=mode==='intro'?'Intro':$('.experience').classList.contains('gallery-mode')?(deckPage+1)+' / 2':$('.experience').classList.contains('questions-mode')?(qPage+1)+' / 2':(index+1)+' / 4'}
const selectBeforeMotion=select;select=function(i,manual=false){selectBeforeMotion(i,manual);requestAnimationFrame(enterScene)};
const showDeckBeforeMotion=showDeck;showDeck=function(k,page=0){showDeckBeforeMotion(k,page);requestAnimationFrame(enterScene)};
const questionsBeforeMotion=showQuestions;showQuestions=function(){questionsBeforeMotion();requestAnimationFrame(enterScene)};
const questionPageBeforeMotion=questionPage;questionPage=function(n){questionPageBeforeMotion(n);requestAnimationFrame(enterScene)};
document.addEventListener('click',e=>{if(e.target.closest('#prev,#q-prev,#learn-prev'))direction=-1;else direction=1},true);
function slideCards(selector,step){const row=$(selector);if(!row)return;const card=row.querySelector('button:not([hidden])');if(!card)return;row.scrollBy({left:step*(card.getBoundingClientRect().width+14),behavior:reduced?'instant':'smooth'})}
$('#q-card-prev').onclick=()=>slideCards('.question-grid',-1);$('#q-card-next').onclick=()=>slideCards('.question-grid',1);$('#learn-card-prev').onclick=()=>slideCards('.learning-grid',-1);$('#learn-card-next').onclick=()=>slideCards('.learning-grid',1);
// Horizontal swipes on a card row scroll that row; do not also change scenarios.
$('.experience').addEventListener('touchend',e=>{if(e.target.closest('.question-grid,.learning-grid'))e.stopImmediatePropagation()},{capture:true,passive:true});
const dialog=$('dialog');new MutationObserver(()=>{if(dialog.open){animateIn(dialog);const heading=dialog.querySelector('h2');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true})}}}).observe(dialog,{attributes:true,attributeFilter:['open']});
new MutationObserver(()=>{if(dialog.open){const heading=dialog.querySelector('h2');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true})}}}).observe($('#dialog-content'),{childList:true});
document.addEventListener('keydown',e=>{if(dialog.open||/INPUT|TEXTAREA/.test(e.target.tagName)||e.target.closest('.choices'))return;if(e.target===document.body&&(e.key==='ArrowRight'||e.key==='ArrowLeft')){e.preventDefault();$(e.key==='ArrowRight'?'#next':'#prev').click()}});
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>{reduced=e.matches;if(e.matches){ambientPlaying=false;playing=false;document.getAnimations().forEach(a=>{if(a.effect?.getTiming().iterations===Infinity)a.cancel();else a.finish()});showQuestions();status()}});
window.addEventListener('pageshow',()=>{last=performance.now()});wireCardMotion();updatePosition();

// A single calm moving track per section. Native touch scrolling remains available.
let interactionUntil=0,trackElapsed=0,trackPrevious=performance.now(),trackIndex=0;
function interactionPause(){interactionUntil=performance.now()+3000;const track=activeTrack();trackElapsed=track&&track.scrollWidth<=track.clientWidth+5?24000:9000;if(track)track.scrollTo({left:track.scrollLeft,behavior:'instant'})}
document.addEventListener('pointerdown',interactionPause,{passive:true});document.addEventListener('touchstart',interactionPause,{passive:true});document.addEventListener('keydown',interactionPause);document.addEventListener('wheel',interactionPause,{passive:true});
const motionButton=$('#pause');motionButton.classList.add('motion-toggle');$('.site-menu').append(motionButton);
const previousStatus=status;status=function(){previousStatus();motionButton.textContent=ambientPlaying?'Pause motion':'Resume motion';motionButton.title=ambientPlaying?'Pause motion':'Play motion'};status();
function activeTrack(){return $('.experience').classList.contains('questions-mode')?$('.question-grid'):$('.experience').classList.contains('gallery-mode')?$('#learning-grid'):null}
function resetTrack(){trackIndex=0;trackElapsed=0;const row=activeTrack();if(row)row.scrollTo({left:0,behavior:'instant'})}
const oldQuestionPage=questionPage;questionPage=function(){document.querySelectorAll('.question-card').forEach(c=>c.hidden=false);resetTrack();requestAnimationFrame(enterScene)};questionPage(0);
const previousDeck=showDeck;showDeck=function(k,page=0){previousDeck(k,0);if(k!=='questions'){const d=deckData[k];$('#learning-grid').innerHTML=d.cards.map((c,i)=>'<button class="learning-card" data-learn="'+i+'"><span>'+esc(c[0])+'</span><strong>'+esc(c[1])+'</strong><p>'+esc(c[2])+'</p><em>'+esc(c[3])+' ↗</em></button>').join('');document.querySelectorAll('[data-learn]').forEach(b=>b.onclick=()=>{const c=d.cards[Number(b.dataset.learn)];index=c[4];enquiryContext=c;open(c[5])})}resetTrack();requestAnimationFrame(enterScene)};
const previousQuestions=showQuestions;showQuestions=function(){previousQuestions();document.querySelectorAll('.question-card').forEach(c=>c.hidden=false);resetTrack()};
// Displayed text holds still between short slides. Touch pauses for exactly three seconds.
let keyboardNavigation=false;
document.addEventListener('keydown',()=>{keyboardNavigation=true});
document.addEventListener('pointerdown',()=>{keyboardNavigation=false},{passive:true});
function trackTick(now){const dt=now-trackPrevious;trackPrevious=now;const row=activeTrack();if(row&&!(keyboardNavigation&&document.activeElement?.closest('.experience,header,footer'))&&ambientPlaying&&!reduced&&!dialog.open&&!document.hidden&&now>=interactionUntil&&$('.experience').classList.contains('live')){trackElapsed+=dt;if(trackElapsed>=(row.scrollWidth<=row.clientWidth+5?24000:9000)){trackElapsed=0;const cards=[...row.querySelectorAll('button')].filter(c=>!c.classList.contains('excluded')),first=cards[0];if(first){const stride=first.getBoundingClientRect().width+(innerWidth<=760?14:20),max=row.scrollWidth-row.clientWidth;if(row.scrollLeft>=max-5){const keys=['questions','learn','hire','services'];const k=keys[(keys.indexOf(currentDeck)+1)%keys.length];showDeck(k)}else{row.scrollBy({left:stride,behavior:'smooth'})}}}}requestAnimationFrame(trackTick)}requestAnimationFrame(trackTick);
// Carousel gestures must not switch the whole scenario while the card track scrolls.
document.querySelectorAll('.question-grid,.learning-grid').forEach(row=>row.addEventListener('scroll',()=>{if(performance.now()<interactionUntil)trackElapsed=9000},{passive:true}));

scenarios[0]={eye:'Still just an idea?',title:'Let’s work out how to make it happen.',body:'You do not need a finished business plan. I help shape the offer, choose practical priorities and build the agreed branding, website or marketing pieces with you.',cta:'Talk through my idea',cards:['Work through the idea and who it is for.','Choose and create the first useful pieces.','Plan how people will enquire, book or buy.'],question:'Where are you with the idea?',choices:['It is still an early idea','I know what I want to offer','I am preparing to launch','I need guidance']};
scenarios.push(...[{"eye": "Too much to do at once?", "title": "Choose a useful first step.", "body": "I help review the priorities and agree a manageable piece of work, with a clear scope and price.", "cta": "Let’s choose a starting point", "cards": ["Review what matters most now.", "Create only the pieces we agree you need.", "Keep the customer’s next step clear."], "question": "What is making it hard to start?", "choices": ["Too many priorities", "Limited time", "Limited budget", "I need guidance"]}, {"eye": "Does your presentation reflect your work?", "title": "Show what makes you worth choosing.", "body": "I help clarify your offer and bring your brand, examples and message into line with the business you are building.", "cta": "Let’s review your presentation", "cards": ["Clarify what makes the offer relevant.", "Bring the branding and examples together.", "Give customers useful information before they ask."], "question": "What feels out of step with your business?", "choices": ["The branding", "The website", "The way we explain our work", "I need guidance"]}, {"eye": "Not sure what to share?", "title": "Start with what customers need to know.", "body": "I help plan and create useful content around your audience, offer and the questions people ask.", "cta": "Let’s plan useful content", "cards": ["Choose the audience and purpose.", "Create the agreed copy, images or video.", "Connect content to a useful next step."], "question": "Where would content help most?", "choices": ["Social channels", "The website", "A launch or campaign", "I need guidance"]}, {"eye": "Not sure what the marketing is doing?", "title": "Know what you are looking for.", "body": "I help agree useful measures and review the work, without confusing a completed website or campaign with a sales result.", "cta": "Let’s review what is happening", "cards": ["Choose a useful question to answer.", "Review the message and materials.", "Look at enquiries and customer steps."], "question": "What would you like to understand?", "choices": ["Which marketing brings enquiries", "Where people stop", "What to improve next", "I need guidance"]}, {"eye": "Are customers unsure about the next step?", "title": "Make the decision easier to understand.", "body": "I help explain the offer, answer common questions and improve the agreed enquiry, booking or buying route.", "cta": "Let’s look at the customer journey", "cards": ["Identify missing information.", "Improve the pages and content.", "Make the next action straightforward."], "question": "Where do people seem to need help?", "choices": ["Understanding the offer", "Choosing an option", "Enquiring, booking or buying", "I need guidance"]}, {"eye": "Losing touch after the first job?", "title": "Plan a useful reason to stay in touch.", "body": "I help organise relevant messages and practical follow-up around your customer relationship.", "cta": "Let’s review your follow-up", "cards": ["Decide when contact would be useful.", "Create appropriate messages and content.", "Agree who follows up and how."], "question": "What would you like to improve?", "choices": ["After an enquiry", "After a job or purchase", "Keeping customers informed", "I need guidance"]}, {"eye": "Does your purpose come across clearly?", "title": "Help people understand and take part.", "body": "I help organisations explain their work and connect their stories, website and invitations to a clear next step.", "cta": "Let’s talk about your organisation", "cards": ["Clarify who you need to reach.", "Create clear stories and materials.", "Connect interest to participation or contact."], "question": "What do you want people to do?", "choices": ["Understand our purpose", "Join or volunteer", "Attend or take part", "I need guidance"]}, {"eye": "Planning an event or programme?", "title": "Give people a clear reason to join.", "body": "I help shape the event message, create the agreed materials and connect the information with registration or contact.", "cta": "Let’s plan the event marketing", "cards": ["Choose the audience and invitation.", "Create event pages and promotional content.", "Make registration and information clear."], "question": "What needs the most help?", "choices": ["Explaining the event", "Promotional content", "Registration or enquiries", "I need guidance"]}, {"eye": "Presenting your work to supporters?", "title": "Make the purpose and the ask clear.", "body": "I help create clear presentations, stories and web content for conversations with supporters and partners.", "cta": "Let’s discuss the materials", "cards": ["Clarify the audience and message.", "Create useful presentations and content.", "Give people a clear way to respond."], "question": "Who are you trying to reach?", "choices": ["Community members", "Supporters", "Potential partners", "I need guidance"]}]);
const categories=['direction','marketing','customers','customers','marketing','customers','direction','direction'];document.querySelectorAll('.question-card').forEach((c,i)=>{if(!c.dataset.group)c.dataset.group=categories[i]||'direction'});
let worryFilter='all';
function filterWorries(group){worryFilter=group;document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===group)));document.querySelectorAll('.question-card').forEach(c=>c.classList.toggle('excluded',group!=='all'&&c.dataset.group!==group));resetTrack();interactionPause();requestAnimationFrame(enterScene)}
document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>filterWorries(b.dataset.filter));
document.querySelectorAll('.question-card[data-scenario]').forEach(b=>b.onclick=()=>{select(Number(b.dataset.scenario),true);$('.experience').scrollTop=0});
// Reveal the full name once, then add MARKETING without reintroducing the name.

// Pointer movement gives visitors time to read and choose. Resume after three quiet seconds.
let quietTimer, pointerAnimations=[];
function pauseForPointer(){
 interactionPause();
 document.documentElement.classList.add('interaction-still');
 for(const animation of document.getAnimations()){
  if(animation.effect?.getTiming().iterations!==Infinity)continue;if(animation.playState==='running'&&!pointerAnimations.includes(animation)){pointerAnimations.push(animation);animation.pause()}
 }
 clearTimeout(quietTimer);
 quietTimer=setTimeout(()=>{
  document.documentElement.classList.remove('interaction-still');
  for(const animation of pointerAnimations){if(animation.playState==='paused'&&ambientPlaying&&!reduced)animation.play()}
  pointerAnimations=[];
 },3000);
}
document.addEventListener('pointermove',pauseForPointer,{passive:true});
document.addEventListener('pointerdown',pauseForPointer,{passive:true});
$('#home-logo').onclick=e=>{
 e.preventDefault();if(dialog.open)dialog.close();
 showQuestions();filterWorries('all');
 $('.experience').scrollTop=0;pauseForPointer();
};

const cardDirections=[
 ['An idea','A clear offer','Explore my idea'],
 ['What you do','Why it matters','Clarify my message'],
 ['More attention','Relevant enquiries','Review my marketing'],
 ['New enquiry','Clear next step','Improve my follow-up'],
 ['Where you were','Who you are now','Review my brand'],
 ['Interest','A confident decision','Find the missing step'],
 ['One thing needed','One clear project','Choose a service'],
 ['Something feels off','A useful starting point','Help me work it out'],
 ['Too many priorities','A practical plan','Choose what comes first'],
 ['Limited budget','Focused work','Plan a manageable start'],
 ['Quality work','A stronger impression','Improve my presentation'],
 ['Similar offers','A clear difference','Show why we matter'],
 ['What to post?','Content with purpose','Plan my content'],
 ['Marketing activity','Useful evidence','Review what is working'],
 ['Website visit','A clear next step','Review my website'],
 ['Too many questions','An easier decision','Help customers choose'],
 ['A finished job','A lasting connection','Plan customer follow-up'],
 ['Our purpose','People understand','Explain our work'],
 ['People care','People take part','Encourage participation'],
 ['An upcoming event','A clear invitation','Plan event marketing'],
 ['Work worth supporting','A clear ask','Prepare our story'],
 ['A changing business','A clear direction','Plan the next chapter']
];
document.querySelectorAll('.question-card').forEach((card,i)=>{
 const d=cardDirections[i];if(!d)return;
 const route=document.createElement('div');route.className='card-route';route.setAttribute('aria-hidden','true');
 const from=document.createElement('b');from.className='route-from';from.textContent=d[0];
 const to=document.createElement('b');to.className='route-to';to.textContent=d[1];
 const dot=document.createElement('b');dot.className='route-dot';dot.style.animationDelay=(-i*.4)+'s';
 route.append(from,to,dot);card.append(route);
 const action=document.createElement('em');action.className='card-action';action.textContent=d[2]+' ↗';card.append(action);
});

let enquiryContext=null;
const realSelect=select;select=function(i,manual=false){enquiryContext=null;realSelect(i,manual)};
const nativeFormMarkup=contactForm.replace('Start a conversation</h2>','How can I reach you?</h2>');
const contactDrafts=new Map();
const contactSubmissions=new Map();
const reportNativeReceipt=createReceiptReporter(detail=>document.dispatchEvent(new CustomEvent('vnm:enquiry-saved',{detail})));
async function sendNativeEnquiry(payload){
 if(location.protocol==='file:'){const e=Error('This private file cannot submit. Use the current website form or email the copied brief.');e.definite=true;throw e}
 const local=['127.0.0.1','localhost'].includes(location.hostname);
 if(!local&&location.origin!=='https://vianovamarketing.ca'){const e=Error('Submission is not enabled on this preview address. Please use the current website form.');e.definite=true;throw e}
 const response=await fetch('/api/enquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),credentials:'same-origin',signal:AbortSignal.timeout(20000)});
 const receipt=await response.json();
 if(!response.ok){const e=Error(response.status===429?'Please wait a minute, then retry.':response.status===413?'Please shorten your message.':'Please check your details and try again.');e.definite=[400,403,413,415,429].includes(response.status);throw e}
 reportNativeReceipt(payload,receipt);return receipt;
}
function mountContact(message='',draftKey='quick'){
 const host=$('#dialog-content');host.innerHTML=nativeFormMarkup;
 const form=host.querySelector('form'),saved=contactDrafts.get(draftKey);
 if(saved){for(const [name,value] of Object.entries(saved)){if(form.elements.namedItem(name))form.elements.namedItem(name).value=value}}
 else form.elements.namedItem('message').value=message;
 form.addEventListener('input',()=>contactDrafts.set(draftKey,Object.fromEntries(new FormData(form))));
 const local=['127.0.0.1','localhost'].includes(location.hostname);
 if(!contactSubmissions.has(draftKey))contactSubmissions.set(draftKey,createSubmission({send:sendNativeEnquiry}));
 bindForm(form,{send:sendNativeEnquiry,submit:contactSubmissions.get(draftKey),isTest:local,kind:draftKey==='quick'?'quick':'brief',getMessage:v=>'Service: '+v.get('service')+'\n\n'+v.get('message')});
 const note=document.createElement('p');note.className='small';note.textContent=location.protocol==='file:'?'Private file preview: use the website form below to send.':local?'Local review: use a synthetic .invalid email for test enquiries. Nothing is sent externally.':'I’ll use your details to reply about this enquiry. We agree the work and price before starting.';form.prepend(note);
 if(location.protocol==='file:'){form.querySelector('[type="submit"]').disabled=true;form.querySelector('[type="submit"]').textContent='Use the website form below';}
 const actions=document.createElement('div');actions.className='quick-links';
 const copy=document.createElement('button');copy.type='button';copy.className='secondary';copy.textContent='Copy my message';copy.onclick=async()=>{try{await navigator.clipboard.writeText(form.elements.namedItem('message').value);copy.textContent='Message copied'}catch{form.elements.namedItem('message').focus();form.elements.namedItem('message').select();copy.textContent='Select and copy the message'}};
 const link=document.createElement('a');link.href='contact.html#enquiry-form';link.target='_blank';link.rel='noopener';link.textContent='Contact page';actions.append(copy,link);form.append(actions);
 if(draftKey!=='quick'){const back=document.createElement('button');back.type='button';back.className='secondary';back.textContent='Back to my answers';back.onclick=()=>{step=2;render()};form.append(back)}
}
const originalRender=render;render=function(){
 if(step<3){originalRender();if(step===2&&(activePath==='single'||enquiryContext))$('#back').onclick=()=>{step=0;render()};return}
 const a=record(),d=scenarios[index];
 const brief='Topic: '+(enquiryContext?.[0]||situationSelection||d.eye)+'\n'+(a[0]||'')+'\n'+(activePath!=='single'&&!enquiryContext&&a[1]?'Support: '+a[1]+'\n':'')+'\n'+(a.details||'');
 mountContact(brief,key());
};
$('#contact').onclick=()=>{mountContact();if(!dialog.open)dialog.showModal()};
// Three distinct buying options; process education stays in its own section.
deckData.hire.cards=deckData.hire.cards.slice(0,3);
deckData.hire.cards[0][1]='Not sure where to start?';
deckData.hire.cards[1][1]='Know what needs making?';
deckData.hire.cards[2][1]='Need help after launch?';
const serviceQuestions=['Too many possible directions?','Does your brand feel out of date?','Is your website making things harder?','Struggling to show what you do?','Does your marketing feel disconnected?','Are customer steps being missed?'];
deckData.services.cards.forEach((c,i)=>c[1]=serviceQuestions[i]);
const learningQuestions=['Do people understand the offer?','What should your website help people do?','What do customers need to know?','Are enquiries a good fit?','What happens after someone asks?','How will you judge the work?'];
deckData.learn.cards.forEach((c,i)=>c[1]=learningQuestions[i]);
const originalShowDeck=showDeck;showDeck=function(k,page=0){originalShowDeck(k,page);document.querySelectorAll('.learning-card').forEach(c=>{c.classList.add('editorial-card')})};
// Keep keyboard use still for as long as a control has focus; resume on leaving it.
document.addEventListener('focusin',e=>{if(e.target.closest('.experience,dialog,header'))interactionPause()});

let situationSelection='';
const previousKey=key;key=function(){return previousKey()+'-'+situationSelection};
scenarios.push({eye:'Not sure where to start?',title:'Let’s find a useful starting point.',body:'Tell me what feels difficult. I help work through the problem before suggesting what to make.',cta:'Help me work it out',cards:['Understand what is happening.','Choose a practical first improvement.','Agree the work before starting.'],question:'What feels most difficult right now?',choices:['Explaining what we do','Reaching suitable customers','Keeping up with enquiries','I need guidance']});
scenarios.push({eye:'Moving into something new?',title:'Bring the next chapter into focus.',body:'Review what is changing and agree which parts of your offer, presentation and marketing need to change with it.',cta:'Plan the next chapter',cards:['Clarify the change and audience.','Update the agreed materials.','Connect the new customer steps.'],question:'What is changing?',choices:['A new audience','A new service or product','A new location or market','I need guidance']});
const routeIndexes=[0,1,2,3,5,8,0,13,4,4,5,5,6,7,8,8,9,10,10,11,12,14];
const routePaths=['plan','plan','plan','connect','creative','connect','single','plan','plan','plan','creative','plan','creative','plan','creative','connect','connect','plan','connect','creative','creative','plan'];
const routeTitles=['Let’s turn your idea into a plan.','Make your offer easier to explain.','Focus on the people who fit.','Give every enquiry a next step.','Bring your brand up to date.','Find where the conversation stops.','Define the one piece you need.','Let’s find a useful starting point.','Choose what deserves your time.','Start with a manageable scope.','Let your presentation reflect your work.','Show what makes your offer different.','Give your content a clear purpose.','Decide what progress looks like.','Give your website a clear job.','Answer what customers need to decide.','Keep the relationship going.','Make your purpose easier to understand.','Make taking part straightforward.','Give your event a clear invitation.','Present a clear reason to support you.','Bring the next chapter into focus.'];
document.querySelectorAll('.question-card').forEach((card,i)=>{card.onclick=()=>{
 select(routeIndexes[i],true);situationSelection=card.querySelector('span').textContent;
 txt('#eyebrow',situationSelection);txt('#headline',routeTitles[i]);txt('#description',card.querySelector('small').textContent);txt('#main-action',cardDirections[i][2]);
 $('#main-action').onclick=()=>open(routePaths[i]);
 $('.experience').scrollTop=0;open(routePaths[i]);
}});
const deckContextShow=showDeck;showDeck=function(k,page=0){situationSelection='';deckContextShow(k,page)};
$('#services').onclick=()=>{enquiryContext=null;situationSelection='';open('single')};

function contextQuestion(c){
 const questions={
 'Your message':['What is hardest to explain?',['What we offer','Who it is for','Why choose us','I need guidance']],
 'Your website':['What should your website do better?',['Explain the offer','Help people enquire','Support bookings or buying','I need guidance']],
 'Your content':['What should people understand?',['The service','How it works','Why it matters','I need guidance']],
 'Your enquiries':['What is happening with enquiries?',['Too few','Not suitable','Missing information','I need guidance']],
 'Your follow-up':['Where does follow-up get difficult?',['The first reply','Keeping track','The next step','I need guidance']],
 'Your decisions':['What would you like to review?',['The message','Website activity','Enquiries and follow-up','I need guidance']],
 'Review and action plan':['What should the review focus on?',['The offer','Current marketing','Customer steps','I need guidance']],
 'Defined project':['What needs to be made?',['Brand materials','A website or store','Content or video','I need guidance']],
 'Ongoing support':['Where would regular help be useful?',['Content and campaigns','Website updates','Customer follow-up','I need guidance']],
 'Planning':['What needs a clearer direction?',['An early idea','An existing offer','Marketing priorities','I need guidance']],
 'Branding':['What needs to change in your brand?',['The logo','Brand materials','Overall consistency','I need guidance']],
 'Websites':['What kind of website help do you need?',['A new website','Improve an existing site','An online store','I need guidance']],
 'Content':['What would you like to create?',['Video','Photography','Written content','I need guidance']],
 'Marketing':['What are you preparing to promote?',['The business','A launch','An event or campaign','I need guidance']],
 'Customer steps':['Which customer step needs attention?',['Enquiries','Bookings','Replies and follow-up','I need guidance']]
 };return questions[c[0]]||['What would you like to improve?',['The message','The materials','The next step','I need guidance']];
}
const formSummaryByKey=new Map();
const formWithContact=mountContact;mountContact=function(message='',draftKey='quick'){
 const saved=contactDrafts.get(draftKey);if(saved&&saved.message===formSummaryByKey.get(draftKey))saved.message=message;formSummaryByKey.set(draftKey,message);
 formWithContact(message,draftKey);
 const form=$('#enquiry-form');
 if(draftKey!=='quick')form.querySelector('select[name="service"]').closest('label').hidden=true;
 const alternatives=document.createElement('p');alternatives.className='small';
 alternatives.innerHTML='<a href="tel:+14372376895">Call</a> · <a href="https://wa.me/14372376895" target="_blank" rel="noopener">WhatsApp</a> · <a href="quote.html" target="_blank" rel="noopener">Detailed project brief</a>';
 form.append(alternatives);
};
const hireWithJourney=showDeck;showDeck=function(k,page=0){hireWithJourney(k,page);const old=$('#process-line');if(old)old.remove();if(k==='hire'){const line=document.createElement('p');line.id='process-line';line.textContent='Understand the problem → Agree the plan and price → Build → Test and review → Hand over and support';$('.deck-heading').after(line)}};

const sectionFromHash={situations:'questions',connections:'learn',working:'hire',services:'services'};
function openHashSection(){const k=sectionFromHash[location.hash.slice(1)];if(k)showDeck(k)}
window.addEventListener('hashchange',openHashSection);openHashSection();
// The new film hands off to the existing website, not a duplicate landing page.
const vnOverlay=document.querySelector('#vn-intro'),vnVideo=document.querySelector('#vn-intro-video');
let vnLeaving=false;
function vnFinish(){if(vnLeaving)return;vnLeaving=true;vnVideo.pause();showQuestions();document.querySelector('.shell').inert=false;document.body.classList.remove('vn-intro-active');document.querySelector('.shell').classList.add('vn-reveal');vnOverlay.classList.add('leaving');setTimeout(()=>{vnOverlay.hidden=true;document.querySelector('.shell').classList.remove('vn-reveal');},reduced?0:1120)}
function vnStart(){if(reduced){showQuestions();return}vnLeaving=false;playing=false;vnOverlay.hidden=false;vnOverlay.classList.remove('leaving');document.querySelector('.shell').inert=true;document.body.classList.add('vn-intro-active');vnVideo.currentTime=0;vnVideo.play().catch(()=>{document.querySelector('#vn-intro-pause').textContent='Play intro'});}
vnVideo.addEventListener('ended',vnFinish);vnVideo.addEventListener('error',vnFinish);vnVideo.addEventListener('play',()=>document.querySelector('#vn-intro-pause').textContent='Pause intro');vnVideo.addEventListener('pause',()=>document.querySelector('#vn-intro-pause').textContent='Play intro');
document.querySelector('#vn-intro-skip').onclick=vnFinish;document.querySelector('#vn-intro-pause').onclick=()=>vnVideo.paused?vnVideo.play().catch(vnFinish):vnVideo.pause();
document.querySelector('#replay').onclick=vnStart;document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!vnOverlay.hidden)vnFinish()});document.addEventListener('visibilitychange',()=>{if(document.hidden)vnVideo.pause()});
if(!location.hash&&!reduced)vnStart();else showQuestions();
