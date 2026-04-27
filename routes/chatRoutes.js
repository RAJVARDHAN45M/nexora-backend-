import express from "express";
import {
  createChat,
  deleteChat,
  getUserChats,
  getSpecificChat,
  clearChatHistory,
  saveChat,           // ✅ ADD THIS
  sendMessage
} from "../controllers/chatController.js";
import { protect } from "../middlewares/auth.js";

const chatRouter = express.Router();

// ✅ Get all chats for user
chatRouter.get('/get', protect, getUserChats);

// ✅ Get specific chat with all messages
chatRouter.get('/:chatId', protect, getSpecificChat);

// ✅ Create new chat
chatRouter.post('/create', protect, createChat);

// ✅ Delete entire chat
chatRouter.post('/delete', protect, deleteChat);

// ✅ Clear chat history (keep chat, remove messages)
chatRouter.post('/clear', protect, clearChatHistory);

// ✅ Save chat messages (THIS WAS MISSING!)
chatRouter.post('/save', protect, saveChat);

// ✅ Send message (Gemini API proxy)
chatRouter.post('/message', protect, sendMessage);

export default chatRouter;
