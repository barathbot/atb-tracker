import prisma from '../../lib/prisma';
import cookie from 'cookie';

export default async function handler(req, res) {
  // Parse token from cookie
  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies.token;
  console.log("Token being sent to Django:", token);
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Call Django to verify token and get user info
  const DJANGO_API_URL = process.env.DJANGO_API_URL || 'http://localhost:8000';
  console.log("Token from cookie:", token);
  const verifyRes = await fetch(`${DJANGO_API_URL}/api/auth/verify/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });
  if (!verifyRes.ok) {
    return res.status(401).json({ error: 'Invalid session' });
  }
  const verifyData = await verifyRes.json();
  const userEmail = verifyData.user?.email;
  if (!userEmail) {
    return res.status(401).json({ error: 'User not found' });
  }
  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  if (req.method === 'GET') {
    // Fetch only the tasks for the logged-in user
    const tasks = await prisma.task.findMany({ where: { userId: user.id } });
    return res.json(tasks);
  }

  if (req.method === 'POST') {
    const { title } = req.body;
    const newTask = await prisma.task.create({
      data: {
        title,
        userId: user.id,
      },
    });
    return res.status(201).json(newTask);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
