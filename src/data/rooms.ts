import type { Room } from '@prisma/client';
import { prisma } from '../app';
import type { UserEvent, PublicRoom } from './type';
import { createPlayer } from './players';
import { createPlaylist } from './playlists';
import { addUserEvent } from './events';

export async function getRoomFromId (id: number): Promise<Room | null> {
    return await prisma.room.findUnique({ where: { id }, include: { playlist: true, player: true } });
}

export async function createRoom (ownerId: number | null, createChilds: boolean = true): Promise<Room> {
    const room = await prisma.room.create({ data: { name: 'VyBeen', ownerId } });
    if (createChilds) {
        await createPlayer(room);
        await createPlaylist(room);
    }
    return room;
}

export async function deleteRoom (id: number) {
    try {
        return await prisma.room.delete({ where: { id } });
    } catch (err) {
        console.error(err);
    }
}

export async function broadcastEvent (id: number, event: UserEvent) {
    const room = await prisma.room.findUnique({ where: { id }, include: { users: true } });
    room?.users.forEach(user => { addUserEvent(user.id, event) });
}

export function makePublicRoom (obj: any): PublicRoom {
    return {
        id: obj.id,
        name: obj.name,
        playerId: obj.playerId ?? obj.player?.id ?? null,
        playlistId: obj.playlistId ?? obj.playlist?.id ?? null,
        ownerId: obj.ownerId ?? obj.owner?.id ?? null
    };
}
