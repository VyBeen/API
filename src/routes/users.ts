import express from 'express';
import * as controller from '../controllers/users';

const router = express.Router();

router.get('/events', controller.getUserEvents);
router.get('/:userId', controller.getUser);
router.delete('/:userId', controller.deleteUser);

module.exports = router;
