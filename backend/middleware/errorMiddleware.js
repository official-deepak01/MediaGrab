const ApiResponse = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        statusCode = 400;
        message = 'Invalid JSON request body.';
    }

    if (process.env.NODE_ENV === 'development' || !err.isOperational) {
        console.error('[Error]', { method: req.method, path: req.originalUrl, statusCode, message });
    }

    return ApiResponse.error(res, statusCode, message, {
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

const notFoundHandler = (req, res) =>
    ApiResponse.error(res, 404, `Route '${req.originalUrl}' not found.`);

module.exports = { errorHandler, notFoundHandler };
