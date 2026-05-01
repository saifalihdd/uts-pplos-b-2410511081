import jwt from 'jsonwebtoken';
import 'dotenv/config';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret';

export default function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'Token tidak ditemukan.' });

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, ACCESS_SECRET);
    console.log('[JWT] payload:', payload);

    if (payload.type === 'refresh')
      return res.status(401).json({ success: false, message: 'Gunakan access token, bukan refresh token.' });

    req.user = payload;
    next();
  } catch (err) {
    console.log('[JWT] error:', err.message);
    console.log('[JWT] secret used:', ACCESS_SECRET);
    const message = err.name === 'TokenExpiredError'
      ? 'Access token expired. Gunakan refresh token.'
      : 'Token tidak valid.';
    return res.status(401).json({ success: false, message });
  }
}