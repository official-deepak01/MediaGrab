const ApiResponse = require('../utils/apiResponse');
const ValidationService = require('../services/validationService');

const validateVideoInfoRequest = (req, res, next) => {
    try {
        req.validatedUrl = ValidationService.validateUrl(req.body.url);
        next();
    } catch (err) {
        ApiResponse.error(res, err.statusCode || 400, err.message);
    }
};

const validateDownloadRequest = (req, res, next) => {
    try {
        req.validatedUrl = ValidationService.validateUrl(req.body.url);
        req.validatedQuality = ValidationService.validateQuality(req.body.quality);
        next();
    } catch (err) {
        ApiResponse.error(res, err.statusCode || 400, err.message);
    }
};

module.exports = { validateVideoInfoRequest, validateDownloadRequest };
