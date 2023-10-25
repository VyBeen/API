import type express from 'express';
import { ErrLog } from '../tools/log';
import fetch from 'node-fetch';

export async function makeRequest (req: express.Request, res: express.Response) {
    const url = req.query.url as string;
    const urlDecoded = Buffer.from(url, 'base64').toString('ascii');

    try {
        const response = await fetch(urlDecoded);
        const text = await response.text();
        try {
            const json = JSON.parse(text);
            res.json(json);
        } catch {
            res.send(text);
        }
    } catch (err) {
        console.error('Error making request : ', err);
        new ErrLog(res.locals.lang.error.generic.internalError, ErrLog.CODE.INTERNAL_SERVER_ERROR).sendTo(res);
    }
}
