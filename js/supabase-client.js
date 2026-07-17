// Supabase REST integration — no SDK needed, just fetch
// Forms → quote_requests, contact_messages, website_leads tables
// Files → quote-attachments storage bucket
(function () {
  const SUPABASE_URL = 'https://ghetmdydvsmmwjhnqaxh.supabase.co'
  const SUPABASE_ANON = 'sb_publishable_fgooOnpeMj1tHkw2RBnv6w_GWTwdFSc'

  const headers = {
    'apikey': SUPABASE_ANON,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal',
  }

  async function insert(table, row) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(row),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || `Failed to save (${res.status})`)
    }
  }

  async function uploadFile(file) {
    if (!file) return null
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/quote-attachments/${path}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON,
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    })
    if (!res.ok) return null
    return `${SUPABASE_URL}/storage/v1/object/public/quote-attachments/${path}`
  }

  // Public API
  window.letar = {
    async submitQuote(data, file) {
      const fileUrl = file ? await uploadFile(file) : null
      await insert('quote_requests', {
        name: data.name,
        company: data.company,
        email: data.email,
        phone: data.phone || null,
        description: data.description,
        quantity: data.quantity || null,
        material: data.material || null,
        required_date: data.required_date || null,
        file_url: fileUrl,
      })
    },

    async submitContact(data) {
      await insert('contact_messages', {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        message: data.message,
      })
    },

    async saveLead(email) {
      await insert('website_leads', { email })
    },
  }

  // ── Quote form handler (index.html + contact.html) ──
  const quoteForm = document.getElementById('quote-form')
  if (quoteForm) {
    quoteForm.addEventListener('submit', async e => {
      e.preventDefault()
      const btn = document.getElementById('quote-submit')
      const notice = document.getElementById('quote-notice')
      const fileInput = document.getElementById('file-input')

      btn.disabled = true
      btn.innerHTML = '<span class="spinner"></span> Sending…'
      if (notice) { notice.textContent = ''; notice.className = 'form-notice'; notice.style.display = 'none'; }

      const fd = new FormData(quoteForm)
      const data = Object.fromEntries(fd.entries())
      const file = fileInput && fileInput.files[0] ? fileInput.files[0] : null

      // Honeypot: real users never fill the hidden field; bots do. Silently "succeed".
      if (data._hp) {
        const formBody = document.getElementById('quote-form-body')
        const formSuccess = document.getElementById('quote-success')
        if (formBody) formBody.style.display = 'none'
        if (formSuccess) formSuccess.style.display = 'block'
        return
      }

      try {
        await window.letar.submitQuote(data, file)
        // Show success state
        const formBody = document.getElementById('quote-form-body')
        const formSuccess = document.getElementById('quote-success')
        if (formBody) formBody.style.display = 'none'
        if (formSuccess) formSuccess.style.display = 'block'
      } catch (err) {
        if (notice) {
          notice.textContent = 'Something went wrong — please try again or email us directly.'
          notice.className = 'form-notice error'
          notice.style.display = 'block'
        }
        btn.disabled = false
        btn.innerHTML = 'Send Request'
      }
    })
  }

  // ── Contact form handler (contact.html) ──
  const contactForm = document.getElementById('contact-form')
  if (contactForm) {
    contactForm.addEventListener('submit', async e => {
      e.preventDefault()
      const btn = document.getElementById('contact-submit')
      const notice = document.getElementById('contact-notice')

      btn.disabled = true
      btn.innerHTML = '<span class="spinner"></span> Sending…'
      if (notice) { notice.textContent = ''; notice.style.display = 'none'; }

      const fd = new FormData(contactForm)
      const data = Object.fromEntries(fd.entries())

      // Honeypot — silently drop bot submissions.
      if (data._hp) {
        const formBody = document.getElementById('contact-form-body')
        const formSuccess = document.getElementById('contact-success')
        if (formBody) formBody.style.display = 'none'
        if (formSuccess) formSuccess.style.display = 'block'
        return
      }

      try {
        await window.letar.submitContact(data)
        const formBody = document.getElementById('contact-form-body')
        const formSuccess = document.getElementById('contact-success')
        if (formBody) formBody.style.display = 'none'
        if (formSuccess) formSuccess.style.display = 'block'
      } catch {
        if (notice) {
          notice.textContent = 'Something went wrong — please email us at info@letarinc.com'
          notice.className = 'form-notice error'
          notice.style.display = 'block'
        }
        btn.disabled = false
        btn.innerHTML = 'Send Message'
      }
    })
  }
})()
