import winston from 'winston'
import env from './env.js'

const logger = winston.createLogger({
  level: env.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: 'ridge-server' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          const extra = Object.keys(meta).length > 1
            ? ` ${JSON.stringify(meta)}`
            : ''
          return `${timestamp} [${level}] ${message}${extra}`
        }),
      ),
    }),
  ],
})

export default logger
