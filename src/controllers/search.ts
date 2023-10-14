import type express from 'express';
import * as sanitizer from '../tools/sanitizer';
import { Log, ErrLog, ResLog } from '../tools/log';
import yts from 'yt-search';

function getVideoIdFromUrl (url: string): string | null {
    const patterns = [
        'https://www.youtube.com/watch?v=',
        'https://youtu.be/'
    ];
    for (let i = 0; i < patterns.length; i++) {
        const pattern = patterns[i];
        if (url.startsWith(pattern)) {
            return url.substring(pattern.length).split('?')[0];
        }
    }
    return null;
}

export async function searchSong (req: express.Request, res: express.Response) {
    const base64 = sanitizer.sanitizeStringField(req.query.q, req, res);
    if (base64 === null) return;
    const query = Buffer.from(base64, 'base64').toString();

    try {
        if (query.startsWith('http')) {
            const videoId = getVideoIdFromUrl(query);
            if (videoId === null) {
                new ErrLog(res.locals.lang.error.songs.invalidUrl, ErrLog.CODE.INTERNAL_SERVER_ERROR).sendTo(res);
            } else {
                const infos = (await yts({ videoId }));
                const videos = [{
                    id: videoId,
                    title: infos.title,
                    artist: infos.author.name,
                    url: '',
                    cover: infos.thumbnail
                }];
                new ResLog(res.locals.lang.info.songs.fetched, videos, Log.CODE.OK).sendTo(res);
            }
        } else {
            const search = await yts(query);
            const videos = search.videos.slice(0, 10).map(video => ({
                id: video.videoId,
                title: video.title,
                artist: video.author.name,
                url: '',
                cover: video.thumbnail
            }));
            new ResLog(res.locals.lang.info.songs.fetched, videos, Log.CODE.OK).sendTo(res);
        }
    } catch (err) {
        console.error(err);
        new ErrLog(res.locals.lang.error.generic.internalError, ErrLog.CODE.INTERNAL_SERVER_ERROR).sendTo(res);
    }
}
