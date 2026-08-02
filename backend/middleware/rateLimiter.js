const rateLimit = require('express-rate-limit');
const config = require('../config/config');
const ApiResponse = require('../utils/apiResponse');

const apiRateLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        return ApiResponse.error(
            res, 
            429, 
            'Too many requests from this IP address. Please try again after 15 minutes.'
        );
    }
});

module.exports = apiRateLimiter;
