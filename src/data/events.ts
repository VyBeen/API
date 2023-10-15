import type { UserEvent } from './type';
import { EventType } from './type';
import { prisma } from '../app';
import type { Server, Socket } from 'socket.io';
import props from '../properties.json';
import { verify } from 'jsonwebtoken';

function stringifyEventType (ev: EventType) {
    const zMajCode = 'Z'.charCodeAt(0);
    return EventType[ev].toString().split('').map(letter => {
        const code = letter.charCodeAt(0);
        if (code > zMajCode) return String.fromCharCode(code);

        return '.' + String.fromCharCode(code + 32);
    }).join('').substring(1);
}

export class UserEventManager {
    static io: Server | null = null;
    static userEvents: Record<number, UserEventManager | undefined> = {};

    static isConnected (id: number): boolean {
        return UserEventManager.userEvents[id] !== undefined;
    }

    static setIOObject (obj: Server) {
        this.io = obj;

        this.io.on('connection', socket => {
            const socketInformations = {
                authenticated: false,
                userId: null
            };
            setTimeout(() => {
                if (socketInformations.authenticated) return;
                socket.disconnect();
            }, props.socket.anonymousTimeoutDisconnect);
            socket.on('auth', async (data: string) => {
                const token = data.startsWith('Bearer')
                    ? data.split(' ')[1]
                    : data;
                try {
                    const res = verify(token, process.env.SECRET_KEY as string) as any;
                    if (res.id !== undefined && res.id !== null) {
                        socketInformations.authenticated = true;
                        socketInformations.userId = res.id;
                        if (this.userEvents[res.id] !== undefined) {
                            socket.emit('error', 'Already connected');
                            socket.disconnect(); // Already connected
                            return;
                        }
                        const dbUser = await prisma.user.findUnique({ where: { id: res.id } });
                        if (dbUser === null) {
                            socket.disconnect();
                            return;
                        }
                        this.userEvents[res.id] = new UserEventManager(socket);
                        addRoomEvent(dbUser.roomId, {
                            type: EventType.UserConnected,
                            data: {
                                user: res.id
                            }
                        });
                    }
                } catch { }
            });
            socket.on('disconnect', async () => {
                if (!socketInformations.authenticated || socketInformations.userId === null) return;
                if (this.userEvents[socketInformations.userId] !== undefined) {
                    this.userEvents[socketInformations.userId] = undefined;
                }
                const dbUser = await prisma.user.findUnique({ where: { id: socketInformations.userId } });
                if (dbUser !== null) {
                    addRoomEvent(dbUser.roomId, {
                        type: EventType.UserDisconnected,
                        data: {
                            user: socketInformations.userId
                        }
                    });
                }
            });
        });
    }

    socket: Socket

    constructor (socket: Socket) {
        this.socket = socket;
    }

    addEvent (ev: UserEvent) {
        this.socket.emit(stringifyEventType(ev.type), ev.data);
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
    getUserEventsManager(id)?.addEvent(event);
}

export function getUserEventsManager (id: number): UserEventManager | undefined {
    return UserEventManager.userEvents[id];
}
