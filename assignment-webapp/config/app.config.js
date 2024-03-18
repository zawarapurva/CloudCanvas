require('dotenv').config()

const {
  HOSTNAME,
  DBUSER,
  DBPASSWORD,
  PORT,
  DATABASE,
  DBPORT,
  SNSTOPICARN
} = process.env

module.exports = {
  HOST: HOSTNAME,
  USER: DBUSER,
  PASSWORD: DBPASSWORD,
  PORT: PORT,
  DB: DATABASE,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  SNSTOPICARN: SNSTOPICARN,
  DIALECT: 'postgres',
  DBPORT: DBPORT,
  METRICS_HOSTNAME: 'localhost',
  METRICS_PORT: 8125,
  METRICS_PREFIX: 'csye6225_'
}
