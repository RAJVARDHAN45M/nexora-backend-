import mongoose from "mongoose";

// ✅ Step 1: Define Message Schema as a subdocument
const MessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true
    },
    content: {
      // Flexible field - can be string or object
      type: mongoose.Schema.Types.Mixed,
      required: true
      // For text: just a string
      // For images: { text: string, imageUrl: string }
    },
    isImage: {
      type: Boolean,
      default: false
    },
    isPublished: {
      type: Boolean,
      default: false
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true } // Each message gets its own _id
);

// ✅ Step 2: Define Chat Schema
const ChatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true  // ✅ Index for faster queries
    },
    userName: {
      type: String,
      required: true
    },
    name: {
      type: String,
      default: function() {
        return `Chat ${new Date().toLocaleDateString()}`;
      }
    },
    title: {
      type: String,
      default: 'New Chat'
      // Auto-generated from first message
    },
    messages: {
      type: [MessageSchema],
      default: [],
      validate: {
        validator: function(v) {
          return Array.isArray(v);
        },
        message: 'Messages must be an array'
      }
    },
    messageCount: {
      type: Number,
      default: 0
    },
    // ✅ NEW: Track last user message for preview
    lastMessage: {
      type: String,
      default: null
    },
    // ✅ NEW: For search/filter
    tags: {
      type: [String],
      default: []
    },
    // ✅ NEW: Chat status
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true, // createdAt, updatedAt auto-generated
    collection: 'chats'
  }
);

// ✅ Indexes for better performance
ChatSchema.index({ userId: 1, updatedAt: -1 }); // For getting user's chats sorted by time
ChatSchema.index({ userId: 1, createdAt: -1 }); // Alternative index

// ✅ Pre-save middleware to update messageCount and lastMessage
ChatSchema.pre('save', function(next) {
  try {
    // Update message count
    if (this.messages) {
      this.messageCount = this.messages.length;

      // Update last message for preview
      if (this.messages.length > 0) {
        const lastMsg = this.messages[this.messages.length - 1];
        if (typeof lastMsg.content === 'string') {
          this.lastMessage = lastMsg.content.substring(0, 100);
        } else if (lastMsg.content && lastMsg.content.text) {
          this.lastMessage = lastMsg.content.text.substring(0, 100);
        }
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

// ✅ Post-save middleware for logging
ChatSchema.post('save', function(doc) {
  console.log('✅ Chat saved:', {
    id: doc._id,
    userId: doc.userId,
    messageCount: doc.messageCount,
    updatedAt: doc.updatedAt
  });
});

// ✅ Instance methods
ChatSchema.methods.addMessage = function(role, content, isImage = false) {
  const message = {
    role,
    content,
    isImage,
    timestamp: new Date()
  };
  this.messages.push(message);
  return this.save();
};

ChatSchema.methods.clearMessages = function() {
  this.messages = [];
  this.messageCount = 0;
  this.lastMessage = null;
  return this.save();
};

ChatSchema.methods.getRecentMessages = function(limit = 10) {
  return this.messages.slice(-limit);
};

// ✅ Static methods
ChatSchema.statics.getUserChats = function(userId) {
  return this.find({ userId })
    .sort({ updatedAt: -1 })
    .select('_id name title messageCount lastMessage createdAt updatedAt');
};

ChatSchema.statics.getUserChatById = function(userId, chatId) {
  return this.findOne({ 
    _id: chatId, 
    userId 
  });
};

ChatSchema.statics.createNewChat = function(userId, userName) {
  return this.create({
    userId,
    userName,
    messages: [],
    messageCount: 0
  });
};

// ✅ Query helpers
ChatSchema.query.byUser = function(userId) {
  return this.find({ userId });
};

ChatSchema.query.active = function() {
  return this.find({ isActive: true });
};

// ✅ Create model
const Chat = mongoose.model('Chat', ChatSchema);

export default Chat;
