import express from 'express';
import * as controller from '../controllers/players';

const router = express.Router();

router.get('/:id', controller.getPlayer);
router.post('/:id/play', controller.playPlayer);
router.post('/:id/pause', controller.pausePlayer);
router.post('/:id/change', controller.changePlayer);
router.post('/:id/next', controller.nextPlayer);
router.post('/:id/prev', controller.prevPlayer);
router.post('/:id/move', controller.movePlayer);

module.exports = router;
