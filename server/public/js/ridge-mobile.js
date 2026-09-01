// Mobile navigation — hamburger drawer for sidebar layouts
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('.mobile-menu-btn')
  const overlay = document.querySelector('.sidebar-overlay')
  const publicHeader = document.querySelector('.public-header')
  const publicBtn = document.querySelector('.public-menu-btn')

  function setNavOpen(open) {
    document.body.classList.toggle('nav-open', open)
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false')
    if (overlay) overlay.hidden = !open
    document.body.style.overflow = open ? 'hidden' : ''
  }

  btn?.addEventListener('click', () => setNavOpen(!document.body.classList.contains('nav-open')))
  overlay?.addEventListener('click', () => setNavOpen(false))

  document.querySelectorAll('.sidebar nav a').forEach((link) => {
    link.addEventListener('click', () => setNavOpen(false))
  })

  publicBtn?.addEventListener('click', () => {
    publicHeader?.classList.toggle('nav-open')
    publicBtn.setAttribute(
      'aria-expanded',
      publicHeader?.classList.contains('nav-open') ? 'true' : 'false'
    )
  })

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      setNavOpen(false)
      publicHeader?.classList.remove('nav-open')
    }
  })
})
