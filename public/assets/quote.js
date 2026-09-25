import { questions, activeQuestions, hasService } from './quote-questions.js';
import { briefSummary } from './quote-model.js';
const form = document.querySelector('#quote-form');
if (form) {
  const fields = new Map([...form.querySelectorAll('[data-question]')].map(el => [el.dataset.question, el]));
  const final = form.querySelector('#quote-final');
  const next = form.querySelector('#quote-next');
  const back = form.querySelector('#quote-back');
  const returnButton = form.querySelector('#quote-return');
  const review = form.querySelector('#quote-review');
  let current = questions[0].id;
  let reviewed = false;
  let active = [];
  form.noValidate = true;
  // Read disabled values too, so a temporarily removed route can be restored.
  function answers() {
    const result = {};
    for (const q of questions) {
      const controls = [...fields.get(q.id).querySelectorAll('input,textarea,select')];
      result[q.id] = q.multiple ? controls.filter(c => c.checked).map(c => c.value) : q.choices ? controls.find(c => c.checked)?.value || '' : controls[0].value.trim();
    }
    return result;
  }
  function sync() {
    active = activeQuestions(answers());
    const ids = new Set(active.map(q => q.id));
    for (const [id, field] of fields) for (const control of field.querySelectorAll('input,textarea,select')) control.disabled = !ids.has(id);
  }
  function valid(id) {
    const q = questions.find(q => q.id === id);
    if (!q) return true;
    const field = fields.get(id);
    const a = answers()[id];
    if (q.required && q.choices && !a.length) {
      field.querySelector('[data-error]').hidden = false;
      field.querySelector('input').focus(); return false;
    }
    field.querySelector('[data-error]').hidden = true;
    for (const control of field.querySelectorAll('input,textarea,select')) if (!control.checkValidity()) { control.reportValidity(); return false; }
    return true;
  }
  function summaryEntries() {
    const a = answers();
    const rows = active.map(q => [q.id, Array.isArray(a[q.id]) ? a[q.id].join(', ') : a[q.id] || 'Not supplied — discuss if needed']);
    if ((a.Services || []).includes('Help me decide')) {
      const chosen = a['Support direction'];
      rows.push(['Guidance status', chosen && hasService(a, chosen) ? `Customer confirmed support: ${chosen}` : 'No additional service confirmed; discuss suitable next steps.']);
    }
    rows.push(['Brief status', 'Customer-supplied information and goals; evidence, assumptions, feasibility and scope to be confirmed together. No price or delivery commitment.']);
    return rows;
  }
  function buildReview() {
    review.replaceChildren();
    const list = document.createElement('dl');
    const unanswered = document.createElement('dl');
    let unansweredCount = 0;
    for (const [key, value] of summaryEntries()) {
      const term = document.createElement('dt'); term.textContent = key === 'name' ? 'Your name' : key === 'email' ? 'Your email' : key;
      const detail = document.createElement('dd'); detail.textContent = value;
      if (fields.has(key)) {
        const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'small-link'; edit.textContent = 'Edit'; edit.setAttribute('aria-label', `Edit ${key}`);
        edit.addEventListener('click', () => show(key)); detail.append(' ', edit);
      }
      if (value === 'Not supplied — discuss if needed') { unanswered.append(term, detail); unansweredCount++; }
      else list.append(term, detail);
    }
    review.append(list);
    if (unansweredCount) {
      const details = document.createElement('details');
      const heading = document.createElement('summary'); heading.textContent = `${unansweredCount} optional answers left for discussion — review or edit`;
      details.append(heading, unanswered); review.append(details);
    }
  }
  function show(id, focus = true) {
    sync();
    current = id === 'review' || active.some(q => q.id === id) ? id : active[0].id;
    for (const [key, field] of fields) field.hidden = key !== current;
    const isReview = current === 'review';
    final.hidden = !isReview;
    const index = isReview ? active.length : active.findIndex(q => q.id === current);
    back.hidden = index === 0; next.hidden = isReview;
    returnButton.hidden = !reviewed || isReview;
    form.querySelector('#quote-status').textContent = isReview ? 'Review your brief' : `Question ${index + 1} of ${active.length} on your current path`;
    form.querySelector('progress').max = active.length + 1; form.querySelector('progress').value = index + 1;
    if (isReview) { reviewed = true; buildReview(); }
    if (focus) (isReview ? final : fields.get(current)).querySelector('legend').focus();
  }
  function reviewWhenValid() {
    sync();
    for (const q of active) {
      const a = answers()[q.id];
      if ((q.required && !a.length) || [...fields.get(q.id).querySelectorAll('input,textarea,select')].some(c => !c.checkValidity())) { show(q.id); valid(q.id); return false; }
    }
    show('review'); return true;
  }
  next.addEventListener('click', () => {
    if (!valid(current)) return;
    sync(); const index = active.findIndex(q => q.id === current);
    if (index + 1 === active.length) reviewWhenValid(); else show(active[index + 1].id);
  });
  back.addEventListener('click', () => { sync(); const index = current === 'review' ? active.length : active.findIndex(q => q.id === current); show(active[Math.max(0,index - 1)].id); });
  returnButton.addEventListener('click', reviewWhenValid);
  form.addEventListener('change', event => {
    if (event.target.name === 'Support direction') for (const c of fields.get('Confirm suggested support').querySelectorAll('input')) c.checked = false;
    const previous = active.map(q => q.id);
    sync();
    const removed = previous.filter(id => !active.some(q => q.id === id));
    if (removed.length) {
      const note = form.querySelector('#quote-route-note'); note.hidden = false;
      note.textContent = 'Your path has changed. Answers for removed questions stay available if you switch back, but will not be included in your brief. Shared answers are kept.';
    }
    if (current !== 'review') fields.get(current)?.querySelector('[data-error]')?.setAttribute('hidden','');
    show(current, false);
  });
  form.addEventListener('submit', event => {
    if (current !== 'review') { event.preventDefault(); next.click(); return; }
    if (!reviewWhenValid()) { event.preventDefault(); return; }
    form.querySelector('#quote-message').value = briefSummary(summaryEntries());
  });
  show(current, false); form.hidden = false; document.querySelector('#quote-fallback').hidden = true;
}
