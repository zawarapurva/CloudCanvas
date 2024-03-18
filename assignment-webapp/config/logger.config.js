const { createLogger, format, transports } = require('winston')
const isProductionEnv = process.env.ENVIRONMENT === 'DEMO'

const { combine, timestamp, printf, splat } = format
const appRoot = require('app-root-path')

const myFormat = printf(({ level, message, timestamp, ...meta }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`
})

const logger = createLogger({
  level: isProductionEnv ? 'info' : 'debug',
  format: combine(timestamp(), splat(), myFormat),
  transports: [
    new transports.File({ filename: `${appRoot}/logs/webapp.log` }),
    new transports.Console(),
  ],
})

module.exports = logger