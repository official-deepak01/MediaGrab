class MimeHelper {
    static getMimeType(format) {
        const ext = (format || '').toLowerCase().replace('.', '');
        const map = {
            mp4: 'video/mp4',
            mp3: 'audio/mpeg',
            webm: 'video/webm',
            ogg: 'audio/ogg',
            wav: 'audio/wav',
            m4a: 'audio/mp4',
            srt: 'text/plain'
        };
        return map[ext] || 'video/mp4';
    }

    static getFileExtension(quality) {
        const q = (quality || '').toLowerCase();
        return (q === 'mp3' || q === 'audio') ? 'mp3' : 'mp4';
    }
}

module.exports = MimeHelper;
