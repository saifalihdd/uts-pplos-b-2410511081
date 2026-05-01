require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');

const router      = require('./routes');
const { rateLimiter } = require('./middleware/rateLimiter');

const app  = express();
const PORT = process.env.PORT || 8000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use(rateLimiter);

app.use('/', router);

app.get('/up', (_, res) => res.json({ status: 'ok', service: 'gateway' }));

app.use((req, res) => res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan.' }));

app.listen(PORT, () => console.log(`✓ gateway berjalan di http://localhost:${PORT}`));
module.exports = app;