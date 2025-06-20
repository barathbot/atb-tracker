// Use dynamic import if standard import fails
let cookie;
try {
  cookie = require('cookie');
} catch (e) {
  cookie = (await import('cookie')).default;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse cookies safely
    const cookies = cookie.parse(req.headers?.cookie || '');
    const token = cookies?.token;
    
    console.log('Cookies:', cookies);
    console.log('Token:', token);

    if (!token) {
      return res.status(401).json({ error: 'Missing token', availableCookies: Object.keys(cookies) });
    }

    const verifyRes = await fetch(`${process.env.DJANGO_API_URL || 'http://localhost:8000'}/api/auth/verify/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });

    return res.status(verifyRes.status).json(await verifyRes.json());

  } catch (error) {
    console.error('Full error:', error);
    return res.status(500).json({ 
      error: 'Verification failed',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}