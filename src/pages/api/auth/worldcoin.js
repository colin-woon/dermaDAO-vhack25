export default async function handler(req, res) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	const { code } = req.body;
	const data = new URLSearchParams();
	data.append('code', code);
	data.append('grant_type', 'authorization_code');
	data.append('redirect_uri', process.env.NEXT_PUBLIC_REDIRECT_URI);

	try {
		// First API call to get the access token
		const tokenResponse = await fetch('https://id.worldcoin.org/token', {
			method: 'POST',
			headers: {
				'Authorization': `Basic ${Buffer.from(`${process.env.NEXT_PUBLIC_WORLDCOIN_CLIENT_ID}:${process.env.WORLDCOIN_CLIENT_SECRET}`).toString('base64')}`,
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: data,
		});

		const tokenResult = await tokenResponse.json();

		if (!tokenResponse.ok) {
			throw new Error(`Token error: ${JSON.stringify(tokenResult)}`);
		}

		// Second API call to get user info using the access token
		const userInfoResponse = await fetch('https://id.worldcoin.org/userinfo', {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${tokenResult.access_token}`,
			},
		});

		const userInfo = await userInfoResponse.json();

		// Return both token and user info
		return res.status(200).json({
			token: tokenResult,
			userInfo: userInfo
		});

	} catch (error) {
		console.error('WorldID Auth Error:', error);
		return res.status(500).json({ error: error.message });
	}
}
