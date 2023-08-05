import express from 'express';
import * as controller from '../controllers/playlists';

const router = express.Router();

router.get('/:id', controller.getPlaylist);
router.post('/:id/songs', controller.createSong);
router.get('/:id/:songId', controller.getSong);
router.patch('/:id/:songId', controller.moveSong);
router.delete('/:id/:songId', controller.removeSong);

module.exports = router;
