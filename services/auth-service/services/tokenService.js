const jwt  = require('jsonwebtoken');
const pool = require('../config/database');

const ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET  || 'access-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret';

function generateAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name, role: user.role },
    ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { sub: user.id, type: 'refresh' },
    REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

async function isBlacklisted(token) {
  const [rows] = await pool.execute(
    'SELECT id FROM token_blacklists WHERE token = ? AND expires_at > NOW() LIMIT 1',
    [token]
  );
  return rows.length > 0;
}

async function blacklistToken(userId, token, expiresAt) {
  await pool.execute(
    'INSERT INTO token_blacklists (user_id, token, expires_at) VALUES (?, ?, ?)',
    [userId, token, expiresAt]
  );
}

async function saveRefreshToken(userId, token, req) {
  const payload    = verifyRefreshToken(token);
  const expiresAt  = new Date(payload.exp * 1000).toISOString().slice(0, 19).replace('T', ' ');
  const deviceInfo = req?.headers?.['user-agent']?.slice(0, 255) || null;
  const ipAddress  = req?.ip || req?.headers?.['x-forwarded-for'] || null;

  await pool.execute(
    `INSERT INTO refresh_tokens (user_id, token, device_info, ip_address, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, token, deviceInfo, ipAddress, expiresAt]
  );
}

async function isRefreshTokenValid(token) {
  const [rows] = await pool.execute(
    `SELECT id FROM refresh_tokens
     WHERE token = ?
       AND revoked_at IS NULL
       AND expires_at > NOW()
     LIMIT 1`,
    [token]
  );
  return rows.length > 0;
}

async function revokeRefreshToken(token) {
  await pool.execute(
    `UPDATE refresh_tokens SET revoked_at = NOW() WHERE token = ?`,
    [token]
  );
}

module.exports = {
  generateAccessToken,  generateRefreshToken,
  verifyAccessToken,    verifyRefreshToken,
  isBlacklisted,        blacklistToken,
  saveRefreshToken,     isRefreshTokenValid,
  revokeRefreshToken,   revokeAllRefreshTokens,
  getActiveSessions,
};