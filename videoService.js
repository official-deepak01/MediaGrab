const axios = require('axios');
const UrlParser = require('../utils/urlParser');
const AppError = require('../utils/appError');

const isDev = () => process.env.NODE_ENV === 'development';

const QUALITY_OPTIONS = [
    { quality: '4k',    resolution: '4K (2160p)',      format: 'MP4', label: 'Ultra HD • MP4',     estimatedSize: '342.5 MB', isDefault: true  },
    { quality: '1080p', resolution: '1080p Full HD',   format: 'MP4', label: 'Crisp HD • MP4',     estimatedSize: '94.2 MB',  isDefault: false },
    { quality: '720p',  resolution: '720p HD',          format: 'MP4', label: 'Standard • MP4',     estimatedSize: '42.8 MB',  isDefault: false },
    { quality: 'mp3',   resolution: 'Audio (320kbps)', format: 'MP3', label: 'High Quality • MP3', estimatedSize: '8.4 MB',   isDefault: false }
];

const PLATFORM_OEMBED = {
    YouTube: url => `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
    Vimeo:   url => `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`,
    TikTok:  url => `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
    'Twitter / X': url => `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`
};

const PLATFORM_DURATIONS = {
    YouTube: '10:00', TikTok: '00:45', Instagram: '01:15',
    'Twitter / X': '00:58', Vimeo: '05:30', Facebook: '03:00',
    Twitch: '02:10', SoundCloud: '04:25'
};

const AXIOS_OPTIONS = {
    timeout: 6000,
    headers: { 'User-Agent': 'MediaGrab/2.0' }
};

class VideoService {
    static async extractVideoInfo(url) {
        try {
            const platform = UrlParser.detectPlatformName(url);

            if (isDev()) console.log(`[VideoService] extractVideoInfo — platform: ${platform}, url: ${url}`);

            const meta = await this._fetchOEmbed(url, platform)
                      || await this._fetchOpenGraph(url, platform)
                      || this._buildFallbackMeta(url, platform);

            const result = { url, ...meta, platform, availableQualities: QUALITY_OPTIONS, extractedAt: new Date().toISOString() };

            if (isDev()) console.log(`[VideoService] title: "${result.title}" | thumbnail: ${result.thumbnail}`);

            return result;
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(`Metadata extraction failed: ${err.message}`, 500);
        }
    }

    static async _fetchOEmbed(url, platform) {
        const endpointFn = PLATFORM_OEMBED[platform];
        if (!endpointFn) return null;

        try {
            const { data } = await axios.get(endpointFn(url), AXIOS_OPTIONS);
            if (!data) return null;
            return {
                title:     data.title || `${platform} Video`,
                thumbnail: data.thumbnail_url || null,
                author:    data.author_name || `${platform} Channel`,
                duration:  '00:00',
                views:     'N/A'
            };
        } catch {
            return null;
        }
    }

    static async _fetchOpenGraph(url, platform) {
        try {
            const { data: html } = await axios.get(url, {
                ...AXIOS_OPTIONS,
                maxContentLength: 200 * 1024
            });

            const match = (pattern) => (html.match(pattern) || [])[1] || null;

            const title = match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i)
                       || match(/<title[^>]*>([^<]+)<\/title>/i);

            if (!title) return null;

            return {
                title:     title.trim(),
                thumbnail: match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i),
                author:    match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)/i) || `${platform} Creator`,
                duration:  '00:00',
                views:     'N/A'
            };
        } catch {
            return null;
        }
    }

    // Guarantees a unique response per URL by embedding the video ID or path segment.
    static _buildFallbackMeta(url, platform) {
        let uniqueSegment = '';
        try {
            const parsed = new URL(url);
            uniqueSegment = parsed.searchParams.get('v')
                || parsed.pathname.split('/').filter(Boolean).pop()
                || parsed.hostname;
        } catch { /* keep empty */ }

        return {
            title:     `${platform} Video [${uniqueSegment}]`,
            thumbnail: 'assets/images/video_thumbnail_demo.jpg',
            author:    `${platform} Creator`,
            duration:  PLATFORM_DURATIONS[platform] || '03:00',
            views:     'N/A'
        };
    }
}

module.exports = VideoService;
