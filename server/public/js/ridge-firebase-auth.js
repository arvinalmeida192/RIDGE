/* global firebase */
;(function () {
  const cfg = window.RIDGE_FIREBASE_CONFIG
  const loginType = window.RIDGE_LOGIN_TYPE || 'citizen'
  const nextUrl = window.RIDGE_NEXT_URL || (loginType === 'citizen' ? '/citizen' : '/dashboard')

  if (!cfg?.apiKey) return

  firebase.initializeApp(cfg)
  const auth = firebase.auth()

  if (window.RIDGE_FIREBASE_EMULATOR) {
    auth.useEmulator(`http://${window.RIDGE_FIREBASE_EMULATOR}`)
  }

  const msgEl = document.getElementById('auth-message')
  const submitBtn = document.getElementById('firebase-submit')
  const signupBtn = document.getElementById('firebase-signup')
  const googleBtn = document.getElementById('firebase-google')
  const emailInput = document.getElementById('firebase-email')
  const passwordInput = document.getElementById('firebase-password')
  const googleProvider = new firebase.auth.GoogleAuthProvider()

  function showMessage(text, isError) {
    if (!msgEl) return
    msgEl.textContent = text
    msgEl.className = isError ? 'form-message form-message-error' : 'form-message form-message-success'
    msgEl.style.display = 'block'
  }

  function setLoading(loading) {
    if (submitBtn) {
      submitBtn.disabled = loading
      submitBtn.textContent = loading ? 'Signing in…' : 'Sign In'
    }
    if (signupBtn) signupBtn.disabled = loading
    if (googleBtn) {
      googleBtn.disabled = loading
      googleBtn.textContent = loading ? 'Signing in…' : 'Continue with Google'
    }
  }

  async function completeSession(credential) {
    const idToken = await credential.user.getIdToken()
    const res = await fetch('/api/v1/auth/firebase-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ idToken, loginType }),
    })
    const text = await res.text()
    let data
    try {
      data = JSON.parse(text)
    } catch {
      throw new Error('Server error during login. Please try again.')
    }
    if (!res.ok) throw new Error(data.error || 'Authentication failed')
    window.location.assign(nextUrl || data.redirect || '/')
  }

  async function handleSignIn(e) {
    e.preventDefault()
    const email = emailInput?.value?.trim()
    const password = passwordInput?.value
    if (!email || !password) {
      showMessage('Email and password are required.', true)
      return
    }
    setLoading(true)
    try {
      const credential = await auth.signInWithEmailAndPassword(email, password)
      await completeSession(credential)
    } catch (err) {
      showMessage(err.message || 'Sign in failed.', true)
      setLoading(false)
    }
  }

  async function handleSignUp(e) {
    e.preventDefault()
    const email = emailInput?.value?.trim()
    const password = passwordInput?.value
    if (!email || !password) {
      showMessage('Email and password are required.', true)
      return
    }
    if (password.length < 6) {
      showMessage('Password must be at least 6 characters.', true)
      return
    }
    setLoading(true)
    try {
      const credential = await auth.createUserWithEmailAndPassword(email, password)
      await completeSession(credential)
    } catch (err) {
      showMessage(err.message || 'Sign up failed.', true)
      setLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true)
    try {
      const credential = await auth.signInWithPopup(googleProvider)
      await completeSession(credential)
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        showMessage(err.message || 'Google sign in failed.', true)
      }
      setLoading(false)
    }
  }

  document.getElementById('firebase-form')?.addEventListener('submit', handleSignIn)
  signupBtn?.addEventListener('click', handleSignUp)
  googleBtn?.addEventListener('click', handleGoogleSignIn)
})()
