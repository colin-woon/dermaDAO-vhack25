export default async function handler(req, res) {
  // Get the authorization code from the query parameters
  const { code } = req.query;

  try {
    // Exchange the code for tokens
    const tokenResponse = await fetch('https://id.worldcoin.org/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: process.env.NEXT_PUBLIC_WORLDCOIN_CLIENT_ID,
        client_secret: process.env.WORLDCOIN_CLIENT_SECRET,
        redirect_uri: process.env.NEXT_PUBLIC_REDIRECT_URI,
      }),
    });

    const tokens = await tokenResponse.json();
    
    // Store tokens in session or secure cookie
    // ...

    res.redirect('/'); // Redirect to your app's dashboard
  } catch (error) {
    console.error('Token exchange error:', error);
    res.redirect('/error');
  }
}