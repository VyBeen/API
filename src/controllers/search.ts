import type express from 'express';
import * as sanitizer from '../tools/sanitizer';
import { Log, ErrLog, ResLog } from '../tools/log';
import yts from 'yt-search';

export async function searchSong (req: express.Request, res: express.Response) {
    const query = sanitizer.sanitizeStringField(req.query.q, req, res);
    if (query === null) return;

    try {
        const search = await yts(query);
        const videos = search.videos.slice(0, 10).map(video => ({
            id: video.videoId,
            title: video.title,
            artist: video.author.name,
            url: '',
            cover: video.thumbnail
        }));
        new ResLog(res.locals.lang.info.songs.fetched, videos, Log.CODE.OK).sendTo(res);
    } catch (err) {
        console.error(err);
        new ErrLog(res.locals.lang.error.generic.internalError, ErrLog.CODE.INTERNAL_SERVER_ERROR).sendTo(res);
    }
}
