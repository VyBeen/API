import express from 'express';
import * as controller from '../controllers/request';

const router = express.Router();

router.get('/', controller.makeRequest);

module.exports = router;
