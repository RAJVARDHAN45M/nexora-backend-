import express from 'express';
import {protect} from '../middlewares/auth.js';
import {imageMessageController, textMessageController, getPublishedImages} from '../controllers/messageController.js';

const messageRouter = express.Router();

messageRouter.post('/text', protect, textMessageController);
messageRouter.post('/image', protect, imageMessageController);
messageRouter.get('/published-images', getPublishedImages);

export default messageRouter;
