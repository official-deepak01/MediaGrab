const AppError = require('../utils/appError');
const UrlParser = require('../utils/urlParser');

const VALID_QUALITIES = ['4k', '2160p', '1080p', '720p', '480p', '360p', 'mp3', 'audio'];

class ValidationService {
    static validateUrl(url) {
        if (!url || typeof url !== 'string' || !url.trim()) {
            throw new AppError('Video URL is required.', 400);
        }

        const cleaned = url.trim();

        if (!UrlParser.isValidUrl(cleaned)) {
            throw new AppError('Invalid URL format. Provide a valid http or https link.', 400);
        }

        if (!UrlParser.isSupportedPlatform(cleaned)) {
            throw new AppError(
                'Unsupported platform. Supported: YouTube, TikTok, Instagram, Twitter/X, Vimeo, Facebook, Twitch, SoundCloud.',
                400
            );
        }

        return cleaned;
    }

    static validateQuality(quality) {
        if (!quality || typeof quality !== 'string') return '1080p';

        const normalised = quality.toLowerCase();
        if (!VALID_QUALITIES.includes(normalised)) {
            throw new AppError(`Invalid quality '${quality}'. Allowed: 4K, 1080p, 720p, 480p, MP3.`, 400);
        }

        return normalised;
    }
}

module.exports = ValidationService;
