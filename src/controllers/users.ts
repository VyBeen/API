import type express from 'express';
import * as sanitizer from '../tools/sanitizer';
import * as Users from '../data/users';
import { Log, ErrLog, ResLog } from '../tools/log';
import { prisma } from '../app';

export async function getUser (req: express.Request, res: express.Response) {
    const id = sanitizer.sanitizeIdField(req.params.userId, req, res);
    if (id === null) return;

    const user = await Users.getUserFromId(id);
    if (user === null) {
        new ErrLog(res.locals.lang.error.users.notFound, ErrLog.CODE.NOT_FOUND).sendTo(res);
        return;
    }

    new ResLog(res.locals.lang.info.user.fetched, Users.makePublicUser(user), Log.CODE.OK).sendTo(res);
}

export function deleteUser (req: express.Request, res: express.Response) {
    const id = sanitizer.sanitizeIdField(req.params.userId, req, res);
    if (id === null) return;

    prisma.user.delete({ where: { id } }).then(() => {
        new ResLog(res.locals.lang.info.user.deleted, Log.CODE.OK).sendTo(res);
    }).catch(() => {
        new ErrLog(res.locals.lang.error.generic.internalError, Log.CODE.INTERNAL_SERVER_ERROR).sendTo(res);
    });
}
