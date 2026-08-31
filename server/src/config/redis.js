import { createClient } from 'redis'
import env from './env.js'
import logger from './logger.js'

let client = null

export async function getRedisClient() {
  if (client?.isOpen) return client

  client = createClient({ url: env.redisUrl })
  client.on('error', (err) => logger.error('Redis error', { error: err.message }))
  await client.connect()
  return client
}

export async function checkRedisHealth() {
  try {
    const redis = await getRedisClient()
    const pong = await redis.ping()
    return { ok: pong === 'PONG' }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

export default { getRedisClient, checkRedisHealth }
