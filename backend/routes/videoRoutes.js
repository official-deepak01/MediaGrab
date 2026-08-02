const express = require('express');
const router = express.Router();
const VideoController = require('../controllers/videoController');
const { validateVideoInfoRequest } = require('../middleware/requestValidator');

router.post('/video-info', validateVideoInfoRequest, VideoController.getVideoInfo);

module.exports = router;
