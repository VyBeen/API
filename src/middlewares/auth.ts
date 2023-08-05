import jwt from 'jsonwebtoken';
import type express from 'express';
import { ErrLog, Log } from '../tools/log';

const SECRET_KEY = process.env.SECRET_KEY as string;

module.exports = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const bypass = false;
    if (bypass) {
        res.locals.token = { id: 1 };
        next();
        return;
    }

    const authToken = req.headers.authorization;
    if (authToken === undefined) {
        new ErrLog(res.locals.lang.error.token.missing, Log.CODE.UNAUTHORIZED).sendTo(res);
        return;
    }

    if (!authToken.toLocaleLowerCase().startsWith('bearer ')) {
        new ErrLog(res.locals.lang.error.token.invalid, Log.CODE.FORBIDDEN).sendTo(res);
        return;
    }

    const tokenString = authToken.split(' ')[1];
    try {
        const decoded = jwt.verify(tokenString, SECRET_KEY);
        if (decoded === undefined) {
            new ErrLog(res.locals.lang.error.token.invalid, Log.CODE.FORBIDDEN).sendTo(res);
            return;
        }

        res.locals.token = decoded;
        next();
    } catch {
        new ErrLog(res.locals.lang.error.token.invalid, Log.CODE.FORBIDDEN).sendTo(res);
    }
};
