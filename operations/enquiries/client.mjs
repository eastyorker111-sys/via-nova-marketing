// Prepared for the replacement route; deliberately not loaded by the public site.
// Keep the request in memory only: customer text must not enter browser storage.
export function createSubmission({ send, newId = () => crypto.randomUUID() }) {
  let pending, saved, busy = false;
  return async function submit(fields) {
    if (busy) return { state: 'busy', message: 'Sending. Please wait.' };
    const fingerprint = JSON.stringify(fields);
    if (saved?.fingerprint === fingerprint) return saved.result;
    if (pending && pending.fingerprint !== fingerprint) {
      return { state: 'uncertain', message: `Keep the original details unchanged and retry reference ${pending.id}. Contact us before starting a different request.` };
    }
    pending ||= { id: newId(), fingerprint };
    busy = true;
    try {
      const receipt = await send({ ...fields, id: pending.id });
      if (!receipt.ok || !receipt.stored || receipt.id !== pending.id) throw new Error('No matching receipt');
      const result = { state: 'saved', id: receipt.id, message: receipt.isTest
        ? `TEST saved. Reference ${receipt.id}. Notification delivery is not configured. No work is booked.`
        : `Enquiry saved. Reference ${receipt.id}. This is not a confirmed project or booking.` };
      saved = { fingerprint, result }; pending = undefined;
      return result;
    } catch {
      return { state: 'retry', id: pending.id, message: `Storage could not be confirmed. Keep this page open and retry with the same details and reference ${pending.id}. You can also contact hello@vianovamarketing.ca and quote this reference.` };
    } finally { busy = false; }
  };
}

export function bindForm(form, { send, isTest = true, kind = 'quick', getMessage } = {}) {
  const status = form.querySelector('[role="status"]');
  const button = form.querySelector('[type="submit"]');
  if (!status || !button || !send) throw new Error('A status area, submit button and verified transport are required');
  const submit = createSubmission({ send });
  const handler = async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const values = new FormData(form);
    const fields = { kind, isTest, name: String(values.get('name') || ''), email: String(values.get('email') || ''), business: String(values.get('business') || ''), website: String(values.get('_gotcha') || ''), message: getMessage ? getMessage(values) : String(values.get('message') || '') };
    button.disabled = true; status.textContent = 'Sending. Please wait.';
    const result = await submit(fields);
    status.textContent = result.message;
    button.disabled = false;
    // Use textContent, never render customer content as markup. Preserve inputs on failure.
    status.focus();
  };
  form.addEventListener('submit', handler);
  return () => form.removeEventListener('submit', handler);
}
