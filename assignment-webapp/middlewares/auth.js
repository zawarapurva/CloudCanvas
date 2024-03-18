const { getUserPasswordAuth, comparePassword } = require('../utils/auth.util')
const sequelize = require("../config/db.config");
const db = require('../models/index')
const logger = require('../config/logger.config')
const statsd = require('node-statsd')
const appConfig = require('../config/app.config')
const User = db.users

const client = new statsd({
  host: appConfig.METRICS_HOSTNAME,
  port: appConfig.METRICS_PORT,
  prefix: appConfig.METRICS_PREFIX
})

module.exports = () => {
  const authorizeToken = async (req, res, next) => {

    switch (req.method) {
      case 'POST':
        client.increment('endpoint.create.assignment');
        break;
      case 'GET':
        // Check if it's a single assignment or all assignments
        if (req.params.id) {
          // GET by id
          client.increment('endpoint.get.assignment');
        } else {
          // GetAll assignments
          client.increment('endpoint.getAll.assignment');
        }
        break;
      case 'PUT':
        client.increment('endpoint.update.assignment');
        break;
      case 'DELETE':
        client.increment('endpoint.delete.assignment');
    }

    try {
      await sequelize.authenticate();
      logger.info('Database successfully authenticated')
    } catch (error) {
      logger.fatal('Error authenticating database')
      return res.status(503).send();
    }

    if(req.url.includes('?')) {
      logger.error('Query parameters not allowed')
      return res.status(400).json({ error: 'Invalid url' });
    }

    const authHeader = req.headers.authorization
    if (!authHeader) {
      logger.error('Missing authorization header')
      return res.status(401).json({
        message: 'Missing authorization header',
      })
    }

    const { username, password } = getUserPasswordAuth(authHeader)
   
    const user = await User.findOne({
      where: {
        email:username,
      },
    })

    if (!user) {
      logger.error('User does not exists')
      return res.status(401).json({
        message: 'Unauthorized: User does not exists',
      })
    }
    const isPasswordMatch = await comparePassword(password, user.password)
    if (!isPasswordMatch) {
      logger.error('User password incorrect')
      return res.status(401).json({
        message: 'Unauthorized: Incorrect password',
      })
    }
    req.user = user

    global.username = user.email
    next()
  }
  logger.info('User successfully authenticated')
  return authorizeToken
}
