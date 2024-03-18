const {Sequelize} = require('sequelize');
const appConfig = require('../config/app.config')

const sequelizeParameters = {
  host: appConfig.HOST,
  username: appConfig.USER,
  database: appConfig.DB,
  dialect: appConfig.DIALECT,
  port: appConfig.DBPORT,
  password: appConfig.PASSWORD
}

if (appConfig.HOST && appConfig.HOST.includes('.rds.amazonaws.com')) {
  sequelizeParameters.dialectOptions = appConfig.dialectOptions
}

const sequelize = new Sequelize(sequelizeParameters)

module.exports = sequelize;
