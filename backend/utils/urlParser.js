const config = require('../config/config');

class UrlParser {
    static isValidUrl(urlString) {
        try {
            const { protocol } = new URL(urlString);
            return protocol === 'http:' || protocol === 'https:';
        } catch {
            return false;
        }
    }

    static getDomain(urlString) {
        try {
            return new URL(urlString).hostname.toLowerCase().replace(/^www\./, '');
        } catch {
            return null;
        }
    }

    static isSupportedPlatform(urlString) {
        const domain = this.getDomain(urlString);
        return domain ? config.supportedPlatforms.some(p => domain.endsWith(p)) : false;
    }

    static detectPlatformName(urlString) {
        const domain = this.getDomain(urlString) || '';
        if (domain.includes('youtube') || domain.includes('youtu.be')) return 'YouTube';
        if (domain.includes('tiktok'))     return 'TikTok';
        if (domain.includes('instagram'))  return 'Instagram';
        if (domain.includes('twitter') || domain.includes('x.com')) return 'Twitter / X';
        if (domain.includes('vimeo'))      return 'Vimeo';
        if (domain.includes('facebook') || domain.includes('fb.watch')) return 'Facebook';
        if (domain.includes('twitch'))     return 'Twitch';
        if (domain.includes('soundcloud')) return 'SoundCloud';
        if (domain.includes('pinterest'))  return 'Pinterest';
        return 'Web Media Stream';
    }
}

module.exports = UrlParser;
