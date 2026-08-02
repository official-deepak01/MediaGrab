const express = require('express');
const router = express.Router();
const videoRoutes = require('./videoRoutes');
const downloadRoutes = require('./downloadRoutes');

router.get('/health', (req, res) => res.status(200).json({ status: 'running' }));
router.use('/', videoRoutes);
router.use('/', downloadRoutes);

module.exports = router;
