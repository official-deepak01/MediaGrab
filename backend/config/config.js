require('dotenv').config();

module.exports = {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || '*',
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
        max: parseInt(process.env.MAX_REQUEST_LIMIT, 10) || 100
    },
    supportedPlatforms: [
        'youtube.com', 'youtu.be',
        'tiktok.com',
        'instagram.com',
        'twitter.com', 'x.com',
        'vimeo.com',
        'facebook.com', 'fb.watch',
        'twitch.tv',
        'soundcloud.com',
        'pinterest.com'
    ]
};
