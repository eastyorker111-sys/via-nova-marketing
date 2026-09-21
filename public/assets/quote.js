import { includesService, briefEntries, briefSummary } from './quote-model.js';
const form = document.querySelector('#quote-form');
if (form) {
  const steps = [...form.querySelectorAll('[data-step]')];
  const next = form.querySelector('#quote-next');
  const back = form.querySelector('#quote-back');
  const review = form.querySelector('#quote-review');
  let current = 0;
  form.elements['Goals and audience'].required = true;
  form.noValidate = true;
  function branches() {
    const selected = new FormData(form).getAll('Services');
    for (const block of form.querySelectorAll('[data-services]')) {
      block.hidden = !includesService(selected, block.dataset.services);
      for (const control of block.querySelectorAll('input,textarea,select')) control.disabled = block.hidden;
    }
  }
  function valid(index) {
    for (const control of steps[index].querySelectorAll('input,textarea,select')) {
      if (!control.checkValidity()) { control.reportValidity(); return false; }
    }
    return true;
  }
  function show(index, focus = true) {
    current = index;
    branches();
    steps.forEach((step, i) => { step.hidden = i !== current; });
    back.hidden = current === 0;
    next.hidden = current === steps.length - 1;
    form.querySelector('#quote-status').textContent = `Step ${current + 1} of ${steps.length}`;
    form.querySelector('progress').value = current + 1;
    if (current === steps.length - 1) {
      review.replaceChildren();
      const heading = document.createElement('h2'); heading.textContent = 'Your project brief'; review.append(heading);
      const list = document.createElement('dl');
      for (const [key, value] of briefEntries(new FormData(form))) {
        if (['name','email','Phone'].includes(key)) continue;
        const term = document.createElement('dt'); term.textContent = key;
        const detail = document.createElement('dd'); detail.textContent = value;
        list.append(term, detail);
      }
      review.append(list); review.hidden = false;
    }
    if (focus) steps[current].querySelector('legend').focus();
  }
  next.addEventListener('click', () => { if (valid(current)) show(current + 1); });
  back.addEventListener('click', () => show(current - 1));
  form.addEventListener('change', branches);
  form.addEventListener('submit', event => {
    if (current < steps.length - 1) {
      event.preventDefault(); if (valid(current)) show(current + 1); return;
    }
    for (let i = 0; i < steps.length; i++) {
      if ([...steps[i].querySelectorAll('input,textarea,select')].some(control => !control.checkValidity())) {
        event.preventDefault(); show(i); valid(i); return;
      }
    }
    form.querySelector('#quote-message').value = briefSummary(new FormData(form));
  });
  form.querySelector('#quote-progress').hidden = false;
  form.querySelector('.quote-actions').hidden = false;
  show(0, false);
}
