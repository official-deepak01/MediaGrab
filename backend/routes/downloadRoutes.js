const express = require('express');
const router = express.Router();
const DownloadController = require('../controllers/downloadController');
const { validateDownloadRequest } = require('../middleware/requestValidator');

router.post('/download', validateDownloadRequest, DownloadController.requestDownload);
router.get('/download/stream/:token', DownloadController.streamVideoFile);

module.exports = router;
