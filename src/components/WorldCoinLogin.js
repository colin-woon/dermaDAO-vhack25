import React, { useEffect } from 'react';
import { useRouter } from 'next/router';

const WorldcoinLogin = () => {
	const router = useRouter();

	// Handle the callback when user returns from WorldCoin
	useEffect(() => {
		// Check if we have a code in the URL
		const { code } = router.query;
		console.log('Current route:', router.asPath); // Add this line to log the current route
		console.log('Router query:', router.query);   // Add this line to log all query parameters
		console.log('WorldcoinLogin Component');
		console.log('Code:', code);
		if (code) {
			// Process the authentication code
			handleAuthCode(code);
		}
	}, [router.query]);

	const handleAuthCode = async (code) => {
		const data = new URLSearchParams()
		data.append('code', code)
		data.append('grant_type', 'authorization_code')
		data.append('redirect_uri', process.env.NEXT_PUBLIC_REDIRECT_URI)
		console.log(data.toString());
		try {
			const response = await fetch('https://id.worldcoin.org/token', {
				method: 'POST',
				mode: 'no-cors',
				headers: {
					Authorization: `Basic ${btoa(`${process.env.NEXT_PUBLIC_WORLDCOIN_CLIENT_ID}:${process.env.WORLDCOIN_CLIENT_SECRET}`)}`,
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: data,
			})
			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
			}

			const result = await response.json();
			console.log("WorldID Auth Success:", JSON.stringify(result, null, 2));
			return result;
		} catch (error) {
			console.error("WorldID Auth Error:", error.message);
			throw error;
		}
	}

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
