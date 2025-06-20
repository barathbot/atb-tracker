import cookie from 'cookie';  // Add this line

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Set the Django API URL with fallback
    const DJANGO_API_URL = process.env.DJANGO_API_URL || 'http://localhost:8000';

    // Forward the request to Django backend
    const response = await fetch(`${DJANGO_API_URL}/api/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      // Set cookie with token (assuming Django returns { token: ... })
      const token = data.token;
      if (token) {
        const cookie = require('cookie');
        console.log('Token received:', data.token);  // Add this line
        res.setHeader('Set-Cookie', cookie.serialize('token', data.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 60 * 24 * 7, // 1 week
          sameSite: 'strict',  // More secure than 'lax'
          path: '/',
        }));
        return res.status(200).json({ success: true });
      } else {
        return res.status(401).json({ error: 'No token received from backend' });
      }
    } else {
      res.status(response.status).json(data);
    }

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}