const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#main-nav');
toggle.hidden = false;
document.documentElement.classList.add('js');
function closeMenu() { toggle.setAttribute('aria-expanded', 'false'); nav.classList.remove('open'); }
toggle.addEventListener('click', () => { const open = toggle.getAttribute('aria-expanded') !== 'true'; toggle.setAttribute('aria-expanded', String(open)); nav.classList.toggle('open', open); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { closeMenu(); toggle.focus(); } });
nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
matchMedia('(min-width: 761px)').addEventListener('change', closeMenu);
document.querySelector('#brief-form')?.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const text = ['VIA NOVA MARKETING', 'Project brief — prepared locally, not submitted', '', ...[['Name','name'],['Business','business'],['Service','service'],['Goals & challenge','challenge'],['Timing','timing']].map(([label,key]) => `${label}: ${data.get(key) || 'Not specified'}`)].join('\n\n');
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = 'via-nova-project-brief.txt'; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  document.querySelector('#form-status').textContent = 'Your brief is ready to save. Nothing has been sent. Keep it for your first conversation.';
});
