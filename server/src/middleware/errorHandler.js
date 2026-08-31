import logger from '../config/logger.js'

export function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Not found',
    path: req.originalUrl,
  })
}

export function errorHandler(err, req, res, _next) {
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
  })

  const status = err.status || err.statusCode || 500
  res.status(status).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}
