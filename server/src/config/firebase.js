import admin from 'firebase-admin'
import env from './env.js'
import logger from './logger.js'

let initialized = false

export function initFirebase() {
  if (initialized) return admin.apps.length > 0
  if (!env.firebaseEnabled) {
    logger.info('Firebase Auth disabled — using legacy login (set FIREBASE_PROJECT_ID to enable)')
    return false
  }

  if (env.firebaseAuthEmulatorHost) {
    process.env.FIREBASE_AUTH_EMULATOR_HOST = env.firebaseAuthEmulatorHost
  }

  const options = { projectId: env.firebaseProjectId }

  if (env.firebaseServiceAccount) {
    options.credential = admin.credential.cert(env.firebaseServiceAccount)
  } else {
    options.credential = admin.credential.applicationDefault()
  }

  try {
    admin.initializeApp(options)
    initialized = true
    logger.info('Firebase Admin initialized', { projectId: env.firebaseProjectId })
    return true
  } catch (err) {
    logger.error('Firebase Admin init failed', { error: err.message })
    return false
  }
}

export function isFirebaseReady() {
  return initialized && admin.apps.length > 0
}

export async function verifyFirebaseToken(idToken) {
  if (!isFirebaseReady()) {
    throw new Error('Firebase is not configured')
  }
  return admin.auth().verifyIdToken(idToken)
}

export async function setFirebaseCustomClaims(uid, claims) {
  if (!isFirebaseReady()) return
  await admin.auth().setCustomUserClaims(uid, claims)
}

export function getFirebaseWebConfig() {
  if (!env.firebaseProjectId) return null
  return {
    apiKey: env.firebaseApiKey,
    authDomain: env.firebaseAuthDomain || `${env.firebaseProjectId}.firebaseapp.com`,
    projectId: env.firebaseProjectId,
  }
}

export default { initFirebase, isFirebaseReady, verifyFirebaseToken, setFirebaseCustomClaims, getFirebaseWebConfig }
