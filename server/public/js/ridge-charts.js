const CHART_COLORS = ['#4ade80', '#fde047', '#fb923c', '#ff3b3b', '#ff1155', '#3b82f6']

const RidgeCharts = {
  riskDistribution(id) {
    const canvas = document.getElementById(id)
    if (!canvas || typeof Chart === 'undefined') return
    const data = JSON.parse(canvas.dataset.chart || '[]')
    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: data.map((d) => d.level),
        datasets: [{ data: data.map((d) => d.count), backgroundColor: CHART_COLORS }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
        scales: { x: { ticks: { color: '#94a3b8' } }, y: { ticks: { color: '#94a3b8' }, beginAtZero: true } } },
    })
  },

  rainfallCorrelation(id) {
    const canvas = document.getElementById(id)
    if (!canvas) return
    const data = JSON.parse(canvas.dataset.chart || '[]')
    new Chart(canvas, {
      type: 'scatter',
      data: {
        datasets: [{
          data: data.map((d) => ({ x: d.rainfall, y: d.risk })),
          backgroundColor: '#4ade80',
          pointRadius: 6,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { title: { display: true, text: 'Rainfall (mm)', color: '#94a3b8' }, ticks: { color: '#94a3b8' } },
          y: { title: { display: true, text: 'Risk Score', color: '#94a3b8' }, ticks: { color: '#94a3b8' }, min: 0, max: 5 },
        },
      },
    })
  },

  riskPie(id) {
    const canvas = document.getElementById(id)
    if (!canvas) return
    const data = JSON.parse(canvas.dataset.chart || '[]')
    new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: data.map((d) => d.level),
        datasets: [{ data: data.map((d) => d.count), backgroundColor: CHART_COLORS }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#94a3b8' } } } },
    })
  },

  rainfallBar(id) {
    const canvas = document.getElementById(id)
    if (!canvas) return
    const data = JSON.parse(canvas.dataset.chart || '[]')
    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: data.map((d) => d.zone),
        datasets: [
          { label: 'Rainfall (mm)', data: data.map((d) => d.rainfall), backgroundColor: '#3b82f6', yAxisID: 'y' },
          { label: 'Risk Score', data: data.map((d) => d.risk), backgroundColor: '#4ade80', yAxisID: 'y1' },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#94a3b8' } } },
        scales: {
          x: { ticks: { color: '#94a3b8', maxRotation: 45 } },
          y: { position: 'left', ticks: { color: '#94a3b8' } },
          y1: { position: 'right', min: 0, max: 5, ticks: { color: '#94a3b8' }, grid: { drawOnChartArea: false } },
        },
      },
    })
  },

  seasonalHeatmap(id) {
    const canvas = document.getElementById(id)
    if (!canvas) return
    const data = JSON.parse(canvas.dataset.chart || '[]')
    new Chart(canvas, {
      type: 'line',
      data: {
        labels: data.map((d) => d.month),
        datasets: [{ label: 'Avg Risk', data: data.map((d) => d.avgRisk), borderColor: '#ff3b3b', backgroundColor: 'rgba(255,59,59,0.1)', fill: true, tension: 0.3 }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#94a3b8' } } },
        scales: { x: { ticks: { color: '#94a3b8' } }, y: { min: 0, max: 5, ticks: { color: '#94a3b8' } } } },
    })
  },

  trajectory(id) {
    const canvas = document.getElementById(id)
    if (!canvas) return
    const data = JSON.parse(canvas.dataset.trajectory || '[]')
    if (!data.length) return
    new Chart(canvas, {
      type: 'line',
      data: {
        labels: data.map((d) => new Date(d.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })),
        datasets: [
          { label: 'Risk Score', data: data.map((d) => d.value), borderColor: '#4ade80', tension: 0.3, fill: false },
          { label: 'Upper', data: data.map((d) => d.confidenceHigh), borderColor: 'rgba(74,222,128,0.3)', borderDash: [4, 4], pointRadius: 0 },
          { label: 'Lower', data: data.map((d) => d.confidenceLow), borderColor: 'rgba(74,222,128,0.3)', borderDash: [4, 4], pointRadius: 0 },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#94a3b8' } } },
        scales: { x: { ticks: { color: '#94a3b8', maxTicksLimit: 8 } }, y: { min: 0, max: 5, title: { display: true, text: 'Risk Score (/5)', color: '#94a3b8' }, ticks: { color: '#94a3b8' } } } },
    })
  },
}

window.RidgeCharts = RidgeCharts
