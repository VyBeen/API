import type { Song } from '@prisma/client';
import { prisma } from '../app';
import type { PublicSong } from './type';

export async function getSongFromId (id: number): Promise<Song | null> {
    return await prisma.song.findUnique({ where: { id } });
}

export async function createSong (title: string, artist: string, cover: string, url: string): Promise<Song> {
    return await prisma.song.create({ data: { title, artist, cover, url } });
}

export function makePublicSong (obj: any): PublicSong {
    return {
        id: obj.id,
        title: obj.title,
        artist: obj.artist,
        cover: obj.cover,
        url: obj.url,
        nextId: obj.nextId ?? obj.next?.id ?? null
    };
}
