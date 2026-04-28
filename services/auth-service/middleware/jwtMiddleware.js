const tokenSvc = require('../services/tokenService');

async function jwtMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'Token tidak ditemukan.' });

  const token = authHeader.slice(7);

  try {
    if (await tokenSvc.isBlacklisted(token))
      return res.status(401).json({ success: false, message: 'Token sudah tidak valid (sudah logout).' });

    const payload  = tokenSvc.verifyAccessToken(token);
    req.user       = payload;
    req.token      = token;
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError'
      ? 'Access token expired. Gunakan refresh token.'
      : 'Token tidak valid.';
    return res.status(401).json({ success: false, message: msg });
  }
}

module.exports = { jwtMiddleware };