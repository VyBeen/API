import type { UserEvent } from './type';
import { EventType } from './type';
import type { Response } from 'express';
import { Log, ResLog } from '../tools/log';
import { prisma } from '../app';

const userEvents: Record<number, UserEventManager> = {};
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
}

export function addRoomEvent (id: number, event: UserEvent) {
    prisma.user.findMany({ where: { roomId: id } }).then(users => {
        users.forEach(user => { addUserEvent(user.id, event); });
    }).catch(err => {
        console.error(err);
    });
}

export function addUserEvent (id: number, event: UserEvent) {
    if (userEvents[id] === undefined) return;
    userEvents[id].addEvent(event);
}

export function getUserEventsManager (id: number) {
    if (userEvents[id] === undefined) return;
    return userEvents[id];
}
