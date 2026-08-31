// RIDGE client utilities — SSE alert stream, token sync
document.addEventListener('DOMContentLoaded', () => {
  if (typeof EventSource !== 'undefined' && document.getElementById('alert-feed')) {
    const es = new EventSource('/api/v1/events/alerts')
    es.addEventListener('alert', () => {
      const feed = document.getElementById('alert-feed')
      if (feed && typeof htmx !== 'undefined') htmx.ajax('GET', '/partials/alert-feed', { target: '#alert-feed', swap: 'innerHTML' })
    })
  }
})
