import React, { useEffect } from 'react';
import { useRouter } from 'next/router';

const WorldcoinLogin = () => {
	const router = useRouter();

	// Handle the callback when user returns from WorldCoin
	useEffect(() => {
		// Check if we have a code in the URL
		const { code } = router.query;
		console.log('Code:', code);
		if (code) {
			// Process the authentication code
			handleAuthCode(code);
		}
	}, [router.query]);

	const handleAuthCode = async (code) => {
		try {
			const response = await fetch(`/api/auth/callback?code=${code}`);
			const data = await response.json();
			console.log('Authentication successful:', data);
		} catch (error) {
			console.error('Authentication error:', error);
		}
	};

	const handleWorldcoinLogin = () => {
		const params = new URLSearchParams({
			redirect_uri: process.env.NEXT_PUBLIC_REDIRECT_URI,
			response_type: 'code',
			scope: 'openid profile email',
			client_id: process.env.NEXT_PUBLIC_WORLDCOIN_CLIENT_ID,
		});

		const authUrl = `https://id.worldcoin.org/authorize?${params.toString()}`;
		window.location.href = authUrl;
	};

	return (
		<button
			onClick={handleWorldcoinLogin}
			className="btn btn-active btn-primary"
		>
			Login with Worldcoin
		</button>
	);
};

export default WorldcoinLogin;
