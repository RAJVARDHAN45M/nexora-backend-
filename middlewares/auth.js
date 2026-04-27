import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
    try {
        let token = req.headers.authorization;
        
        if (!token) {
            return res.status(401).json({success: false, message: 'No token provided'});
        }

        // Remove "Bearer " prefix if present
        if (token.startsWith('Bearer ')) {
            token = token.slice(7);
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        const user = await User.findById(userId).select('-password');
        
        if(!user) {
            return res.status(401).json({success: false, message: 'Unauthorized'});
        }
        
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({success: false, message: 'Invalid token'});
    }
}
