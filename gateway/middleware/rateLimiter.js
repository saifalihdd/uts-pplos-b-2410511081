import rateLimit from 'express-rate-limit';

const rateLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             60,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: 'Terlalu banyak request. Coba lagi dalam 1 menit.',
  },
  skip: (req) => req.path === '/up',
});

export { rateLimiter };