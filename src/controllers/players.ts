import type express from 'express';
import * as sanitizer from '../tools/sanitizer';
import * as Players from '../data/players';
import * as Songs from '../data/songs';
import { Log, ErrLog, ResLog } from '../tools/log';
import { prisma } from '../app';
import { addRoomEvent } from '../data/users';
import { EventType } from '../data/type';

export async function getPlayer (req: express.Request, res: express.Response) {
    const playerId = sanitizer.sanitizeIdField(req.params.id, req, res);
    if (playerId === null) return;

    try {
        const player = await Players.getPlayerFromId(playerId);
        if (player === null) {
            new ErrLog(res.locals.lang.error.players.notFound, ErrLog.CODE.NOT_FOUND).sendTo(res);
            return;
        }
        console.log(player);
        new ResLog(res.locals.lang.info.songs.fetched, Players.makePublicPlayer(player), Log.CODE.OK).sendTo(res);
    } catch (err) {
        console.error(err);
        new ErrLog(res.locals.lang.error.generic.internalError, ErrLog.CODE.INTERNAL_SERVER_ERROR).sendTo(res);
    }
}

export async function playPlayer (req: express.Request, res: express.Response) {
    const playerId = sanitizer.sanitizeIdField(req.params.id, req, res);
    if (playerId === null) return;

    try {
        const player = await Players.getPlayerFromId(playerId);
        if (player === null) {
            new ErrLog(res.locals.lang.error.players.notFound, ErrLog.CODE.NOT_FOUND).sendTo(res);
            return;
        }
        if (player.playing) return;

        const newPlayer = await prisma.player.update({ where: { id: playerId }, data: { playing: true, cursorDate: new Date() } });
        if (newPlayer.roomId !== null) {
            addRoomEvent(newPlayer.roomId, {
                type: EventType.PlayerPlayed,
                data: {
                    user: res.locals.token.id,
                    position: newPlayer.position,
                    cursorDate: newPlayer.cursorDate
                }
            });
        }
        console.log('Play event, new position: ' + newPlayer.position.toString());
        new ResLog(res.locals.lang.info.player.played, Players.makePublicPlayer(player), Log.CODE.OK).sendTo(res);
    } catch (err) {
        console.error(err);
        new ErrLog(res.locals.lang.error.generic.internalError, ErrLog.CODE.INTERNAL_SERVER_ERROR).sendTo(res);
    }
}

export async function pausePlayer (req: express.Request, res: express.Response) {
    const playerId = sanitizer.sanitizeIdField(req.params.id, req, res);
    if (playerId === null) return;

    try {
        const player = await Players.getPlayerFromId(playerId);
        if (player === null) {
            new ErrLog(res.locals.lang.error.players.notFound, ErrLog.CODE.NOT_FOUND).sendTo(res);
            return;
        }
        if (!player.playing) return;

        const newPosition = (new Date().getUTCSeconds() - player.cursorDate.getUTCSeconds()) + player.position;
        console.log('Pause event, new position: ' + newPosition.toString());

        const newPlayer = await prisma.player.update({ where: { id: playerId }, data: { playing: false, cursorDate: new Date(), position: newPosition } });
        if (newPlayer.roomId !== null) {
            addRoomEvent(newPlayer.roomId, {
                type: EventType.PlayerPaused,
                data: {
                    user: res.locals.token.id,
                    position: newPlayer.position,
                    cursorDate: newPlayer.cursorDate
                }
            });
        }
        new ResLog(res.locals.lang.info.player.paused, Players.makePublicPlayer(player), Log.CODE.OK).sendTo(res);
    } catch (err) {
        console.error(err);
        new ErrLog(res.locals.lang.error.generic.internalError, ErrLog.CODE.INTERNAL_SERVER_ERROR).sendTo(res);
    }
}

export async function changePlayer (req: express.Request, res: express.Response) {
    const playerId = sanitizer.sanitizeIdField(req.params.id, req, res);
    if (playerId === null) return;
    const body = sanitizer.sanitizeBody(req.body, obj => ({ songId: obj.songId }), req, res);
    if (body === null) return;

    try {
        if (body.songId === null) {
            new ErrLog(res.locals.lang.error.players.noSongSpecified, ErrLog.CODE.NOT_FOUND).sendTo(res);
            return;
        }

        const player = await Players.getPlayerFromId(playerId);
        if (player === null) {
            new ErrLog(res.locals.lang.error.players.notFound, ErrLog.CODE.NOT_FOUND).sendTo(res);
            return;
        }
        const song = await Songs.getSongFromId(body.songId);
        if (song === null) {
            new ErrLog(res.locals.lang.error.songs.notFound, ErrLog.CODE.NOT_FOUND).sendTo(res);
            return;
        }
        const newPlayer = await prisma.player.update({ where: { id: playerId }, data: { songId: body.songId, playing: true, position: 0, cursorDate: new Date() } });

        if (player.roomId !== null) {
            addRoomEvent(player.roomId, {
                type: EventType.PlayerChanged,
                data: {
                    user: res.locals.token.id,
                    song: newPlayer.songId
                }
            });
            if (!player.playing) {
                addRoomEvent(player.roomId, {
                    type: EventType.PlayerPlayed,
                    data: {
                        user: res.locals.token.id,
                        position: newPlayer.position,
                        cursorDate: newPlayer.cursorDate
                    }
                });
            }
        }
        new ResLog(res.locals.lang.info.player.changed, Players.makePublicPlayer(player), Log.CODE.OK).sendTo(res);
    } catch (err) {
        console.error(err);
        new ErrLog(res.locals.lang.error.generic.internalError, ErrLog.CODE.INTERNAL_SERVER_ERROR).sendTo(res);
    }
}

export async function nextPlayer (req: express.Request, res: express.Response) {
    const playerId = sanitizer.sanitizeIdField(req.params.id, req, res);
    if (playerId === null) return;

    try {
        const player = await prisma.player.findUnique({ where: { id: playerId }, include: { song: true } });
        if (player === null) {
            new ErrLog(res.locals.lang.error.players.notFound, ErrLog.CODE.NOT_FOUND).sendTo(res);
            return;
        }
        if (player.song === null) {
            new ErrLog(res.locals.lang.error.players.noSong, ErrLog.CODE.NOT_FOUND).sendTo(res);
            return;
        }
        if (player.song.nextId === null) {
            new ErrLog(res.locals.lang.error.players.noNextSong, ErrLog.CODE.NOT_FOUND).sendTo(res);
            return;
        }
        await prisma.player.update({ where: { id: playerId }, data: { songId: player.song.nextId, playing: true, position: 0, cursorDate: new Date() } });

        if (player.roomId !== null) {
            addRoomEvent(player.roomId, {
                type: EventType.PlayerNexted,
                data: {
                    user: res.locals.token.id,
                    song: player.song.nextId
                }
            });
            if (!player.playing) {
                addRoomEvent(player.roomId, {
                    type: EventType.PlayerPlayed,
                    data: {
                        user: res.locals.token.id
                    }
                });
            }
        }
        new ResLog(res.locals.lang.info.songs.fetched, Players.makePublicPlayer(player), Log.CODE.OK).sendTo(res);
    } catch (err) {
        console.error(err);
        new ErrLog(res.locals.lang.error.generic.internalError, ErrLog.CODE.INTERNAL_SERVER_ERROR).sendTo(res);
    }
}

export async function prevPlayer (req: express.Request, res: express.Response) {
    const playerId = sanitizer.sanitizeIdField(req.params.id, req, res);
    if (playerId === null) return;

    try {
        const player = await prisma.player.findUnique({ where: { id: playerId }, include: { song: true } });
        if (player === null) {
            new ErrLog(res.locals.lang.error.players.notFound, ErrLog.CODE.NOT_FOUND).sendTo(res);
            return;
        }
        if (player.song === null) {
            new ErrLog(res.locals.lang.error.players.noSong, ErrLog.CODE.NOT_FOUND).sendTo(res);
            return;
        }
        const song = await prisma.song.findUnique({ where: { nextId: player.song.id } });
        if (song === null) {
            new ErrLog(res.locals.lang.error.players.noPrevSong, ErrLog.CODE.NOT_FOUND).sendTo(res);
            return;
        }
        await prisma.player.update({ where: { id: playerId }, data: { songId: song.id, playing: true, position: 0, cursorDate: new Date() } });

        if (player.roomId !== null) {
            addRoomEvent(player.roomId, {
                type: EventType.PlayerPreved,
                data: {
                    user: res.locals.token.id,
                    song: song.id
                }
            });
            if (!player.playing) {
                addRoomEvent(player.roomId, {
                    type: EventType.PlayerPlayed,
                    data: {
                        user: res.locals.token.id
                    }
                });
            }
        }
        new ResLog(res.locals.lang.info.songs.fetched, Players.makePublicPlayer(player), Log.CODE.OK).sendTo(res);
    } catch (err) {
        console.error(err);
        new ErrLog(res.locals.lang.error.generic.internalError, ErrLog.CODE.INTERNAL_SERVER_ERROR).sendTo(res);
    }
}

export async function movePlayer (req: express.Request, res: express.Response) {
    const playerId = sanitizer.sanitizeIdField(req.params.id, req, res);
    if (playerId === null) return;
    const body = sanitizer.sanitizeBody(req.body, obj => ({ position: obj.position }), req, res);
    if (body === null) return;

    try {
        const player = await prisma.player.update({ where: { id: playerId }, data: { position: body.position, cursorDate: new Date() } });
        if (player === null) {
            new ErrLog(res.locals.lang.error.players.notFound, ErrLog.CODE.NOT_FOUND).sendTo(res);
            return;
        }

        if (player.roomId !== null) {
            addRoomEvent(player.roomId, {
                type: EventType.PlayerMoved,
                data: {
                    user: res.locals.token.id,
                    position: body.position,
                    cursorDate: new Date()
                }
            });
        }
        new ResLog(res.locals.lang.info.songs.fetched, Players.makePublicPlayer(player), Log.CODE.OK).sendTo(res);
    } catch (err) {
        console.error(err);
        new ErrLog(res.locals.lang.error.generic.internalError, ErrLog.CODE.INTERNAL_SERVER_ERROR).sendTo(res);
    }
}
