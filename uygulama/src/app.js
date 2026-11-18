const express = require('express');
const cookieParser = require('cookie-parser');
const { baglantiKontrol } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const { hataYakalayici } = require('./middleware/hataMiddleware');

const app = express();

app.use(express.json());
app.use(cookieParser());

app.get(['/api', '/api/'], (req, res) => {
  res.json({ durum: 'ok', servis: 'yemekhane-uygulama' });
});

app.get('/api/saglik', async (req, res, next) => {
  try {
    await baglantiKontrol();
    res.json({ durum: 'ok', veritabani: 'bagli' });
  } catch (err) {
    next(err);
  }
});

app.use('/api', authRoutes);

app.use('/api/*', (req, res) => {
  res.status(404).json({ hata: 'İstenen uç nokta bulunamadı.' });
});

app.use(hataYakalayici);

module.exports = app;
