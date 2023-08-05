# VyBeen data structure

## Users
| Field    | Type   | Description       |
| -------- | ------ | ----------------- |
| id       | number | User unique id    |
| furwazId | number | User's FurWaz id  |
| token    | string | User token        |
| pseudo   | string | User pseudonym    |
| room     | object | Current user room |


## Rooms
| Field    | Type   | Description   |
| -------- | ------ | ------------- |
| id       | number | Room id       |
| name     | string | Room name     |
| users    | array  | Room users    |
| playlist | object | Room Playlist |
| player   | object | Room Player   |

## Songs
| Field  | Type   | Description     |
| ------ | ------ | --------------- |
| id     | number | Song id         |
| title  | string | Song title      |
| artist | string | Song artist     |
| url    | string | Song stream url |
| cover  | string | Song cover url  |

## Playlist
| Field | Type   | Description    |
| ----- | ------ | -------------- |
| id    | number | Playlist id    |
| songs | array  | Playlist songs |
| room  | object | Playlist room  |

## Player
| Field    | Type   | Description     |
| -------- | ------ | --------------- |
| id       | number | Player id       |
| room     | object | Player room     |
| song     | object | Player song     |
| position | number | Player position |
| playing  | bool   | Player playing  |
