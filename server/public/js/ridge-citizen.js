// Citizen portal — subscription form and API helpers
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('subscribe-form')
  const unsubBtn = document.getElementById('unsubscribe-btn')
  const msgEl = document.getElementById('subscribe-message')

  const msgs = {
    success: form?.dataset.msgSuccess || 'Successfully subscribed!',
    error: form?.dataset.msgError || 'Could not subscribe.',
    phoneInvalid: form?.dataset.msgPhoneInvalid || 'Please enter a valid 10-digit mobile number.',
    unsubSuccess: form?.dataset.msgUnsubSuccess || 'Unsubscribed from SMS alerts.',
    unsubError: form?.dataset.msgUnsubError || 'Could not unsubscribe.',
    network: form?.dataset.msgNetwork || 'Network error. Please try again.',
  }

  function showMessage(text, type = 'success') {
    if (!msgEl) return
    msgEl.textContent = text
    msgEl.className = `form-message form-message-${type}`
    msgEl.hidden = false
  }

  function normalizePhone(raw) {
    const digits = raw.replace(/\D/g, '')
    if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`
    if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`
    if (raw.startsWith('+') && digits.length >= 10) return `+${digits}`
    return null
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      const zoneId = form.dataset.zoneId
      const phone = normalizePhone(form.phone.value)
      if (!phone) {
        showMessage(msgs.phoneInvalid, 'error')
        return
      }
      try {
        const res = await fetch('/api/v1/citizen/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ zoneId, phone }),
        })
        const data = await res.json()
        if (res.ok) {
          showMessage(msgs.success, 'success')
          setTimeout(() => location.reload(), 1500)
        } else {
          showMessage(data.error || msgs.error, 'error')
        }
      } catch {
        showMessage(msgs.network, 'error')
      }
    })
  }

  if (unsubBtn) {
    unsubBtn.addEventListener('click', async () => {
      const zoneId = form?.dataset.zoneId
      const phone = unsubBtn.dataset.phone
      if (!zoneId || !phone) return
      try {
        const res = await fetch('/api/v1/citizen/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ zoneId, phone }),
        })
        if (res.ok) {
          showMessage(msgs.unsubSuccess, 'success')
          setTimeout(() => location.reload(), 1500)
        } else {
          const data = await res.json()
          showMessage(data.error || msgs.unsubError, 'error')
        }
      } catch {
        showMessage(msgs.network, 'error')
      }
    })
  }
})
