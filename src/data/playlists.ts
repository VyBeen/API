import type { Playlist, Room } from '@prisma/client';
import { prisma } from '../app';
import type { PublicPlaylist } from './type';

export async function createPlaylist (room: Room | undefined): Promise<Playlist> {
    return await prisma.playlist.create({ data: { roomId: room?.id } });
}

export async function getPlaylistFromId (id: number): Promise<Playlist | null> {
    return await prisma.playlist.findUnique({ where: { id }, include: { head: true, room: true, tail: true } });
}

export function makePublicPlaylist (obj: any): PublicPlaylist {
    return {
        id: obj.id,
        roomId: obj.roomId ?? obj.room?.id ?? null,
        headId: obj.headId ?? obj.head?.id ?? null,
        tailId: obj.tailId ?? obj.tail?.id ?? null
    };
}
