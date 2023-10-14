import http from 'http';
import { app } from './app';
import logger from './tools/logger';
import process from 'process';
import dotenv from 'dotenv';
import { Server } from 'socket.io';

dotenv.config();

const port = normalizePort(process.env.PORT ?? '8080');
app.set('port', port);

const server = http.createServer(app);
const io = new Server(server, {
    path: process.env.SOCKETIO_PATH,
    cors: { origin: '*' }
});

server.on('error', errorHandler);
server.on('listening', () => {
    const address = server.address();
    const bind = typeof address === 'string' ? 'pipe ' + String(address) : 'port ' + String(port);
    console.log('Listening on ' + bind);
});

io.on('connection', socket => {
    console.log('connection from socket ', socket);
    socket.on('disconnect', (reason, desc) => {
        console.log('Socket ' + socket.id.toString() + ' disconnected !\n' + reason.toString() + ' : ' + desc.toString());
    })
});

function main () {
    logger.setupLogging();
    startServer();
}

main();

function normalizePort (val: string) {
    const port = parseInt(val, 10);

    if (isNaN(port)) {
        return val;
    }

    if (port >= 0) {
        return port;
    }

    return false;
}

function errorHandler (error: NodeJS.ErrnoException) {
    if (error.syscall !== 'listen') {
        throw error;
    }
    const address = server.address();
    const bind = typeof address === 'string' ? 'pipe ' + String(address) : 'port: ' + String(port);
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges.');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use.');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

function startServer () {
    server.listen(port);
}
