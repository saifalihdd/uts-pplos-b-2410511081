const pool      = require('../config/database');
const eventClient = require('../services/eventServiceClient');

exports.validateTicket = async (req, res) => {
  const { qr_code }   = req.body;
  const validatorId   = req.headers['x-user-id'];

  if (!qr_code || typeof qr_code !== 'string')
    return res.status(422).json({ success: false, message: 'qr_code wajib diisi.' });

  try {
    const ticketRes = await eventClient.getTicketByQr(qr_code);
    const ticket    = ticketRes.data;

    if (ticket.status === 'used') {
      await logValidation(qr_code, validatorId, ticket.event_id, 'already_used', 'Tiket sudah digunakan.', req.ip);
      return res.status(409).json({
        success: false,
        message: `Tiket sudah digunakan pada ${ticket.used_at}.`,
        data:    ticket,
      });
    }

    if (ticket.status !== 'active') {
      await logValidation(qr_code, validatorId, ticket.event_id, 'failed', `Status tiket: ${ticket.status}`, req.ip);
      return res.status(422).json({
        success: false,
        message: `Tiket tidak valid. Status: ${ticket.status}`,
      });
    }

    const usedRes = await eventClient.markTicketUsed(qr_code);

    await logValidation(qr_code, validatorId, ticket.event_id, 'success', 'Tiket valid.', req.ip);

    return res.status(200).json({
      success: true,
      message: 'Tiket valid. Selamat datang!',
      data: {
        ticket:       usedRes.data,
        validated_at: new Date().toISOString(),
        validator_id: validatorId,
      },
    });

  } catch (err) {
    if (err.response) {
      const { status, data } = err.response;
      if (status === 404)
        return res.status(404).json({ success: false, message: 'Tiket tidak ditemukan.' });
      if (status === 409)
        return res.status(409).json({ success: false, message: data.message, data: data.data });
      return res.status(502).json({ success: false, message: 'Gagal komunikasi dengan event-service.' });
    }

    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT')
      return res.status(503).json({ success: false, message: 'Event service tidak tersedia.' });

    console.error('[validateTicket]', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

exports.getMyTickets = async (req, res) => {
  const validatorId = req.headers['x-user-id'];
  const page    = parseInt(req.query.page     || '1');
  const perPage = Math.min(parseInt(req.query.per_page || '10'), 50);
  const offset  = (page - 1) * perPage;

  try {
    const [[{ total }]] = await pool.execute(
      'SELECT COUNT(*) as total FROM validation_logs WHERE validator_id = ?',
      [validatorId]
    );

    const [logs] = await pool.execute(
      `SELECT * FROM validation_logs WHERE validator_id = ?
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [validatorId, perPage, offset]
    );

    return res.status(200).json({
      success: true,
      data: logs,
      meta: {
        current_page: page,
        per_page:     perPage,
        total:        total,
        last_page:    Math.ceil(total / perPage) || 1,
      },
    });
  } catch (err) {
    console.error('[getMyTickets]', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

exports.getTicketDetail = async (req, res) => {
  try {
    const ticketRes = await eventClient.getTicketByQr(req.params.qrCode);
    return res.status(200).json(ticketRes);
  } catch (err) {
    if (err.response?.status === 404)
      return res.status(404).json({ success: false, message: 'Tiket tidak ditemukan.' });
    return res.status(502).json({ success: false, message: 'Gagal mengambil data tiket.' });
  }
};

async function logValidation(qrCode, validatorId, eventId, status, message, ip) {
  try {
    await pool.execute(
      `INSERT INTO validation_logs (qr_code, validator_id, event_id, status, message, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [qrCode, validatorId || 0, eventId || 0, status, message, ip || null]
    );
  } catch (err) {
    console.error('[logValidation] Gagal simpan log:', err.message);
  }
}