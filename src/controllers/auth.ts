import type express from 'express';
import { ErrLog, Log, ResLog } from '../tools/log';
import fetch from 'node-fetch';
import { createUser, makePrivateUser, registerUser } from '../data/users';
import * as sanitizer from '../tools/sanitizer';

const API_URL = 'https://main.apis.furwaz.fr';

export async function askToken (req: express.Request, res: express.Response) {
    let response: any;
    let json: any;
    const APP_KEY = process.env.APP_KEY as string;

    try {
        response = await fetch(API_URL + '/portal/generate', {
            method: 'GET',
            headers: { Authorization: `Bearer ${APP_KEY}` }
        });
        json = await response.json();
    } catch (err) {
        console.error('Error retreiving token : ', err);
        new ErrLog(res.locals.lang.error.token.notRetreived, ErrLog.CODE.INTERNAL_SERVER_ERROR).sendTo(res);
        return;
    }

    const token = json?.data?.token;
    if (token === undefined || json === null) {
        console.error('Token not retreived : json = ', json);
        new ErrLog(res.locals.lang.error.token.notRetreived, ErrLog.CODE.INTERNAL_SERVER_ERROR).sendTo(res);
        return;
    }
    createUser(token);
    new ResLog(res.locals.lang.info.token.retreived, token, Log.CODE.OK).sendTo(res);
}

export async function retreiveUser (req: express.Request, res: express.Response) {
    const token = sanitizer.sanitizeStringField(req.query.token, req, res);
    if (token === null) return;

    let response: any;
    let json: any;
    const APP_KEY = process.env.APP_KEY as string;

    try {
        response = await fetch(API_URL + `/portal/${token}/user`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${APP_KEY}` }
        });
        json = await response.json();
    } catch (err) {
        console.error('Error retreiving user : ', err);
        new ErrLog(res.locals.lang.error.generic.internalError, ErrLog.CODE.INTERNAL_SERVER_ERROR).sendTo(res);
        return;
    }

    const userData = json?.data;
    if (userData === undefined || userData === null) {
        console.error('User not retreived : json = ', json);
        new ErrLog(res.locals.lang.error.generic.internalError, ErrLog.CODE.INTERNAL_SERVER_ERROR).sendTo(res);
        return;
    }

    try {
        const user = await registerUser(token, userData);
        new ResLog(res.locals.lang.info.user.logged, makePrivateUser(user), Log.CODE.OK).sendTo(res);
    } catch (err) {
        console.error(err);
        new ErrLog(res.locals.lang.error.generic.internalError, ErrLog.CODE.INTERNAL_SERVER_ERROR).sendTo(res);
    }
}
