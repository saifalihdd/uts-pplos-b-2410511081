const pool = require('../config/database');

class ValidationLog {
  static async createLog(qrCode, validatorId, eventId, status, message, ip) {
    await pool.execute(
      `INSERT INTO validation_logs (qr_code, validator_id, event_id, status, message, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [qrCode, validatorId || 0, eventId || 0, status, message, ip || null]
    );
  }

  static async countByValidatorId(validatorId) {
    const [[{ total }]] = await pool.execute(
      'SELECT COUNT(*) as total FROM validation_logs WHERE validator_id = ?',
      [validatorId]
    );
    return total;
  }

  static async findByValidatorIdWithPagination(validatorId, limit, offset) {
    const [logs] = await pool.execute(
      `SELECT * FROM validation_logs WHERE validator_id = ?
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [validatorId, limit, offset]
    );
    return logs;
  }
}

module.exports = ValidationLog;