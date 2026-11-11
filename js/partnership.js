(() => {
  const form = document.getElementById('partnership-form');
  if (!form) return;
  const status = form.querySelector('[role="status"]');
  const button = form.querySelector('button[type="submit"]');
  const choices = [...form.querySelectorAll('[name="support"]')];
  function validateChoices() {
    choices[0].setCustomValidity(choices.some(input => input.checked) ? '' : 'Please choose at least one way to partner.');
  }
  choices.forEach(input => input.addEventListener('change', validateChoices));
  validateChoices();
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (button.disabled || !form.reportValidity()) return;
    const data = new FormData(form);
    if (data.get('_gotcha')) return;
    button.disabled = true;
    button.textContent = 'Sending…';
    status.textContent = '';
    const payload = Object.fromEntries(data);
    payload.support = data.getAll('support').join(', ');
    payload.updates = data.has('updates') ? 'Yes' : 'No';
    payload.consent = 'Agreed to contact about this inquiry';
    payload._subject = 'Learn And Lunch — partnership inquiry';
    payload._replyto = data.get('email');
    payload._template = 'table';
    try {
      const response = await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(form.dataset.email), {
        method: 'POST', headers: {'Content-Type': 'application/json', Accept: 'application/json'}, body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok || (result.success !== true && result.success !== 'true')) throw new Error('Submission failed');
      status.textContent = 'Thank you! Your partnership inquiry has been submitted.';
      form.reset();
      validateChoices();
    } catch {
      status.textContent = 'Your inquiry could not be sent. Please try again or email ' + form.dataset.email + '. Your entries have been kept.';
    } finally {
      button.disabled = false;
      button.textContent = 'Submit partnership inquiry →';
    }
  });
})();
