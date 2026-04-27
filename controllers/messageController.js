import Chat from "../models/Chat.js"
import User from "../models/User.js"
import axios from "axios"
import imagekit from "../configs/imageKit.js"
import openai from "../configs/openai.js"

// Text-based AI Chat Message Controller
export const textMessageController = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Check credits
        if(req.user.credits < 1){
            return res.json({success: false, message: "You don't have enough credits"});
        }

        const {chatId, prompt} = req.body;

        if (!chatId || !prompt) {
            return res.json({success: false, message: "Missing chatId or prompt"});
        }

        const chat = await Chat.findOne({userId, _id: chatId});
        
        if (!chat) {
            return res.json({success: false, message: "Chat not found"});
        }
        
        // Add user message
        chat.messages.push({
            role: "user", 
            content: prompt, 
            timestamp: Date.now(),
            isImage: false
        });

        // Get AI response
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ]
        });

        const reply = {
            role: "assistant",
            content: response.choices[0].message.content,
            timestamp: Date.now(),
            isImage: false
        };
        
        res.json({success: true, reply});
        
        chat.messages.push(reply);
        await chat.save();
        await User.updateOne({_id: userId}, {$inc: {credits: -1}});

    } catch (error) {
        res.json({success: false, message: error.message});
    }
}

// IMAGE GENERATION MESSAGE CONTROLLER
export const imageMessageController = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Check credits
        if(req.user.credits < 2){ 
            return res.json({success: false, message: "You don't have enough credits to use this feature"});
        } 
        
        const {prompt, chatId, published} = req.body;

        if (!chatId || !prompt) {
            return res.json({success: false, message: "Missing chatId or prompt"});
        }
        
        // Find chat
        const chat = await Chat.findOne({userId, _id: chatId});
        
        if (!chat) {
            return res.json({success: false, message: "Chat not found"});
        }
        
        // Push user message
        chat.messages.push({
            role: "user",
            content: prompt, 
            timestamp: Date.now(),  
            isImage: false
        });
        
        // Encode the prompt
        const encodedPrompt = encodeURIComponent(prompt);
        
        // Construct ImageKit AI generation URL
        const generatedImageUrl = `${process.env.IMAGEKIT_URL_ENDPOINT}/ik-ai-img:prompt-${encodedPrompt}/Nexora_GPT_0/${Date.now()}.png?tr=w-800,h-800`;
        
        const aiImageResponse = await axios.get(generatedImageUrl, {responseType: "arraybuffer"});
        
        // Convert to Base64
        const base64Image = `data:image/png;base64,${Buffer.from(aiImageResponse.data, "binary").toString('base64')}`;
        
        // Upload to ImageKit Media Library
        const uploadResponse = await imagekit.upload({
            file: base64Image,
            fileName: `${Date.now()}.png`,
            folder: "Nexora_GPT_0"
        });
        
        const reply = {
            role: 'assistant',
            content: uploadResponse.url,
            timestamp: Date.now(),
            isImage: true,
            isPublished: published
        };
        
        res.json({success: true, reply});
        
        chat.messages.push(reply);
        await chat.save();
        
        await User.updateOne({_id: userId}, {$inc: {credits: -2}});
        
    } catch(error){ 
        res.json({success: false, message: error.message});
    }
}

// API to get published images
export const getPublishedImages = async (req, res) => {
    try {
        const publishedImageMessages = await Chat.aggregate([
            {$unwind: "$messages"},
            {
                $match: {
                    "messages.isImage": true,
                    "messages.isPublished": true
                }
            },
            {
                $project: {
                    _id: 0,
                    imageUrl: "$messages.content",
                    userName: "$userName"
                }
            }
        ]);
        
        res.json({success: true, images: publishedImageMessages.reverse()});

    } catch (error) {
        res.json({success: false, message: error.message});
    }
}
