require('dotenv').config();
const pool = require('./config/database');

async function migrate() {
  const conn = await pool.getConnection();
  try {
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS validation_logs (
        id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        qr_code      VARCHAR(255) NOT NULL,
        validator_id BIGINT UNSIGNED NOT NULL COMMENT 'user_id petugas dari gateway',
        event_id     BIGINT UNSIGNED NOT NULL,
        status       ENUM('success','failed','already_used') NOT NULL,
        message      TEXT,
        ip_address   VARCHAR(45) NULL DEFAULT NULL,
        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_qr_code  (qr_code),
        INDEX idx_event_id (event_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('✓ Migrasi selesai: tabel validation_logs');
    process.exit(0);
  } catch (err) {
    console.error('✗ Migrasi gagal:', err);
    process.exit(1);
  } finally {
    conn.release();
  }
}

migrate();