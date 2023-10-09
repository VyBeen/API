import express from 'express';
import * as controller from '../controllers/rooms';

const router = express.Router();

router.post('/', controller.createRoom);
router.get('/:id', controller.getRoom);
router.patch('/:id', controller.updateRoom);
router.get('/:id/users', controller.getRoomUsers);
router.post('/:id', controller.joinRoom);
router.delete('/:id/:userId', controller.kickUser);
router.delete('/:id', controller.leaveRoom);

module.exports = router;
