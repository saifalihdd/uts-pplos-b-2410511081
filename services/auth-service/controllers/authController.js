const bcrypt    = require('bcryptjs');
const pool      = require('../config/database');
const tokenSvc  = require('../services/tokenService');

// POST /api/auth/register

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  // 422 — field tidak lengkap
  if (!name || !email || !password)
    return res.status(422).json({ success: false, message: 'name, email, password wajib diisi.', errors: { name: !name ? ['name wajib diisi'] : [], email: !email ? ['email wajib diisi'] : [], password: !password ? ['password wajib diisi'] : [] } });

  // 422 — format email salah
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(422).json({ success: false, message: 'Validasi gagal.', errors: { email: ['Format email tidak valid.'] } });

  // 422 — password terlalu pendek
  if (password.length < 8)
    return res.status(422).json({ success: false, message: 'Validasi gagal.', errors: { password: ['Password minimal 8 karakter.'] } });

  try {
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);

    // 409 — email duplikat
    if (existing.length > 0)
      return res.status(409).json({ success: false, message: 'Email sudah terdaftar.' });

    const hashed   = await bcrypt.hash(password, 12);
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashed, 'user']
    );

    const user         = { id: result.insertId, name, email, role: 'user', avatar: null, oauth_provider: null };
    const accessToken  = tokenSvc.generateAccessToken(user);
    const refreshToken = tokenSvc.generateRefreshToken(user);

    await tokenSvc.saveRefreshToken(user.id, refreshToken, req);

    // 201 — created
    return res.status(201).json({
      success: true,
      message: 'Registrasi berhasil.',
      data: { user, access_token: accessToken, refresh_token: refreshToken, token_type: 'Bearer' },
    });
  } catch (err) {
    console.error('[register]', err);
    // 500 — server error
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// POST /api/auth/login

exports.login = async (req, res) => {
  const { email, password } = req.body;

  // 422 — field kosong
  if (!email || !password)
    return res.status(422).json({ success: false, message: 'Validasi gagal.', errors: { email: !email ? ['email wajib diisi'] : [], password: !password ? ['password wajib diisi'] : [] } });

  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);

    // 401 — email tidak ditemukan atau password salah (jangan bedain pesannya, security)
    if (rows.length === 0 || !(await bcrypt.compare(password, rows[0].password)))
      return res.status(401).json({ success: false, message: 'Email atau password salah.' });

    const user         = rows[0];
    const accessToken  = tokenSvc.generateAccessToken(user);
    const refreshToken = tokenSvc.generateRefreshToken(user);

    await tokenSvc.saveRefreshToken(user.id, refreshToken, req);

    // 200 — ok
    return res.status(200).json({
      success: true,
      message: 'Login berhasil.',
      data: {
        user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar, role: user.role, oauth_provider: user.oauth_provider },
        access_token: accessToken, refresh_token: refreshToken, token_type: 'Bearer',
      },
    });
  } catch (err) {
    console.error('[login]', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// POST /api/auth/refresh

exports.refresh = async (req, res) => {
  const { refresh_token } = req.body;

  // 422 — field kosong
  if (!refresh_token)
    return res.status(422).json({ success: false, message: 'Validasi gagal.', errors: { refresh_token: ['refresh_token wajib diisi.'] } });

  try {
    const payload = tokenSvc.verifyRefreshToken(refresh_token);

    // 400 — bukan refresh token
    if (payload.type !== 'refresh')
      return res.status(400).json({ success: false, message: 'Token bukan refresh token.' });

    const valid = await tokenSvc.isRefreshTokenValid(refresh_token);

    // 401 — sudah dipakai atau di-revoke
    if (!valid)
      return res.status(401).json({ success: false, message: 'Refresh token tidak valid atau sudah dipakai.' });

    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [payload.sub]);
    if (rows.length === 0)
      return res.status(401).json({ success: false, message: 'User tidak ditemukan.' });

    const user = rows[0];
    await tokenSvc.revokeRefreshToken(refresh_token);

    const newAccess  = tokenSvc.generateAccessToken(user);
    const newRefresh = tokenSvc.generateRefreshToken(user);
    await tokenSvc.saveRefreshToken(user.id, newRefresh, req);

    // 200 — ok
    return res.status(200).json({
      success: true,
      message: 'Token berhasil diperbarui.',
      data: { access_token: newAccess, refresh_token: newRefresh, token_type: 'Bearer' },
    });
  } catch (err) {
    // 401 — token expired atau invalid signature
    return res.status(401).json({ success: false, message: 'Refresh token tidak valid atau expired.' });
  }
};

// POST /api/auth/logout

exports.logout = async (req, res) => {
  const { refresh_token } = req.body;

  try {
    const exp = new Date(req.user.exp * 1000).toISOString().slice(0, 19).replace('T', ' ');
    await tokenSvc.blacklistToken(req.user.sub, req.token, exp);

    if (refresh_token)
      await tokenSvc.revokeRefreshToken(refresh_token);

    // 200 — ok
    return res.status(200).json({ success: true, message: 'Logout berhasil.' });
  } catch (err) {
    console.error('[logout]', err);
    // 500
    return res.status(500).json({ success: false, message: 'Gagal logout.' });
  }
};

// GET /api/auth/me

exports.me = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, avatar, role, oauth_provider, created_at FROM users WHERE id = ?',
      [req.user.sub]
    );

    // 404 — user tidak ada (edge case: dihapus setelah login)
    if (rows.length === 0)
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });

    // 200 — ok
    return res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[me]', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};