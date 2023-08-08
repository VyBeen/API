import type express from 'express';
import * as sanitizer from '../tools/sanitizer';
import { Log, ErrLog, ResLog } from '../tools/log';
import fs from 'fs';
import { getOrCreateStream } from '../data/stream';
// import * as url from 'url';

export async function makeStream (req: express.Request, res: express.Response) {
    const id = sanitizer.sanitizeStringField(req.query.id, req, res);
    if (id === null) return;

    try {
        await getOrCreateStream(id);
        new ResLog(res.locals.lang.info.stream.created, '/stream?id=' + id, Log.CODE.OK).sendTo(res);
        return;
    } catch (err) {
        console.error(err);
        new ErrLog(res.locals.lang.error.generic.internalError, ErrLog.CODE.INTERNAL_SERVER_ERROR).sendTo(res);
    }
}

export async function getStream (req: express.Request, res: express.Response) {
    const id = sanitizer.sanitizeStringField(req.query.id, req, res);
    if (id === null) return;

    try {
        const infos = await getOrCreateStream(id);
        const stream = fs.createReadStream(infos.filepath);
        res.header('Content-Type', 'audio/mpeg');
        res.header('Content-Length', infos.size.toString());
        res.header('Content-Range', `bytes 0-${infos.size - 1}/${infos.size}`);
        res.header('Accept-Ranges', 'bytes');
        stream.pipe(res);
    } catch {
        new ErrLog(res.locals.lang.error.stream.notFound, ErrLog.CODE.NOT_FOUND).sendTo(res);
    }
}
