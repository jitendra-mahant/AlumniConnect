const jwt = require('jsonwebtoken');
const env = require('../config/env');

module.exports = (userId) => jwt.sign({ id: userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
