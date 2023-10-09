export interface PrivateUser {
    id: number
    furwazId: number
    pseudo: string
    token: string
    roomId: number
}

export interface PublicUser {
    id: number
    furwazId: number
    pseudo: string
    roomId: number
}

export interface PublicRoom {
    id: number
    name: string
    playlistId: number
    playerId: number
}

export interface PublicPlayer {
    id: number
    position: number
    cursorDate: Date
    playing: boolean
    songId: number
    roomId: number
}

export interface PublicSong {
    id: number
    title: string
    artist: string
    cover: string
    url: string
    nextId: number
}

export interface PublicPlaylist {
    id: number
    roomId: number
    headId: number
    tailId: number
}

export interface UserEvent {
    type: EventType
    data: object | undefined
}

export enum EventType {
    RoomUpdated,
    RoomJoined,
    RoomLeft,

    PlaylistAdded,
    PlaylistRemoved,
    PlaylistMoved,

    PlayerPlayed,
    PlayerPaused,
    PlayerNexted,
    PlayerChanged,
    PlayerPreved,
    PlayerMoved,

    UserJoined,
    UserLeft,
    UserKicked,
}
