const DownloadService = require('../services/downloadService');
const ApiResponse = require('../utils/apiResponse');
const AppError = require('../utils/appError');

class DownloadController {
    static async requestDownload(req, res, next) {
        try {
            if (process.env.NODE_ENV === 'development') {
                console.log('[Download] POST /api/download —', req.validatedUrl, req.validatedQuality);
            }
            const result = await DownloadService.processDownload(req.validatedUrl, req.validatedQuality);
            return ApiResponse.success(res, 200, 'Download stream link generated successfully.', result);
        } catch (err) {
            next(err);
        }
    }

    static async streamVideoFile(req, res, next) {
        try {
            const { token } = req.params;
            if (!token || token.length < 16) {
                return next(new AppError('Invalid stream token.', 400));
            }
            if (process.env.NODE_ENV === 'development') {
                console.log(`[Download] GET /api/download/stream/${token}`);
            }
            await DownloadService.streamContent(token, req, res, next);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = DownloadController;
