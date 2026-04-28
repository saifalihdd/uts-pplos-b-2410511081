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
        oauth_provider   VARCHAR(50)  DEFAULT NULL,
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

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id       BIGINT UNSIGNED NOT NULL,
        token         TEXT NOT NULL,
        device_info   VARCHAR(255) DEFAULT NULL COMMENT 'user-agent atau nama device',
        ip_address    VARCHAR(45)  DEFAULT NULL,
        expires_at    TIMESTAMP NOT NULL,
        revoked_at    TIMESTAMP NULL DEFAULT NULL COMMENT 'NULL = masih aktif',
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user  (user_id),
        INDEX idx_expires (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('✓ Migrasi selesai: users, token_blacklists, refresh_tokens');
    process.exit(0);
  } catch (err) {
    console.error('✗ Migrasi gagal:', err);
    process.exit(1);
  } finally {
    conn.release();
  }
}

migrate();