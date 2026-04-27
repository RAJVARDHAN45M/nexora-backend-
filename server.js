import express from "express";
import "dotenv/config";
import cors from "cors";
import connectDB from "./configs/db.js";
import userRouter from "./routes/userRoutes.js";
import chatRouter from "./routes/chatRoutes.js";

const app = express();

// ✅ Middlewares (must come before routes)
app.use(cors({
  origin: function (origin, callback) {
    callback(null, true);
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Log environment variables (for debugging)
console.log('🔧 Environment Variables:');
console.log('   PORT:', process.env.PORT || 3000);
console.log('   MONGO_URI:', process.env.MONGO_URI ? '✅ Configured' : '❌ Not configured');
console.log('   GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Not configured');

// ✅ Connect to MongoDB
try {
  await connectDB();
  console.log('✅ MongoDB connected successfully');
} catch (error) {
  console.error('❌ MongoDB connection error:', error.message);
}

// ✅ Test route
app.get("/", (req, res) => {
  res.json({ 
    success: true,
    message: "Server is live!" 
  });
});

// ✅ Test route to verify all routes are registered
app.get("/api/test", (req, res) => {
  res.json({ 
    success: true,
    message: "API test successful",
    routes: [
      "GET  /api/user/get",
      "POST /api/user/login",
      "POST /api/chat/create",
      "POST /api/chat/save",
      "POST /api/chat/delete",
      "POST /api/chat/clear",
      "GET  /api/chat/get",
      "GET  /api/chat/:chatId"
    ]
  });
});

// ✅ API routes
app.use("/api/user", userRouter);
app.use("/api/chat", chatRouter);

// ✅ 404 handler
app.use((req, res) => {
  console.error(`❌ Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ 
    success: false, 
    message: `Route ${req.method} ${req.path} not found`
  });
});

// ✅ Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({ 
    success: false, 
    message: err.message || 'Internal server error'
  });
});

// ✅ Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('\n📡 Available Routes:');
  console.log('   GET  / - Server status');
  console.log('   GET  /api/test - Test all routes');
  console.log('   POST /api/chat/save - Save chat messages');
  console.log('\n✨ Server ready!\n');
});

export default app;
