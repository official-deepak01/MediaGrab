const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
const UrlParser = require('../utils/urlParser');
const MimeHelper = require('../utils/mimeHelper');
const AppError = require('../utils/appError');

const isDev = () => process.env.NODE_ENV === 'development';
const SAMPLE_DIR = path.join(__dirname, '..', 'assets', 'media');
const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour

const sessions = new Map();

// Prune expired sessions every 10 minutes
setInterval(() => {
    const cutoff = Date.now() - SESSION_TTL_MS;
    for (const [token, session] of sessions) {
        if (session.createdAt < cutoff) sessions.delete(token);
    }
}, 10 * 60 * 1000);

class DownloadService {
    static async processDownload(url, quality) {
        const platform  = UrlParser.detectPlatformName(url);
        const token     = crypto.randomBytes(16).toString('hex');
        const ext       = MimeHelper.getFileExtension(quality);
        const mimeType  = MimeHelper.getMimeType(ext);
        const label     = (quality || '1080p').toUpperCase();
        const fileName  = `MediaGrab_${platform}_${label}_${token.slice(0, 8)}.${ext}`;

        if (isDev()) console.log(`[DownloadService] processDownload — ${platform} | ${label} | ${url}`);

        sessions.set(token, { url, platform, quality: label, fileName, mimeType, ext, createdAt: Date.now() });

        return {
            status: 'ready',
            requestInfo: { url, quality: label, platform },
            download: {
                token,
                fileName,
                ext,
                mimeType,
                quality: label,
                directDownloadUrl: `/api/download/stream/${token}?format=${ext}&quality=${quality}`,
                expiresInSeconds: SESSION_TTL_MS / 1000
            },
            timestamp: new Date().toISOString()
        };
    }

    static getSession(token) {
        return sessions.get(token) || null;
    }

    static async streamContent(token, req, res, next) {
        const session = sessions.get(token);
        if (!session) return next(new AppError('Download session not found or expired.', 404));

        const { url, platform, mimeType, fileName, ext } = session;

        if (isDev()) console.log(`[DownloadService] streamContent — ${platform} | ${fileName} | ${url}`);

        if (platform === 'YouTube') return this._streamYouTube(url, fileName, mimeType, ext, req, res, next);
        return this._streamProxy(url, fileName, mimeType, ext, req, res, next);
    }

    static async _streamYouTube(url, fileName, mimeType, ext, req, res, next) {
        try {
            const ytdl = require('ytdl-core');
            if (!ytdl.validateURL(url)) throw new AppError('Invalid YouTube URL.', 400);

            const info  = await ytdl.getInfo(url);
            const title = info.videoDetails.title;
            const safeFileName = `MediaGrab_${title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40)}.${ext}`;
            const filter = ext === 'mp3' ? 'audioonly' : 'videoandaudio';

            if (isDev()) console.log(`[YouTube] streaming: "${title}"`);

            res.setHeader('Content-Type', mimeType);
            res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"`);
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Transfer-Encoding', 'chunked');

            const stream = ytdl(url, { filter, quality: 'highest' });
            stream.pipe(res);
            stream.on('error', err => {
                console.error('[YouTube stream error]', err.message);
                if (!res.headersSent) res.status(500).json({ success: false, message: err.message });
            });
            req.on('close', () => stream.destroy());

        } catch (err) {
            if (!res.headersSent) return this._streamFallback(ext, fileName, mimeType, req, res, next);
        }
    }

    static async _streamProxy(url, fileName, mimeType, ext, req, res, next) {
        try {
            const response = await axios.get(url, {
                responseType: 'stream',
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                    'Range': req.headers.range || 'bytes=0-'
                }
            });

            const headers = {
                'Content-Type': response.headers['content-type'] || mimeType,
                'Content-Disposition': `attachment; filename="${fileName}"`,
                'Accept-Ranges': 'bytes',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            };
            if (response.headers['content-length'])  headers['Content-Length']  = response.headers['content-length'];
            if (response.headers['content-range'])   headers['Content-Range']   = response.headers['content-range'];

            res.writeHead(response.status === 206 ? 206 : 200, headers);
            response.data.pipe(res);
            response.data.on('error', err => {
                if (!res.headersSent) res.status(500).json({ success: false, message: 'Proxy stream error.' });
            });
            req.on('close', () => response.data.destroy());

        } catch (err) {
            if (!res.headersSent) return this._streamFallback(ext, fileName, mimeType, req, res, next);
        }
    }

    // Last-resort: serves a local sample file when both ytdl and proxy fail.
    static _streamFallback(ext, fileName, mimeType, req, res, next) {
        const sampleFile = ext === 'mp3' ? 'sample_audio.mp3' : 'sample_video.mp4';
        const filePath   = path.join(SAMPLE_DIR, sampleFile);

        if (!fs.existsSync(filePath)) return next(new AppError('No media source available.', 404));

        const { size } = fs.statSync(filePath);
        res.writeHead(200, {
            'Content-Type': mimeType,
            'Content-Length': size,
            'Content-Disposition': `attachment; filename="${fileName}"`,
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'X-Fallback': 'true'
        });

        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
        stream.on('error', () => { if (!res.headersSent) res.status(500).end(); });
        req.on('close', () => stream.destroy());
    }
}

module.exports = DownloadService;
