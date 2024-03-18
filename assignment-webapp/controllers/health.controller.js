const sequelize = require("../config/db.config");
const { setCustomHeaders } = require('../utils/setHeaders');
const logger = require('../config/logger.config')
const statsd = require('node-statsd')
const appConfig = require('../config/app.config')

exports.checkHealth = async (req, res) => {
    const client = new statsd({
        host: appConfig.METRICS_HOSTNAME,
        port: appConfig.METRICS_PORT,
        prefix: appConfig.METRICS_PREFIX
    })
    client.increment('endpoint.health')
    var length = req.headers['content-length'];
    try {
        if ((req.method == 'GET' && length > 0) || req.url.includes('?')) {
            res.status(400).send();
            logger.error('Query parameters not allowed')
        } else {
            await sequelize.authenticate();
            setCustomHeaders(res);
            res.status(200).send();
            logger.info('Database successfully authenticated')
        }
    } catch (error) {
        console.log(error);
        res.status(503).send();
        logger.fatal('Error authenticating database')
    } finally {
        client.close();
    }
};
