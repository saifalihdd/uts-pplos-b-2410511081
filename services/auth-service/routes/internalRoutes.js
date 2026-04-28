const express  = require('express');
const router   = express.Router();
const tokenSvc = require('../services/tokenService');

router.get('/validate-token', async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer '))
    return res.status(401).json({ message: 'No token' });

  const token = authHeader.slice(7);
  try {
    if (await tokenSvc.isBlacklisted(token))
      return res.status(401).json({ message: 'Token blacklisted' });

    const payload = tokenSvc.verifyAccessToken(token);
    if (payload.type === 'refresh')
      return res.status(401).json({ message: 'Cannot use refresh token' });

    return res.status(200)
      .set('X-User-Id',    String(payload.sub))
      .set('X-User-Email', payload.email)
      .json({ message: 'OK' });
  } catch {
    return res.status(401).json({ message: 'Token invalid or expired' });
  }
});

module.exports = router;