// Original instrumental cue, loaded only when a visitor asks for music.
const music = new Audio('assets/via-nova-ambient.wav');
music.id = 'background-music';
music.hidden = true;
document.body.append(music);
music.preload = 'none';
music.loop = true;
music.volume = 0.12;
let enabled = false;
const buttons = [];
function update() {
  for (const button of buttons) {
    button.textContent = enabled ? 'Music on' : 'Music off';
    button.setAttribute('aria-pressed', String(enabled));
    button.setAttribute('aria-label', enabled ? 'Turn background music off' : 'Turn soft background music on');
  }
}
for (const selector of ['.vn-intro-controls', 'footer']) {
  const parent = document.querySelector(selector);
  if (!parent) continue;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'music-toggle';
  buttons.push(button);
  parent.append(button);
  button.addEventListener('click', async () => {
    enabled = !enabled;
    update();
    if (!enabled) { music.pause(); return; }
    try { await music.play(); }
    catch { enabled = false; update(); }
  });
}
update();
document.addEventListener('visibilitychange', () => {
  if (document.hidden) music.pause();
  else if (enabled) music.play().catch(() => { enabled = false; update(); });
});
window.addEventListener('pagehide', () => music.pause());

