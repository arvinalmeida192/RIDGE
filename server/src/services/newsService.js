import { pool } from '../config/database.js'

export async function getNewsItems({ state, limit = 20 } = {}) {
  const params = []
  let where = ''
  if (state) {
    params.push(state)
    where = `WHERE state = $${params.length}`
  }
  params.push(limit)

  const { rows } = await pool.query(
    `SELECT external_id AS id, title, summary, source, tag, state,
            zone_name AS zone, published_at AS timestamp, url
     FROM news_items ${where}
     ORDER BY published_at DESC
     LIMIT $${params.length}`,
    params,
  )
  return rows
}

export default { getNewsItems }
