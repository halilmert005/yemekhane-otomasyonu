const express = require('express');
const cookieParser = require('cookie-parser');
const { baglantiKontrol } = require('./config/db');
const { redisKontrol } = require('./config/redis');
const authRoutes = require('./routes/authRoutes');
const menuRoutes = require('./routes/menuRoutes');
const rezervasyonRoutes = require('./routes/rezervasyonRoutes');
const bakiyeRoutes = require('./routes/bakiyeRoutes');
const degerlendirmeRoutes = require('./routes/degerlendirmeRoutes');
const yoneticiRoutes = require('./routes/yoneticiRoutes');
const { hataYakalayici } = require('./middleware/hataMiddleware');

const app = express();

app.use(express.json());
app.use(cookieParser());

app.get(['/api', '/api/'], (req, res) => {
  res.json({ durum: 'ok', servis: 'yemekhane-uygulama' });
});

app.get('/api/saglik', async (req, res, next) => {
  try {
    await Promise.all([baglantiKontrol(), redisKontrol()]);
    res.json({ durum: 'ok', veritabani: 'bagli', redis: 'bagli' });
  } catch (err) {
    next(err);
  }
});

app.use('/api', authRoutes);
app.use('/api', menuRoutes);
app.use('/api', rezervasyonRoutes);
app.use('/api', bakiyeRoutes);
app.use('/api', degerlendirmeRoutes);
app.use('/api/yonetici', yoneticiRoutes);

app.use('/api/*', (req, res) => {
  res.status(404).json({ hata: 'İstenen uç nokta bulunamadı.' });
});

app.use(hataYakalayici);

module.exports = app;
