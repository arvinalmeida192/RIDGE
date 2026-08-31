const IST = 'Asia/Kolkata'

export function formatIST(date, options = {}) {
  if (!date) return '—'
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-IN', { timeZone: IST, ...options })
}

export function formatISTDateTime(date) {
  return formatIST(date, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  })
}

export function formatISTDate(date) {
  return formatIST(date, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatISTTime(date) {
  return formatIST(date, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  })
}

export default { formatIST, formatISTDateTime, formatISTDate, formatISTTime }
