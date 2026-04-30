const axios = require('axios');

const client = axios.create({
  baseURL: process.env.EVENT_SERVICE_URL || 'http://localhost:8002',
  timeout: 5000,
  headers: {
    'Content-Type':   'application/json',
    'X-Internal-Key': process.env.INTERNAL_SERVICE_KEY,
  },
});

async function getTicketByQr(qrCode) {
  const res = await client.get(`/internal/tickets/${encodeURIComponent(qrCode)}`);
  return res.data;
}

async function markTicketUsed(qrCode) {
  const res = await client.patch(`/internal/tickets/${encodeURIComponent(qrCode)}/use`);
  return res.data;
}

module.exports = { getTicketByQr, markTicketUsed };