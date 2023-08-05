import express from 'express';
import * as controller from '../controllers/stream';

const router = express.Router();

router.post('/', controller.makeStream);
router.get('/', controller.getStream);

module.exports = router;
