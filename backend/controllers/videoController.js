const VideoService = require('../services/videoService');
const ApiResponse = require('../utils/apiResponse');

class VideoController {
    static async getVideoInfo(req, res, next) {
        try {
            const videoInfo = await VideoService.extractVideoInfo(req.validatedUrl);
            return ApiResponse.success(res, 200, 'Video metadata extracted successfully.', videoInfo);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = VideoController;
