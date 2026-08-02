const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/config');
const apiRoutes = require('./routes');
const rateLimiter = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
    origin: config.corsOrigin,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', rateLimiter);
app.use('/api', apiRoutes);

const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));
app.get('/', (req, res) => res.sendFile(path.join(publicPath, 'index.html')));

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = config.port;
app.listen(PORT, () => {
    console.log(`[MediaGrab] ${config.nodeEnv.toUpperCase()} server running on http://localhost:${PORT}`);
});

module.exports = app;
