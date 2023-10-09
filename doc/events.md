# VyBeen events

## Rooms
### room.updated
Emitted when a room's informations are updated

Data:
```json
{
    "name": "room name"
}
```

### room.joined
Emitted when a user joins a room

Data:
```json
{
    "user": 0
}
```

### room.left
Emitted when a user leaves a room

Data:
```json
{
    "user": 0
}
```

## Playlists
### playlist.added
Emitted when a song is added to a playlist

Data:
```json
{
    "user": 0,
    "song": 0
}
```

### playlist.removed
Emitted when a song is removed from a playlist

Data:
```json
{
    "user": 0,
    "song": 0
}
```

### playlist.moved
Emitted when a song is moved in a playlist

Data:
```json
{
    "user": 0,
    "song": 0,
    "prev": 0
}
```

## Player
### player.played
Emitted when a player is played

Data:
```json
{
    "user": 0,
    "position": 0,
    "cursorDate": "date"
}
```

### player.paused
Emitted when a player is paused

Data:
```json
{
    "user": 0,
    "position": 0,
    "cursorDate": "date"
}
```

### player.nexted
Emitted when a player is nexted

Data:
```json
{
    "user": 0,
    "song": 0
}
```

### player.changed
Emitted when a player is changed

Data:
```json
{
    "user": 0,
    "song": 0
}
```

### player.preved
Emitted when a player is preved

Data:
```json
{
    "user": 0,
    "song": 0
}
```

### player.moved
Emitted when a player is moved

Data:
```json
{
    "user": { "id": 0 },
    "position": 0,
    "cursorDate": "date"
}
```

## Users

### user.joined
Emitted when a user joins a room

Data:
```json
{
    "user": 0
}
```

### user.left
Emitted when a user leaves a room

Data:
```json
{
    "user": 0
}
```

### user.kicked
Emitted when a user is kicked from a room

Data:
```json
{
    "user": 0,
    "target": 0
}
```