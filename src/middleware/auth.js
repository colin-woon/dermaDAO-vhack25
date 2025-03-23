import jwt from 'jsonwebtoken';

export async function auth(req, res) {
	try {
		const authHeader = req.headers.authorization;
		if (!authHeader?.startsWith('Bearer ')) {
			throw new Error('No token provided');
		}

		const token = authHeader.split(' ')[1];
		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		req.user = decoded;
		return decoded;
	} catch (error) {
		console.error('Auth error:', error);
		res.status(401).json({ message: 'Unauthorized' });
		throw error;
	}
}

export function authorize(roles = []) {
	return async (req, res) => {
		try {
			const user = await auth(req, res);

			if (!roles.includes(user.role)) {
				res.status(403).json({ message: 'Forbidden' });
				throw new Error('Insufficient permissions');
			}

			return user;
		} catch (error) {
			throw error;
		}
	};
}
