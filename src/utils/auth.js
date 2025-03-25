import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
};

export const generateToken = (payload) => {
    try {
        return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
    } catch (error) {
        console.error('Token generation failed:', error);
        throw new Error('Failed to generate token');
    }
};
