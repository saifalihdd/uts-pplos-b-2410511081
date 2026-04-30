require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');

const ticketRoutes = require('./routes/ticketRoutes');

const app  = express();
const PORT = process.env.PORT || 8003;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/tickets', ticketRoutes);

app.get('/up', (_, res) => res.json({ status: 'ok', service: 'ticket-service' }));

app.use((req, res) => res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan.' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

app.listen(PORT, () => console.log(`✓ ticket-service berjalan di http://localhost:${PORT}`));
module.exports = app;