require('dotenv').config();
const pool = require('./config/database');

async function migrate() {
  const conn = await pool.getConnection();
  try {
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name             VARCHAR(255) NOT NULL,
        email            VARCHAR(255) NOT NULL UNIQUE,
        password         VARCHAR(255) NOT NULL,
        oauth_provider   VARCHAR(50)  DEFAULT NULL COMMENT 'github',
        oauth_id         VARCHAR(255) DEFAULT NULL,
        avatar           VARCHAR(500) DEFAULT NULL,
        role             ENUM('user','admin','organizer') DEFAULT 'user',
        created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_oauth (oauth_provider, oauth_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS token_blacklists (
        id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id    BIGINT UNSIGNED NOT NULL,
        token      TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_expires (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('✓ Migrasi selesai: tabel users & token_blacklists');
    process.exit(0);
  } catch (err) {
    console.error('✗ Migrasi gagal:', err);
    process.exit(1);
  } finally {
    conn.release();
  }
}

migrate();