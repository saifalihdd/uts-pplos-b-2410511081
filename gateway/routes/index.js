import express from "express";
const router  = express.Router();
import axios from "axios";
import jwtMiddleware from "../middleware/jwtMiddleware";

const AUTH_URL   = process.env.AUTH_SERVICE_URL   || 'http://localhost:8001';
const EVENT_URL  = process.env.EVENT_SERVICE_URL  || 'http://localhost:8002';
const TICKET_URL = process.env.TICKET_SERVICE_URL || 'http://localhost:8003';

async function forward(req, res, targetBase) {
  try {
    const url      = `${targetBase}${req.originalUrl}`;
    const response = await axios({
      method:  req.method,
      url,
      headers: {
        ...req.headers,
        host: undefined,
      },
      data:           req.body,
      validateStatus: () => true,
    });

    res.status(response.status).json(response.data);

  } catch (err) {
    if (err.code === 'ECONNREFUSED')
      return res.status(503).json({ success: false, message: 'Service tidak tersedia.' });
    if (err.code === 'ETIMEDOUT')
      return res.status(504).json({ success: false, message: 'Service timeout.' });

    console.error('[Gateway] Forward error:', err.message);
    res.status(502).json({ success: false, message: 'Bad gateway.' });
  }
}

// ── AUTH — public ──────────────────────────────────────────────────────────
router.post('/api/auth/register',             (req, res) => forward(req, res, AUTH_URL));
router.post('/api/auth/login',                (req, res) => forward(req, res, AUTH_URL));
router.post('/api/auth/refresh',              (req, res) => forward(req, res, AUTH_URL));
router.get('/api/auth/oauth/github',          (req, res) => forward(req, res, AUTH_URL));
router.get('/api/auth/oauth/github/callback', (req, res) => forward(req, res, AUTH_URL));

// ── AUTH — protected ───────────────────────────────────────────────────────
router.post('/api/auth/logout', jwtMiddleware, (req, res) => forward(req, res, AUTH_URL));
router.get('/api/auth/me',      jwtMiddleware, (req, res) => forward(req, res, AUTH_URL));

// ── EVENT — public ─────────────────────────────────────────────────────────
router.get('/api/events',                    (req, res) => forward(req, res, EVENT_URL));
router.get('/api/events/:id',                (req, res) => forward(req, res, EVENT_URL));
router.get('/api/events/:id/categories',     (req, res) => forward(req, res, EVENT_URL));

// ── EVENT — protected ──────────────────────────────────────────────────────
router.post('/api/events',                              jwtMiddleware, (req, res) => forward(req, res, EVENT_URL));
router.put('/api/events/:id',                           jwtMiddleware, (req, res) => forward(req, res, EVENT_URL));
router.patch('/api/events/:id',                         jwtMiddleware, (req, res) => forward(req, res, EVENT_URL));
router.delete('/api/events/:id',                        jwtMiddleware, (req, res) => forward(req, res, EVENT_URL));
router.post('/api/events/:id/categories',               jwtMiddleware, (req, res) => forward(req, res, EVENT_URL));
router.put('/api/events/:eventId/categories/:id',       jwtMiddleware, (req, res) => forward(req, res, EVENT_URL));
router.delete('/api/events/:eventId/categories/:id',    jwtMiddleware, (req, res) => forward(req, res, EVENT_URL));

// ── ORDER — protected ──────────────────────────────────────────────────────
router.get('/api/orders',        jwtMiddleware, (req, res) => forward(req, res, EVENT_URL));
router.post('/api/orders',       jwtMiddleware, (req, res) => forward(req, res, EVENT_URL));
router.get('/api/orders/:id',    jwtMiddleware, (req, res) => forward(req, res, EVENT_URL));
router.delete('/api/orders/:id', jwtMiddleware, (req, res) => forward(req, res, EVENT_URL));

// ── TICKET — protected ─────────────────────────────────────────────────────
router.post('/api/tickets/validate', jwtMiddleware, (req, res) => forward(req, res, TICKET_URL));
router.get('/api/tickets/my',        jwtMiddleware, (req, res) => forward(req, res, TICKET_URL));
router.get('/api/tickets/:qrCode',   jwtMiddleware, (req, res) => forward(req, res, TICKET_URL));

module.exports = router;