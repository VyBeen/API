import express from 'express';
import * as controller from '../controllers/auth';

const router = express.Router();

router.get('/token', controller.askToken);
router.get('/register', controller.retreiveUser);

module.exports = router;
