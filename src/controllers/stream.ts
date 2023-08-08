import type express from 'express';
import * as sanitizer from '../tools/sanitizer';
import { Log, ErrLog, ResLog } from '../tools/log';
import ytdl from 'ytdl-core';
import fs from 'fs';
// import * as url from 'url';

// const __filename = url.fileURLToPath(import.meta.url);
// const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

export async function makeStream (req: express.Request, res: express.Response) {
    const id = sanitizer.sanitizeStringField(req.query.id, req, res);
    if (id === null) return;

    const filepath = `./tmp/${id}.mp3`;
    if (fs.existsSync(filepath)) {
        new ResLog(res.locals.lang.info.stream.created, '/stream?id=' + id, Log.CODE.OK).sendTo(res);
        return;
    }

    try {
        const infos = await ytdl.getInfo(id);
        const formats = ytdl.filterFormats(infos.formats, 'audioonly');
        const format = ytdl.chooseFormat(formats, { quality: 'lowestaudio' });

        const file = fs.createWriteStream(filepath);
        const stream = ytdl.downloadFromInfo(infos, { format });
        stream.pipe(file);
        stream.on('end', () => {
            new ResLog(res.locals.lang.info.stream.created, '/stream?id=' + id, Log.CODE.OK).sendTo(res);
        });
    } catch (err) {
        console.error(err);
        new ErrLog(res.locals.lang.error.generic.internalError, ErrLog.CODE.INTERNAL_SERVER_ERROR).sendTo(res);
    }
}

export async function getStream (req: express.Request, res: express.Response) {
    const id = sanitizer.sanitizeStringField(req.query.id, req, res);
    if (id === null) return;

    fs.stat(`./tmp/${id}.mp3`, (err, stats) => {
        if (err !== null) {
            makeStream(req, res)
                .then(() => {})
                .catch(() => {});
            return;
        }
        if (!stats.isFile()) {
            new ErrLog(res.locals.lang.error.stream.notFound, ErrLog.CODE.NOT_FOUND).sendTo(res);
            return;
        }

        try {
            const filepath = `./tmp/${id}.mp3`;
            const stream = fs.createReadStream(filepath);
            res.header('Content-Type', 'audio/mpeg');
            res.header('Content-Length', stats.size.toString());
            res.header('Content-Range', `bytes 0-${stats.size - 1}/${stats.size}`);
            res.header('Accept-Ranges', 'bytes');
            stream.pipe(res);
        } catch (e) {
            console.error(e);
            new ErrLog(res.locals.lang.error.generic.internalError, ErrLog.CODE.INTERNAL_SERVER_ERROR).sendTo(res);
        }
    });
}
