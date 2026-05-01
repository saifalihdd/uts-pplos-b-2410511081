require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');

const authRoutes  = require('./routes/authRoutes');
const oauthRoutes = require('./routes/oauthRoutes');
const { verifyAccessToken } = require('./services/tokenService');
const { jwtMiddleware } = require('./middleware/jwtMiddleware');

const app  = express();
const PORT = process.env.PORT || 8001;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/test', jwtMiddleware, authRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/auth/oauth', oauthRoutes);

app.use('/internal', require('./routes/internalRoutes'));

app.get('/up', (_, res) => res.json({ status: 'ok', service: 'auth-service' }));

app.use((req, res) => res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan.' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

app.listen(PORT, () => console.log(`✓ auth-service berjalan di http://localhost:${PORT}`));
module.exports = app;