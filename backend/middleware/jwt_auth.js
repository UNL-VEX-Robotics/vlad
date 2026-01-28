import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET

export function generateJWT(res, user_id) {
  const token = jwt.sign({ id: user_id }, JWT_SECRET, { expiresIn: '1h' });
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 1000 // 1 hour in milliseconds
  });
}

export function authJWT(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Login Expired' });
  }
}