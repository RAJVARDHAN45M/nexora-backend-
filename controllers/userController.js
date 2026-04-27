import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Generate JWT token
const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn: '30d'});
}

// API to register user
export const registerUser = async (req, res) => {
    const {name, email, password} = req.body;
    try {
        const existingUser = await User.findOne({email});
        if(existingUser) {
            return res.status(400).json({success: false, message: 'User already exists'});
        }

        const user = await User.create({name, email, password});
        const token = generateToken(user._id);
        res.status(201).json({success: true, user, token});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
}

// API to login user
export const loginUser = async (req, res) => {
    const {email, password} = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({success: false, message: 'Please provide email and password'});
        }

        const user = await User.findOne({email});
        if(!user) {
            return res.status(401).json({success: false, message: 'Invalid credentials'});
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) {
            return res.status(401).json({success: false, message: 'Invalid credentials'});
        }
        
        const token = generateToken(user._id);
        res.status(200).json({success: true, user, token});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
}

// API to get user data
export const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.status(200).json({success: true, user});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
}
