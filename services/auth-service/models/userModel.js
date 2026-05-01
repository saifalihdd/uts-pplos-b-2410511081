const pool = require('../config/database');

class User {
  static async findByEmail(email) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await pool.execute('SELECT id, name, email, avatar, role, oauth_provider, created_at FROM users WHERE id = ?', [id]);
    return rows[0];
  }

  static async findByIdWithPassword(id) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
  }

  static async findByOAuth(provider, oauthId) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE oauth_provider = ? AND oauth_id = ? LIMIT 1', [provider, String(oauthId)]);
    return rows[0];
  }

  static async create(userData) {
    const { name, email, password, oauth_provider = null, oauth_id = null, avatar = null, role = 'user' } = userData;
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, oauth_provider, oauth_id, avatar, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, password, oauth_provider, oauth_id, avatar, role]
    );
    return result.insertId;
  }

  static async updateOAuthProfile(id, provider, oauthId, avatar) {
    await pool.execute(
      'UPDATE users SET oauth_provider = ?, oauth_id = ?, avatar = ? WHERE id = ?',
      [provider, String(oauthId), avatar, id]
    );
  }
}

module.exports = User;