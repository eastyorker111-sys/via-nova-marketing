const dialog = document.querySelector('#intro-dialog');
const video = document.querySelector('#intro-video');
const play = document.querySelector('#play-intro');
const seek = document.querySelector('#intro-seek');
const musicButton = document.querySelector('#music-intro');
const music = new Audio();
music.preload = 'none';
music.volume = 0.7;
music.loop = true;
let musicEnabled = false;
let opener;
const captions = [
 [0,'Branding, websites & marketing','Good work deserves to be seen.','Help customers understand what you offer and take the next step.'],
 [3,'Start with your business','What is getting in the way?','A new idea, an unclear offer or a website that needs attention.'],
 [6,'Build the pieces you need','One service. Or connected support.','Bring your branding, website and content together.'],
 [9.7,'Heart in Crystal · In-house project','From an idea to an online presence.','Business name, identity, website and product visuals.'],
 [12.8,'Heart in Crystal · In-house project','Make the next step clear.','Connect the offer, useful information and the customer journey.'],
 [16.9,'Work directly with Nabil Khan','What could we build for you?','We agree the work and price before starting.']
];
function updateCaption() {
 const c = captions.filter(c => video.currentTime >= c[0]).at(-1) || captions[0];
 ['film-context','film-title','film-description'].forEach((id,i) => document.getElementById(id).textContent=c[i+1]);
 if(Number.isFinite(video.duration)) seek.value=String(video.currentTime/video.duration*100);
 document.querySelector('#intro-time').textContent=`${Math.floor(video.currentTime/60)}:${String(Math.floor(video.currentTime%60)).padStart(2,'0')}`;
}
function resetMusic(){musicEnabled=false;music.pause();musicButton.textContent='Music off';musicButton.setAttribute('aria-pressed','false')}
async function startMusic(){if(musicEnabled && dialog.open && !video.paused)try{await music.play()}catch{resetMusic()}}
async function startVideo(){try{await video.play()}catch{play.textContent='Play';document.querySelector('#video-status').textContent='Press Play to start the introduction.'}}
document.querySelectorAll('[data-watch]').forEach(button=>button.addEventListener('click',()=>{
 opener=button;resetMusic();dialog.showModal();document.querySelector('#video-status').textContent='';
 const source=video.querySelector('source');if(!source.src){source.src=source.dataset.src;video.load()}
 video.currentTime=0;updateCaption();startVideo();
}));
document.querySelector('#close-intro').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{video.pause();resetMusic();opener?.focus({preventScroll:true})});
dialog.querySelector('.player-contact').addEventListener('click',()=>dialog.close());
play.addEventListener('click',()=>{if(video.paused){if(video.ended)video.currentTime=0;startVideo()}else video.pause()});
video.addEventListener('play',()=>{play.textContent='Pause';startMusic()});
video.addEventListener('pause',()=>{play.textContent=video.ended?'Replay':'Play';music.pause()});
video.addEventListener('ended',()=>{play.textContent='Replay';music.pause()});
video.addEventListener('timeupdate',updateCaption);video.addEventListener('seeked',updateCaption);
seek.addEventListener('input',()=>{if(Number.isFinite(video.duration))video.currentTime=Number(seek.value)*video.duration/100});
musicButton.addEventListener('click',()=>{if(musicEnabled){resetMusic();return}if(!music.src)music.src='assets/light-thought-piano.mp3';musicEnabled=true;musicButton.textContent='Music on';musicButton.setAttribute('aria-pressed','true');startMusic()});
function mediaError(){document.querySelector('#video-status').textContent='The video could not load. You can read the introduction below or contact me directly.';play.textContent='Retry';resetMusic()}
video.addEventListener('error',mediaError);video.querySelector('source').addEventListener('error',mediaError);
document.addEventListener('visibilitychange',()=>{if(document.hidden){video.pause();music.pause()}});
window.addEventListener('pagehide',()=>{video.pause();music.pause()});
