require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     process.env.DB_HOST || '127.0.0.1',
  port:     parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME || 'tiket_auth',
  user:     process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  waitForConnections: true,
  connectionLimit: 10,
});

pool.getConnection()
  .then(c => { console.log('✓ MySQL tiket_auth terhubung'); c.release(); })
  .catch(e => console.error('✗ MySQL error:', e.message));

module.exports = pool;