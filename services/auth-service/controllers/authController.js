const bcrypt   = require('bcryptjs');
const User     = require('../models/userModel');
const tokenSvc = require('../services/tokenService');

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(422).json({ success: false, message: 'name, email, password wajib diisi.', errors: { name: !name ? ['name wajib diisi'] : [], email: !email ? ['email wajib diisi'] : [], password: !password ? ['password wajib diisi'] : [] } });

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(422).json({ success: false, message: 'Validasi gagal.', errors: { email: ['Format email tidak valid.'] } });

  if (password.length < 8)
    return res.status(422).json({ success: false, message: 'Validasi gagal.', errors: { password: ['Password minimal 8 karakter.'] } });

  try {
    const existing = await User.findByEmail(email);

    if (existing)
      return res.status(409).json({ success: false, message: 'Email sudah terdaftar.' });

    const hashed   = await bcrypt.hash(password, 12);
    const insertId = await User.create({ name, email, password: hashed, role: 'user' });

    const user         = { id: insertId, name, email, role: 'user', avatar: null, oauth_provider: null };
    const accessToken  = tokenSvc.generateAccessToken(user);
    const refreshToken = tokenSvc.generateRefreshToken(user);

    await tokenSvc.saveRefreshToken(user.id, refreshToken, req);

    return res.status(201).json({
      success: true,
      message: 'Registrasi berhasil.',
      data: { user, access_token: accessToken, refresh_token: refreshToken, token_type: 'Bearer' },
    });
  } catch (err) {
    console.error('[register]', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(422).json({ success: false, message: 'Validasi gagal.', errors: { email: !email ? ['email wajib diisi'] : [], password: !password ? ['password wajib diisi'] : [] } });

  try {
    const user = await User.findByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ success: false, message: 'Email atau password salah.' });

    const accessToken  = tokenSvc.generateAccessToken(user);
    const refreshToken = tokenSvc.generateRefreshToken(user);

    await tokenSvc.saveRefreshToken(user.id, refreshToken, req);

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

exports.refresh = async (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token)
    return res.status(422).json({ success: false, message: 'Validasi gagal.', errors: { refresh_token: ['refresh_token wajib diisi.'] } });

  try {
    const payload = tokenSvc.verifyRefreshToken(refresh_token);

    if (payload.type !== 'refresh')
      return res.status(400).json({ success: false, message: 'Token bukan refresh token.' });

    const valid = await tokenSvc.isRefreshTokenValid(refresh_token);

    if (!valid)
      return res.status(401).json({ success: false, message: 'Refresh token tidak valid atau sudah dipakai.' });

    const user = await User.findByIdWithPassword(payload.sub);
    if (!user)
      return res.status(401).json({ success: false, message: 'User tidak ditemukan.' });

    await tokenSvc.revokeRefreshToken(refresh_token);

    const newAccess  = tokenSvc.generateAccessToken(user);
    const newRefresh = tokenSvc.generateRefreshToken(user);
    await tokenSvc.saveRefreshToken(user.id, newRefresh, req);

    return res.status(200).json({
      success: true,
      message: 'Token berhasil diperbarui.',
      data: { access_token: newAccess, refresh_token: newRefresh, token_type: 'Bearer' },
    });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Refresh token tidak valid atau expired.' });
  }
};

exports.logout = async (req, res) => {
  const { refresh_token } = req.body;

  try {
    const exp = new Date(req.user.exp * 1000).toISOString().slice(0, 19).replace('T', ' ');
    await tokenSvc.blacklistToken(req.user.sub, req.token, exp);

    if (refresh_token)
      await tokenSvc.revokeRefreshToken(refresh_token);

    return res.status(200).json({ success: true, message: 'Logout berhasil.' });
  } catch (err) {
    console.error('[logout]', err);
    return res.status(500).json({ success: false, message: 'Gagal logout.' });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.sub);

    if (!user)
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });

    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error('[me]', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};