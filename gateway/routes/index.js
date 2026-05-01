const express = require('express');
const router  = express.Router();
const { createProxyMiddleware } = require('http-proxy-middleware');
const { jwtMiddleware } = require('../middleware/jwtMiddleware');

const AUTH_URL   = process.env.AUTH_SERVICE_URL   || 'http://localhost:8001';
const EVENT_URL  = process.env.EVENT_SERVICE_URL  || 'http://localhost:8002';
const TICKET_URL = process.env.TICKET_SERVICE_URL || 'http://localhost:8003';

const proxy = (target) => createProxyMiddleware({
  target,
  changeOrigin: true,
  on: {
    error: (err, req, res) => {
      console.error(`[Gateway] Proxy error → ${target}:`, err.message);
      res.status(502).json({ success: false, message: 'Service tidak tersedia.' });
    },
  },
});

router.use('/api/auth/register',        proxy(AUTH_URL));
router.use('/api/auth/login',           proxy(AUTH_URL));
router.use('/api/auth/refresh',         proxy(AUTH_URL));
router.use('/api/auth/oauth',           proxy(AUTH_URL));

router.use('/api/auth', jwtMiddleware, proxy(AUTH_URL));

router.get('/api/events',     proxy(EVENT_URL));
router.get('/api/events/:id', proxy(EVENT_URL));
router.get('/api/events/:id/categories', proxy(EVENT_URL));

router.use('/api/events', jwtMiddleware, proxy(EVENT_URL));
router.use('/api/orders', jwtMiddleware, proxy(EVENT_URL));

router.use('/api/tickets', jwtMiddleware, proxy(TICKET_URL));

module.exports = router;