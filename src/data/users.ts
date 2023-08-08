import type { User } from '@prisma/client';
import { prisma } from '../app';
import { createRoom } from './rooms';
import type { UserEvent, PrivateUser, PublicUser } from './type';
import { EventType } from './type';
import jwt from 'jsonwebtoken';
import type { Response } from 'express';
import { Log, ResLog } from '../tools/log';

const portalRequests: Record<string, { time: number, user: PrivateUser | null }> = {};
const userEvents: Record<number, UserEventManager> = {};

const TOKEN_LIFETIME = 1000 * 60 * 15; // 15 min
const SECRET_KEY = process.env.SECRET_KEY as string;

function stringifyEventType (ev: EventType) {
    const zMajCode = 'Z'.charCodeAt(0);
    return EventType[ev].toString().split('').map(letter => {
        const code = letter.charCodeAt(0);
        if (code > zMajCode) return String.fromCharCode(code);

        return '.' + String.fromCharCode(code + 32);
    }).join('').substring(1);
}

class UserEventManager {
    events: UserEvent[];
    response: Response | null;
    timeout: NodeJS.Timeout | null;

    constructor () {
        this.events = [];
        this.response = null;
        this.timeout = null;
    }

    addEvent (ev: UserEvent) {
        this.events.push(ev);
        if (this.timeout !== null) clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
            this.sendEvents();
            this.timeout = null;
        }, 100);
    }

    getEvents (res: Response) {
        if (this.response !== null) {
            this.sendEvents();
        }
        this.response = res;
    }

    sendEvents () {
        if (this.response === null) return;
        const events = this.events.map(ev => {
            return {
                type: stringifyEventType(ev.type),
                data: ev.data
            }
        });
        new ResLog(this.response.locals.lang.info.events.fetched, events, Log.CODE.OK).sendTo(this.response);
        this.events = [];
        this.response = null;
    }

    clearEvents () {
        this.events = [];
        if (this.timeout !== null) clearTimeout(this.timeout);
        this.timeout = null;
    }
}

export function addRoomEvent (id: number, event: UserEvent) {
    prisma.user.findMany({ where: { roomId: id } }).then(users => {
        users.forEach(user => { addUserEvent(user.id, event); });
    }).catch(err => {
        console.error(err);
    });
}

export function addUserEvent (id: number, event: UserEvent) {
    if (userEvents[id] === undefined) userEvents[id] = new UserEventManager();
    userEvents[id].addEvent(event);
}

export function getUserEventsManager (id: number) {
    if (userEvents[id] === undefined) userEvents[id] = new UserEventManager();
    return userEvents[id];
}

export function clearUserEvents (id: number) {
    if (userEvents[id] === undefined) userEvents[id] = new UserEventManager();
    userEvents[id].clearEvents();
}

export function createUserToken (id: number): string {
    const token = jwt.sign(
        { id },
        SECRET_KEY
    );
    return 'Bearer ' + token;
}

export function createUser (token: string): boolean {
    removeUselessPortalTokens();
    if (portalRequests[token] !== undefined) return false;
    portalRequests[token] = {
        time: Date.now(),
        user: null
    };
    return true;
}

export async function registerUser (token: string, user: any): Promise<User> {
    removeUselessPortalTokens();
    if (portalRequests[token] === undefined) {
        console.error('Token not found : ', token);
        throw new Error('Token not specified');
    }
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete portalRequests[token];

    const room = await createRoom();
    const dbUser = await prisma.user.findUnique({ where: { furwazId: user.id } });
    if (dbUser === null) {
        return await prisma.user.create({
            data: {
                pseudo: user.pseudo,
                furwazId: user.id,
                roomId: room.id
            }
        });
    } else {
        return dbUser;
    }
}

export function getUserFromPortalToken (token: string): any {
    removeUselessPortalTokens();
    if (portalRequests[token] === undefined) {
        console.error('Token not found : ', token);
        return null;
    }
    return portalRequests[token].user;
}

export async function getUserFromId (id: number): Promise<User | null> {
    return await prisma.user.findUnique({ where: { id } });
}

function removeUselessPortalTokens () {
    const now = Date.now();
    for (const token in portalRequests) {
        if (portalRequests[token].user === undefined && portalRequests[token].time + TOKEN_LIFETIME < now) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete portalRequests[token];
        }
    }
}

export function makePrivateUser (obj: any): PrivateUser {
    return {
        id: obj.id,
        furwazId: obj.furwazId,
        pseudo: obj.pseudo,
        token: createUserToken(obj.id),
        roomId: obj.roomId ?? obj.room?.id ?? null
    };
}

export function makePublicUser (obj: any): PublicUser {
    return {
        id: obj.id,
        furwazId: obj.furwazId,
        pseudo: obj.pseudo,
        roomId: obj.roomId
    };
}
