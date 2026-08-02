class ApiResponse {
    static success(res, statusCode = 200, message = 'Success', data = null) {
        return res.status(statusCode).json({
            success: true,
            status: statusCode,
            message,
            data
        });
    }

    static error(res, statusCode = 500, message = 'Internal Server Error', errors = null) {
        return res.status(statusCode).json({
            success: false,
            status: statusCode,
            message,
            errors
        });
    }
}

module.exports = ApiResponse;
