import type { Player, Room } from '@prisma/client';
import { prisma } from '../app';
import type { PublicPlayer } from './type';

export async function getPlayerFromId (id: number): Promise<Player | null> {
    return await prisma.player.findUnique({ where: { id } });
}

export async function createPlayer (room: Room | undefined): Promise<Player> {
    return await prisma.player.create({ data: { playing: false, position: 0, roomId: room?.id } });
}

export function makePublicPlayer (obj: any): PublicPlayer {
    return {
        id: obj.id,
        position: obj.position,
        cursorDate: obj.cursorDate,
        playing: obj.playing,
        songId: obj.songId ?? obj.song?.id ?? null,
        roomId: obj.roomId ?? obj.room?.id ?? null
    };
}
