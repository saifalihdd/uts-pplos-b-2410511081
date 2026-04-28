const axios    = require('axios');
const bcrypt   = require('bcryptjs');
const pool     = require('../config/database');
const tokenSvc = require('../services/tokenService');

exports.redirectToGitHub = (req, res) => {
  const params = new URLSearchParams({
    client_id:    process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.GITHUB_REDIRECT_URI,
    scope:        'user:email read:user',
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
};

exports.handleGitHubCallback = async (req, res) => {
  const { code, error } = req.query;

  if (error || !code) {
    return res.status(400).json({
      success: false,
      message: 'GitHub OAuth ditolak atau code tidak ada.',
    });
  }

  try {
    const tokenRes = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id:     process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri:  process.env.GITHUB_REDIRECT_URI,
      },
      { headers: { Accept: 'application/json' } }
    );

    const githubAccessToken = tokenRes.data.access_token;
    if (!githubAccessToken) {
      return res.status(400).json({
        success: false,
        message: 'Gagal mendapatkan access token dari GitHub.',
      });
    }

    const [profileRes, emailsRes] = await Promise.all([
      axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${githubAccessToken}` },
      }),
      axios.get('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${githubAccessToken}` },
      }),
    ]);

    const githubUser = profileRes.data;

    let email = githubUser.email;
    if (!email) {
      const primaryEmail = emailsRes.data.find(e => e.primary && e.verified);
      email = primaryEmail?.email || null;
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Tidak bisa mendapatkan email dari GitHub. Pastikan email sudah diverifikasi.',
      });
    }

    let [rows] = await pool.execute(
      'SELECT * FROM users WHERE oauth_provider = ? AND oauth_id = ? LIMIT 1',
      ['github', String(githubUser.id)]
    );

    let user = rows[0];

    if (!user) {
      [rows] = await pool.execute(
        'SELECT * FROM users WHERE email = ? LIMIT 1',
        [email]
      );
      user = rows[0];
    }

    if (!user) {
      const randomPass = await bcrypt.hash(Math.random().toString(36), 12);
      const [result]   = await pool.execute(
        `INSERT INTO users (name, email, password, oauth_provider, oauth_id, avatar, role)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          githubUser.name || githubUser.login,
          email,
          randomPass,
          'github',
          String(githubUser.id),
          githubUser.avatar_url,
          'user',
        ]
      );
      user = {
        id: result.insertId,
        name: githubUser.name || githubUser.login,
        email,
        avatar: githubUser.avatar_url,
        role: 'user',
        oauth_provider: 'github',
      };
    } else {
      await pool.execute(
        `UPDATE users SET oauth_provider = ?, oauth_id = ?, avatar = ? WHERE id = ?`,
        ['github', String(githubUser.id), githubUser.avatar_url, user.id]
      );
      user.oauth_provider = 'github';
      user.avatar         = githubUser.avatar_url;
    }

    const accessToken  = tokenSvc.generateAccessToken(user);
    const refreshToken = tokenSvc.generateRefreshToken(user);

    await tokenSvc.saveRefreshToken(user.id, refreshToken, req);

    return res.status(200).json({
      success: true,
      message: 'Login via GitHub berhasil.',
      data: {
        user: {
          id:             user.id,
          name:           user.name,
          email:          user.email,
          avatar:         user.avatar,
          role:           user.role,
          oauth_provider: user.oauth_provider,
        },
        access_token:  accessToken,
        refresh_token: refreshToken,
        token_type:    'Bearer',
      },
    });

  } catch (err) {
    console.error('[OAuth GitHub]', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error saat OAuth.' });
  }
};