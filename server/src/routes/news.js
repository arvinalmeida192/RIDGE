import { Router } from 'express'
import { getNewsItems } from '../services/newsService.js'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const items = await getNewsItems({ state: req.query.state })
    res.json(items)
  } catch (err) {
    next(err)
  }
})

export default router
