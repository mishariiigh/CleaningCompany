const form = document.getElementById('contact-form');
const statusBox = document.getElementById('form-status');
const yearEl = document.getElementById('year');

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

function setStatus(message, type) {
  if (!statusBox) return;
  statusBox.textContent = message;
  statusBox.className = `form-status ${type}`;
}

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Sending...';
    }

    setStatus('', '');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = result?.errors
          ? Object.values(result.errors).join(' ')
          : result?.error || 'Please check your form and try again.';
        setStatus(message, 'error');
        return;
      }

      setStatus('Thank you! Your quote request has been submitted successfully.', 'success');
      form.reset();
    } catch (error) {
      console.error('Submission failed:', error);
      setStatus('Something went wrong while submitting your request. Please try again later.', 'error');
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Send my quote request';
      }
    }
  });
}
