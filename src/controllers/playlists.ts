import type express from 'express';
import * as sanitizer from '../tools/sanitizer';
import * as Playlists from '../data/playlists';
import { Log, ErrLog, ResLog } from '../tools/log';
import { prisma } from '../app';
import * as Songs from '../data/songs';
import { addRoomEvent } from '../data/events';
import { EventType } from '../data/type';

export async function getPlaylist (req: express.Request, res: express.Response) {
    const id = sanitizer.sanitizeIdField(req.params.id, req, res);
    if (id === null) return;

    const playlist = await Playlists.getPlaylistFromId(id);
    if (playlist === null) {
        new ErrLog(res.locals.lang.error.playlists.notFound, ErrLog.CODE.NOT_FOUND).sendTo(res);
        return;
    }

    new ResLog(res.locals.lang.info.playlists.fetched, Playlists.makePublicPlaylist(playlist), Log.CODE.OK).sendTo(res);
}

export async function createSong (req: express.Request, res: express.Response) {
    const playlistId = sanitizer.sanitizeIdField(req.params.id, req, res);
    if (playlistId === null) return;
    const body = sanitizer.sanitizeBody({ ...req.body }, Songs.makePublicSong, req, res);
    if (body === null) return;

    try {
        const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
        if (playlist === null) {
            new ErrLog(res.locals.lang.error.playlists.notFound, ErrLog.CODE.NOT_FOUND).sendTo(res);
            return;
        }
        const song = await prisma.song.create({
            data: {
                title: body.title.replace(/\([a-zA-Z\\. ]*\)/g, ''),
                artist: body.artist.replace(/\([a-zA-Z\\. ]*\)/g, ''),
                cover: body.cover,
                url: body.url
            }
        });
        if (playlist.tailId !== null) {
            await prisma.song.update({ where: { id: playlist.tailId }, data: { nextId: song.id } });
        }
        await prisma.playlist.update({ where: { id: playlistId }, data: { headId: playlist?.headId ?? song.id, tailId: song.id } });

        if (playlist.roomId !== null) {
            addRoomEvent(playlist.roomId, {
                type: EventType.PlaylistAdded,
                data: {
                    user: res.locals.token.id,
                    song: song.id
                }
            });
        }
        new ResLog(res.locals.lang.info.songs.created, Songs.makePublicSong(song), Log.CODE.OK).sendTo(res);
    } catch (err) {
        console.error(err);
        new ErrLog(res.locals.lang.error.generic.internalError, ErrLog.CODE.INTERNAL_SERVER_ERROR).sendTo(res);
    }
}

export async function getSong (req: express.Request, res: express.Response) {
    const playlistId = sanitizer.sanitizeIdField(req.params.id, req, res);
    if (playlistId === null) return;
    const songId = sanitizer.sanitizeIdField(req.params.songId, req, res);
    if (songId === null) return;

    try {
        const playlist = await Playlists.getPlaylistFromId(playlistId);
        if (playlist === null) {
            new ErrLog(res.locals.lang.error.playlists.notFound, ErrLog.CODE.NOT_FOUND).sendTo(res);
            return;
        }
        const song = await Songs.getSongFromId(songId);
        if (song === null) {
            new ErrLog(res.locals.lang.error.songs.notFound, ErrLog.CODE.NOT_FOUND).sendTo(res);
            return;
        }

        new ResLog(res.locals.lang.info.songs.fetched, Songs.makePublicSong(song), Log.CODE.OK).sendTo(res);
    } catch (err) {
        console.error(err);
        new ErrLog(res.locals.lang.error.generic.internalError, ErrLog.CODE.INTERNAL_SERVER_ERROR).sendTo(res);
    }
}

export async function moveSong (req: express.Request, res: express.Response) {
    const playlistId = sanitizer.sanitizeIdField(req.params.id, req, res);
    if (playlistId === null) return;
    const songId = sanitizer.sanitizeIdField(req.params.songId, req, res);
    if (songId === null) return;
    const body = sanitizer.sanitizeBody({ ...req.body, id: -1 }, obj => ({ prevId: obj.prevId }), req, res);
    if (body === null) return;

    try {
        const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
        if (playlist === null) {
            new ErrLog(res.locals.lang.error.playlists.notFound, ErrLog.CODE.NOT_FOUND).sendTo(res);
            return;
        }
        const song = await prisma.song.findUnique({ where: { id: songId } });
        const prev = await prisma.song.findUnique({ where: { nextId: songId } });
        if (song === null) {
            new ErrLog(res.locals.lang.error.songs.notFound, ErrLog.CODE.NOT_FOUND).sendTo(res);
            return;
        }

        await prisma.song.update({ where: { id: song.id }, data: { nextId: null } });
        if (prev !== null) {
            await prisma.song.update({ where: { id: prev.id }, data: { nextId: song.nextId } });
            if (playlist.tailId === songId) {
                await prisma.playlist.update({ where: { id: playlistId }, data: { tailId: prev.id } });
            }
        }

        if (body.prevId === null) {
            await prisma.playlist.update({ where: { id: playlistId }, data: { headId: songId } });
            await prisma.song.update({ where: { id: songId }, data: { nextId: playlist.headId } });
        } else {
            const curr = await prisma.song.findUnique({ where: { id: body.prevId } });
            if (curr === null) {
                new ErrLog(res.locals.lang.error.songs.notFound, ErrLog.CODE.NOT_FOUND).sendTo(res);
                return;
            }
            await prisma.song.update({ where: { id: curr.id }, data: { nextId: songId } });
            await prisma.song.update({ where: { id: songId }, data: { nextId: curr.nextId } });
            if (playlist.headId === songId) {
                await prisma.playlist.update({ where: { id: playlistId }, data: { headId: song.nextId } });
            }
        }

        addRoomEvent(playlist.roomId ?? 0, {
            type: EventType.PlaylistMoved,
            data: {
                user: res.locals.token.id,
                song: songId,
                prev: body.prevId
            }
        });

        new ResLog(res.locals.lang.info.songs.moved, Songs.makePublicSong(song), Log.CODE.OK).sendTo(res);
    } catch (err) {
        console.error(err);
        new ErrLog(res.locals.lang.error.generic.internalError, ErrLog.CODE.INTERNAL_SERVER_ERROR).sendTo(res);
    }
}

export async function removeSong (req: express.Request, res: express.Response) {
    const playlistId = sanitizer.sanitizeIdField(req.params.id, req, res);
    if (playlistId === null) return;
    const songId = sanitizer.sanitizeIdField(req.params.songId, req, res);
    if (songId === null) return;

    try {
        const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
        if (playlist === null) {
            new ErrLog(res.locals.lang.error.playlists.notFound, ErrLog.CODE.NOT_FOUND).sendTo(res);
            return;
        }
        const song = await prisma.song.findUnique({ where: { id: songId } });
        if (song === null) {
            new ErrLog(res.locals.lang.error.songs.notFound, ErrLog.CODE.NOT_FOUND).sendTo(res);
            return;
        }
        if (playlist.headId === songId) {
            await prisma.playlist.update({ where: { id: playlistId }, data: { headId: song.nextId } });
            await prisma.song.delete({ where: { id: songId } });
        } else {
            const prev = await prisma.song.findFirst({ where: { nextId: songId } });
            if (prev !== null) {
                await prisma.song.delete({ where: { id: songId } });
                await prisma.song.update({ where: { id: prev.id }, data: { nextId: song.nextId } });
            }
        }

        if (playlist.roomId !== null) {
            addRoomEvent(playlist.roomId, {
                type: EventType.PlaylistRemoved,
                data: {
                    user: res.locals.token.id,
                    song: songId
                }
            });
        }
        new ResLog(res.locals.lang.info.songs.deleted, Songs.makePublicSong(song), Log.CODE.OK).sendTo(res);
    } catch (err) {
        console.error(err);
        new ErrLog(res.locals.lang.error.generic.internalError, ErrLog.CODE.INTERNAL_SERVER_ERROR).sendTo(res);
    }
}
