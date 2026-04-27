import Chat from "../models/Chat.js"
import axios from "axios"

// ✅ API Controller for creating a new chat
export const createChat = async (req, res) => {
    try {
        const userId = req.user._id;
        const userName = req.user.name || "Anonymous";

        console.log('✨ Creating new chat for user:', userId);

        const chatData = {
            userId,
            messages: [],
            name: `Chat ${new Date().toLocaleDateString()}`,
            userName: userName,
            messageCount: 0
        };

        const newChat = await Chat.create(chatData);

        console.log('✅ Chat created:', newChat._id);

        res.json({
            success: true,
            message: "Chat created successfully",
            chat: newChat
        });

    } catch (error) {
        console.error('❌ Error creating chat:', error.message);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to create chat"
        });
    }
}

// ✅ API controller for getting all chats
export const getUserChats = async (req, res) => {
    try {
        const userId = req.user._id;
        
        console.log('📂 Fetching all chats for user:', userId);
        
        const chats = await Chat.find({ userId, isActive: true })
            .sort({ updatedAt: -1 })
            .select('_id name title messageCount lastMessage createdAt updatedAt')
            .lean();
        
        console.log('✅ Found', chats.length, 'chats');
        
        res.json({
            success: true,
            chatCount: chats.length,
            chats: chats || []
        });
        
    } catch (error) {
        console.error('❌ Error fetching chats:', error.message);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch chats"
        });
    }
}

// ✅ API Controller for getting specific chat with all messages
export const getSpecificChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user._id;

        console.log('📂 Fetching specific chat:', chatId);
        console.log('   User ID:', userId);

        if (!chatId) {
            return res.status(400).json({
                success: false,
                message: "Chat ID is required"
            });
        }

        const chat = await Chat.findById(chatId);

        if (!chat) {
            console.error('❌ Chat not found:', chatId);
            return res.status(404).json({
                success: false,
                message: "Chat not found"
            });
        }

        if (chat.userId.toString() !== userId.toString()) {
            console.error('❌ Unauthorized access attempt');
            return res.status(403).json({
                success: false,
                message: "Unauthorized to access this chat"
            });
        }

        console.log('✅ Chat found with', chat.messages?.length || 0, 'messages');

        res.json({
            success: true,
            chat: {
                _id: chat._id,
                name: chat.name,
                title: chat.title,
                messages: chat.messages || [],
                messageCount: chat.messageCount,
                createdAt: chat.createdAt,
                updatedAt: chat.updatedAt
            }
        });

    } catch (error) {
        console.error('❌ Error fetching chat:', error.message);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch chat"
        });
    }
}

// ✅ API Controller for deleting a chat
export const deleteChat = async (req, res) => {
    try {
        const { chatId } = req.body;
        const userId = req.user._id;
        
        console.log('🗑️ Deleting chat:', chatId);
        console.log('   User ID:', userId);

        if (!chatId) {
            return res.status(400).json({
                success: false,
                message: "Chat ID is required"
            });
        }
        
        const deletedChat = await Chat.findOneAndDelete({ _id: chatId, userId });
        
        if (!deletedChat) {
            console.error('❌ Chat not found or unauthorized');
            return res.status(404).json({
                success: false,
                message: "Chat not found or unauthorized"
            });
        }
        
        console.log('✅ Chat deleted successfully');

        res.json({
            success: true,
            message: "Chat deleted successfully"
        });
        
    } catch (error) {
        console.error('❌ Error deleting chat:', error.message);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to delete chat"
        });
    }
}

// ✅ API Controller for clearing chat history
export const clearChatHistory = async (req, res) => {
    try {
        const { chatId } = req.body;
        const userId = req.user._id;

        console.log('🗑️ Clearing chat history:', chatId);
        console.log('   User ID:', userId);

        if (!chatId) {
            return res.status(400).json({
                success: false,
                message: "Chat ID is required"
            });
        }

        const chat = await Chat.findById(chatId);

        if (!chat) {
            console.error('❌ Chat not found:', chatId);
            return res.status(404).json({
                success: false,
                message: "Chat not found"
            });
        }

        if (chat.userId.toString() !== userId.toString()) {
            console.error('❌ Unauthorized access attempt');
            return res.status(403).json({
                success: false,
                message: "Unauthorized to clear this chat"
            });
        }

        // Use the model method
        const clearedChat = await chat.clearMessages();

        console.log('✅ Chat history cleared');

        res.json({
            success: true,
            message: "Chat history cleared successfully",
            chat: {
                _id: clearedChat._id,
                messages: clearedChat.messages,
                messageCount: clearedChat.messageCount
            }
        });

    } catch (error) {
        console.error('❌ Error clearing chat:', error.message);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to clear chat history"
        });
    }
}

// ✅ API Controller for saving chat messages
export const saveChat = async (req, res) => {
    try {
        const { chatId, messages } = req.body;
        const userId = req.user._id;

        console.log('💾 Saving chat:', chatId);
        console.log('   User ID:', userId);
        console.log('   Messages count:', messages?.length || 0);

        // Validation
        if (!chatId) {
            return res.status(400).json({
                success: false,
                message: "Chat ID is required"
            });
        }

        if (!Array.isArray(messages)) {
            return res.status(400).json({
                success: false,
                message: "Messages must be an array"
            });
        }

        const chat = await Chat.findById(chatId);

        if (!chat) {
            console.error('❌ Chat not found:', chatId);
            return res.status(404).json({
                success: false,
                message: "Chat not found"
            });
        }

        if (chat.userId.toString() !== userId.toString()) {
            console.error('❌ Unauthorized access attempt');
            return res.status(403).json({
                success: false,
                message: "Unauthorized to save this chat"
            });
        }

        // Update chat with new messages
        chat.messages = messages;
        chat.messageCount = messages.length;

        // Update last message for preview
        if (messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            if (typeof lastMsg.content === 'string') {
                chat.lastMessage = lastMsg.content.substring(0, 100);
            } else if (lastMsg.content && lastMsg.content.text) {
                chat.lastMessage = lastMsg.content.text.substring(0, 100);
            }
        }

        const updatedChat = await chat.save();

        console.log('✅ Chat saved successfully');
        console.log('   Total messages:', updatedChat.messageCount);

        res.json({
            success: true,
            message: "Chat saved successfully",
            chat: {
                _id: updatedChat._id,
                messageCount: updatedChat.messageCount,
                lastMessage: updatedChat.lastMessage,
                updatedAt: updatedChat.updatedAt
            }
        });

    } catch (error) {
        console.error('❌ Error saving chat:', error.message);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to save chat"
        });
    }
}

// ✅ API Controller for sending message via Gemini API
export const sendMessage = async (req, res) => {
    try {
        const { prompt, messages, mode } = req.body;
        const userId = req.user._id;

        console.log('📡 Backend proxying Gemini request...');
        console.log('   Mode:', mode);
        console.log('   Prompt:', prompt.substring(0, 50) + '...');
        console.log('   Previous messages:', messages?.length || 0);

        // Validation
        if (!prompt) {
            return res.status(400).json({
                success: false,
                message: "Prompt is required"
            });
        }

        if (!process.env.GEMINI_API_KEY) {
            console.error('❌ GEMINI_API_KEY not configured');
            return res.status(500).json({
                success: false,
                message: "API key not configured"
            });
        }

        // Build messages array
        const messagesForAPI = [];

        // Add system prompt
        const systemPrompt = mode === 'image'
            ? `You are an expert image analysis AI assistant. Describe images in detailed, structured ways. Identify objects, text, people, and scenes. Analyze composition and colors.`
            : `You are a helpful, accurate, and intelligent AI assistant. Provide clear, concise, and well-structured responses. Explain concepts in simple terms with examples.`;

        messagesForAPI.push({
            role: 'system',
            content: systemPrompt
        });

        // Add previous messages (last 5 for context)
        if (messages && messages.length > 0) {
            const recentMessages = messages.slice(-5);
            recentMessages.forEach(msg => {
                messagesForAPI.push({
                    role: msg.role,
                    content: typeof msg.content === 'string' ? msg.content : msg.content.text || msg.content
                });
            });
        }

        // Add current prompt
        messagesForAPI.push({
            role: 'user',
            content: prompt
        });

        const temperature = mode === 'text' ? 0.5 : 0.7;
        const maxOutputTokens = mode === 'image' ? 1500 : 1000;

        console.log('🔄 Calling Gemini API from backend...');

        // Call Gemini API
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                contents: [
                    {
                        parts: messagesForAPI.map(msg => ({
                            text: msg.content
                        }))
                    }
                ],
                generationConfig: {
                    temperature: temperature,
                    maxOutputTokens: maxOutputTokens,
                    topP: 0.95
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        console.log('✅ Gemini response received');

        // Validate response
        if (!response.data.candidates || !response.data.candidates[0] || !response.data.candidates[0].content) {
            throw new Error('Invalid API response format');
        }

        const aiReply = response.data.candidates[0].content.parts[0].text;

        console.log('✅ AI reply processed:', aiReply.length, 'characters');

        res.json({
            success: true,
            reply: {
                role: 'assistant',
                content: aiReply,
                timestamp: Date.now(),
                isImage: false
            }
        });

    } catch (error) {
        console.error('❌ Backend API Error:', error.message);

        if (error.response?.status === 429) {
            return res.status(429).json({
                success: false,
                message: 'Rate limited by Gemini API. Please wait before trying again.'
            });
        }

        if (error.code === 'ECONNABORTED') {
            return res.status(504).json({
                success: false,
                message: 'Gemini API request timeout. Please try again.'
            });
        }

        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get response from AI'
        });
    }
}
