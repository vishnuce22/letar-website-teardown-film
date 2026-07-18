// Letar RFQ + Contact forms — send straight to info@letarinc.com via Web3Forms.
// No database. Free reliable email delivery. Get a key at https://web3forms.com
// (enter info@letarinc.com; the key is emailed to you), then paste it below.
(function () {
  const ACCESS_KEY = 'PASTE_YOUR_WEB3FORMS_ACCESS_KEY_HERE'
  const ENDPOINT = 'https://api.web3forms.com/submit'

  async function send(formEl, subject) {
    const fd = new FormData(formEl)
    fd.delete('_hp')
    fd.append('access_key', ACCESS_KEY)
    fd.append('subject', subject)
    fd.append('from_name', 'Letar Inc. Website')
    const res = await fetch(ENDPOINT, { method: 'POST', body: fd })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.success) throw new Error(data.message || `Send failed (${res.status})`)
  }

  function wire(formId, btnId, noticeId, bodyId, successId, subject, btnLabel) {
    const form = document.getElementById(formId)
    if (!form) return
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      const btn = document.getElementById(btnId)
      const notice = document.getElementById(noticeId)
      const showSuccess = () => {
        const b = document.getElementById(bodyId), s = document.getElementById(successId)
        if (b) b.style.display = 'none'
        if (s) s.style.display = 'block'
      }
      // Honeypot — bots fill the hidden field; silently "succeed".
      const hp = form.querySelector('[name="_hp"]')
      if (hp && hp.value) { showSuccess(); return }

      if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Sending&hellip;' }
      if (notice) { notice.textContent = ''; notice.style.display = 'none' }
      try {
        await send(form, subject)
        showSuccess()
      } catch (err) {
        if (notice) {
          notice.textContent = 'Something went wrong — please email us at info@letarinc.com'
          notice.className = 'form-notice error'
          notice.style.display = 'block'
        }
        if (btn) { btn.disabled = false; btn.innerHTML = btnLabel }
      }
    })
  }

  wire('quote-form', 'quote-submit', 'quote-notice', 'quote-form-body', 'quote-success', 'New Quote Request — letarinc.com', 'Send Request')
  wire('contact-form', 'contact-submit', 'contact-notice', 'contact-form-body', 'contact-success', 'New Contact Message — letarinc.com', 'Send Message')
})()
