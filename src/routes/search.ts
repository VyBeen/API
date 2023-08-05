import express from 'express';
import * as controller from '../controllers/search';

const router = express.Router();

router.get('/song', controller.searchSong);

module.exports = router;
