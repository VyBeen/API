import express from 'express';
import { PrismaClient } from '@prisma/client';
import { Log, ErrLog } from './tools/log';

const translation = require('./middlewares/translation');
const auth = require('./middlewares/auth');
const dbNeeded = require('./middlewares/dbNeeded');

const settings: any = { errorFormat: 'pretty' };
// const settings: any = { errorFormat: 'pretty', log: ['query', 'info', 'warn'] };
const prisma = new PrismaClient(settings);

const app = express();
app.use(express.json());

app.use((req, res, next) => {
    process.env.NODE_ENV === 'development'
        ? console.log(`${req.method} ${req.url}`, { body: req.body })
        : console.log(`${req.method} ${req.url}`); // don't log the body in production to avoid leaking sensitive data
    next();
});

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');

    if (req.method === 'OPTIONS') res.sendStatus(200);
    else next();
});

app.get('/', (req, res) => { res.end(); });

app.use('/auth', translation, dbNeeded, require('./routes/auth'));
app.use('/users', translation, auth, dbNeeded, require('./routes/users'));
app.use('/players', translation, auth, dbNeeded, require('./routes/players'));
app.use('/playlists', translation, auth, dbNeeded, require('./routes/playlists'));
app.use('/rooms', translation, auth, dbNeeded, require('./routes/rooms'));
app.use('/search', translation, dbNeeded, require('./routes/search'));
app.use('/stream', translation, dbNeeded, require('./routes/stream'));
app.use('/request', translation, auth, require('./routes/request'));

app.use(translation, (req, res) => {
    new ErrLog(res.locals.lang.error.generic.routeNotFound, Log.CODE.NOT_FOUND).sendTo(res);
});

export { app, prisma };
