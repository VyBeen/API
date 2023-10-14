# VyBeen api routes

## User
### GET /auth/token
Get a furwaz portal connection token

### GET /auth/register?token={token}
Get VyBeen user data from the portal token

### GET /users/{id}
Get VyBeen user data from the user id

### DELETE /users/{id}
Delete a VyBeen user

## Room
### POST /rooms
Create a new VyBeen room

### GET /rooms/{id}
Get a VyBeen room data from the room id

### GET /rooms/{id}/users
Get VyBeen room users from the room id

### DELETE /rooms/{id}/{user}
Kick a VyBeen user from the room id

### PATCH /rooms/{id}
Update a VyBeen room

### DELETE /rooms/{id}
Quit a VyBeen room

### POST /rooms/{id}
Join a VyBeen room

## Search
### GET /search/rooms/{query}
Search a VyBeen room from a query

### GET /search/users/{query}
Search a VyBeen user from a query

### GET /search/songs/{query}
Search a VyBeen song from a query

## Playlist
### GET /playlists/{id}
Get a VyBeen playlist data from the playlist id

### POST /playlists/{id}/songs
Add a song to a VyBeen playlist

### GET /playlists/{id}/{song}
Get a VyBeen playlist song data from the playlist id and the song id

### PATCH /playlists/{id}/{song}
Move a song in a VyBeen playlist

### DELETE /playlists/{id}/{song}
Remove a song from a VyBeen playlist

## Player
### GET /players/{id}
Get a VyBeen player data from the player id

### POST /players/{id}/play
Play a VyBeen player

### POST /players/{id}/pause
Pause a VyBeen player

### POST /players/{id}/change
Change the song in a VyBeen player

### POST /players/{id}/next
Play the next song in a VyBeen player

### POST /players/{id}/prev
Play the previous song in a VyBeen player

### POST /players/{id}/move
Move the song time in a VyBeen player
