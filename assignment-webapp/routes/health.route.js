const express = require('express')

const router = express.Router()
const health = require('../controllers/health.controller')

router.get('/', health.checkHealth);

module.exports = router;
