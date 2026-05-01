import 'dotenv/config';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors    from 'cors';
import helmet  from 'helmet';
import morgan  from 'morgan';
import verifyToken    from './middleware/jwtMiddleware.js';
import { rateLimiter } from './middleware/rateLimiter.js';

const app  = express();
const PORT = process.env.PORT || 8000;

const AUTH_URL   = process.env.AUTH_SERVICE_URL   || 'http://localhost:8001';
const EVENT_URL  = process.env.EVENT_SERVICE_URL  || 'http://localhost:8002';
const TICKET_URL = process.env.TICKET_SERVICE_URL || 'http://localhost:8003';
const INTERNAL_KEY = process.env.INTERNAL_SERVICE_KEY || 'internal-secret-key';

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(rateLimiter);

// DEBUG — log semua request yang masuk
app.use((req, res, next) => {
  next();
});

// ── AUTH SERVICE — public (tanpa JWT) ─────────────────────────────────────
app.use(
  ['/api/auth/register', '/api/auth/login', '/api/auth/refresh', '/api/auth/oauth'],
  createProxyMiddleware({
    target:      AUTH_URL,
    changeOrigin: true,
  })
);

// ── AUTH SERVICE — protected ───────────────────────────────────────────────
app.use(
  ['/api/auth/logout', '/api/auth/me'],
  verifyToken,
  createProxyMiddleware({
    target:      AUTH_URL,
    changeOrigin: true,
    on: {
      proxyReq: (proxyReq, req) => {
        console.log('[PROXY] req.user:', req.user);
        console.log('[PROXY] Setting x-user-id:', String(req.user.sub));
        proxyReq.setHeader('x-user-id',    String(req.user.sub));
        proxyReq.setHeader('x-user-email', req.user.email);
      },
    },
  })
);

// Public GET
app.get('/api/events', createProxyMiddleware({ target: EVENT_URL, changeOrigin: true }));
app.get('/api/events/:id', createProxyMiddleware({ target: EVENT_URL, changeOrigin: true }));
app.get('/api/events/:id/categories', createProxyMiddleware({ target: EVENT_URL, changeOrigin: true }));

// Protected POST, PUT, DELETE
app.post('/api/events', verifyToken, (req, res, next) => {
  req.headers['x-user-id'] = String(req.user.sub);
  req.headers['x-user-email'] = req.user.email;
  next();
}, createProxyMiddleware({
  target: EVENT_URL,
  changeOrigin: true,
}));

app.post('/api/events/:id/categories', verifyToken, (req, rest, next) => {
  req.headers['x-user-id'] = String(req.user.sub);
  req.headers['x-user-email'] = req.user.email;
  next();
}, createProxyMiddleware({
  target: EVENT_URL,
  changeOrigin: true,
}));

app.put('/api/events/:id', verifyToken, (req, res, next) => {
  req.headers['x-user-id'] = String(req.user.sub);
  req.headers['x-user-email'] = req.user.email;
  next();
}, createProxyMiddleware({
  target: EVENT_URL,
  changeOrigin: true,
}));

app.delete('/api/events/:id', verifyToken, (req, res, next) => {
  req.headers['x-user-id'] = String(req.user.sub);
  req.headers['x-user-email'] = req.user.email;
  next();
}, createProxyMiddleware({
  target: EVENT_URL,
  changeOrigin: true,
}));

// TICKET SERVICE — protected
app.post('/api/events/:id/categories', verifyToken, (req, rest, next) => {
  req.headers['x-user-id'] = String(req.user.sub);
  req.headers['x-user-email'] = req.user.email;
  req.headers['x-internal-key'] = INTERNAL_KEY; 
  next();
}, createProxyMiddleware({
  target: TICKET_URL,
  changeOrigin: true,
}));

app.use(
  ['/api/tickets'],
  verifyToken,
  createProxyMiddleware({
    target:      TICKET_URL,
    changeOrigin: true,
    on: {
      proxyReq: (proxyReq, req) => {
        proxyReq.setHeader('x-user-id',    String(req.user.sub));
        proxyReq.setHeader('x-user-email', req.user.email);
        proxyReq.setHeader('x-internal-key', INTERNAL_KEY);
      },
    },
  })
);

// ORDER SERVICE - protected
app.use('/api/orders', verifyToken, (req, rest, next) => {
  req.headers['x-user-id'] = String(req.user.sub);
  req.headers['x-user-email'] = req.user.email;
  next();
}, createProxyMiddleware({
  target: EVENT_URL,
  changeOrigin: true,
}));

// Health check
app.get('/up', (_, res) => res.json({ status: 'ok', service: 'gateway' }));

// Fallback 404
app.use((req, res) => {
  console.log(`[NO MATCH] ${req.method} ${req.path}`);
  res.status(404).json({ success: false, message: 'Route tidak ditemukan di gateway.' });
});

app.listen(PORT, () => console.log(`✓ Gateway berjalan di http://localhost:${PORT}`));