import type express from 'express';
import * as sanitizer from '../tools/sanitizer';
import * as Rooms from '../data/rooms';
import { Log, ErrLog, ResLog } from '../tools/log';
import { prisma } from '../app';
import { createPaginationResult, getPaginationParameters } from '../tools/pagination';
import { makePublicUser } from '../data/users';
import { UserEventManager, addRoomEvent, addUserEvent } from '../data/events';
import { EventType } from '../data/type';

export async function createRoom (req: express.Request, res: express.Response) {
    const id = res.locals.token.id;
    if (id === undefined) return;

    try {
        const room = await Rooms.createRoom(id);
        new ResLog(res.locals.lang.info.room.created, Rooms.makePublicRoom(room), Log.CODE.OK).sendTo(res);
    } catch (err) {
        console.error(err);
        new ErrLog(res.locals.lang.error.generic.internalError, Log.CODE.INTERNAL_SERVER_ERROR).sendTo(res);
    }
}

export async function getRoom (req: express.Request, res: express.Response) {
    const id = sanitizer.sanitizeIdField(req.params.id, req, res);
    if (id === null) return;

    const room = await Rooms.getRoomFromId(id);
    if (room === null) {
        new ErrLog(res.locals.lang.error.rooms.notFound, ErrLog.CODE.NOT_FOUND).sendTo(res);
        return;
    }

    new ResLog(res.locals.lang.info.room.fetched, Rooms.makePublicRoom(room), Log.CODE.OK).sendTo(res);
}

export async function getRoomUsers (req: express.Request, res: express.Response) {
    const id = sanitizer.sanitizeIdField(req.params.id, req, res);
    if (id === null) return;

    const pagination = getPaginationParameters(req, res);

    const total = await prisma.user.count({ where: { roomId: id } });
    const users = await prisma.user.findMany({ where: { roomId: id }, skip: pagination.offset, take: pagination.limit });
    const userList = users.map(user => ({
        ...makePublicUser(user),
        connected: UserEventManager.isConnected(user.id)
    }));
    pagination.total = total;

    new ResLog(res.locals.lang.info.users.fetched, createPaginationResult(userList, pagination), Log.CODE.OK).sendTo(res);
}

export async function kickUser (req: express.Request, res: express.Response) {
    const id = sanitizer.sanitizeIdField(req.params.id, req, res);
    if (id === null) return;
    const userId = sanitizer.sanitizeIdField(req.params.userId, req, res);
    if (userId === null) return;

    const room = await Rooms.getRoomFromId(id);
    if (room === null) {
        new ErrLog(res.locals.lang.error.rooms.notFound, ErrLog.CODE.NOT_FOUND).sendTo(res);
        return;
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user === null) {
        new ErrLog(res.locals.lang.error.users.notFound, ErrLog.CODE.NOT_FOUND).sendTo(res);
        return;
    }
    if (user.roomId !== id) {
        new ErrLog(res.locals.lang.error.users.notFound, ErrLog.CODE.NOT_FOUND).sendTo(res);
        return;
    }

    const newRoom = await Rooms.createRoom(userId);
    await prisma.user.update({ where: { id: userId }, data: { roomId: newRoom.id } });

    addRoomEvent(room.id, {
        type: EventType.UserKicked,
        data: {
            user: res.locals.token.id,
            target: user.id
        }
    });

    addUserEvent(userId, {
        type: EventType.UserKicked,
        data: {
            user: res.locals.token.id,
            target: user.id
        }
    });

    new ResLog(res.locals.lang.info.users.fetched, undefined, Log.CODE.OK).sendTo(res);
}

export async function updateRoom (req: express.Request, res: express.Response) {
    const id = sanitizer.sanitizeIdField(req.params.id, req, res);
    if (id === null) return;

    const room = await Rooms.getRoomFromId(id);
    if (room === null) {
        new ErrLog(res.locals.lang.error.rooms.notFound, ErrLog.CODE.NOT_FOUND).sendTo(res);
        return;
    }

    const body = req.body;
    const roomName = sanitizer.sanitizeStringField(body.name, req, res);
    if (roomName === null) return;
    const newRoom = await prisma.room.update({ where: { id }, data: { name: body.name } });

    new ResLog(res.locals.lang.info.room.updated, Rooms.makePublicRoom(newRoom), Log.CODE.OK).sendTo(res);
}

export async function joinRoom (req: express.Request, res: express.Response) {
    const id = res.locals.token.id;
    if (id === undefined) return;
    const roomId = sanitizer.sanitizeIdField(req.params.id, req, res);
    if (roomId === null) return;

    const room = await Rooms.getRoomFromId(roomId);
    if (room === null) {
        new ErrLog(res.locals.lang.error.rooms.notFound, ErrLog.CODE.NOT_FOUND).sendTo(res);
        return;
    }

    try {
        await prisma.user.update({ where: { id }, data: { roomId: room.id } });

        addRoomEvent(room.id, {
            type: EventType.UserJoined,
            data: {
                user: res.locals.token.id
            }
        });

        new ResLog(res.locals.lang.info.room.joined, Log.CODE.OK).sendTo(res);
    } catch (err) {
        console.error(err);
        new ErrLog(res.locals.lang.error.generic.internalError, Log.CODE.INTERNAL_SERVER_ERROR).sendTo(res);
    }
}

export async function leaveRoom (req: express.Request, res: express.Response) {
    const id = res.locals.token.id;
    if (id === undefined) return;

    const roomId = sanitizer.sanitizeIdField(req.params.id, req, res);
    if (roomId === null) return;

    const room = await Rooms.getRoomFromId(roomId);
    if (room === null) {
        new ErrLog(res.locals.lang.error.rooms.notFound, ErrLog.CODE.NOT_FOUND).sendTo(res);
        return;
    }

    const roomUsers = await prisma.user.findMany({ where: { roomId: room.id } });
    if (roomUsers.length === 1) {
        await Rooms.deleteRoom(room.id);
    } else {
        await prisma.room.update({ where: { id: room.id }, data: { ownerId: roomUsers[0].id } });
        addRoomEvent(room.id, {
            type: EventType.UserLeft,
            data: {
                user: res.locals.token.id
            }
        });
    }

    const newRoom = await Rooms.createRoom(id);
    req.params.id = newRoom.id.toString();
    return joinRoom(req, res);
}
