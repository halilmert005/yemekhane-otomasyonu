class UygulamaHatasi extends Error {
  constructor(durumKodu, mesaj) {
    super(mesaj);
    this.durumKodu = durumKodu;
  }
}

function hataYakalayici(err, req, res, _next) {
  if (err instanceof UygulamaHatasi) {
    return res.status(err.durumKodu).json({ hata: err.message });
  }

  if (err && (err.sqlState === '45000' || err.errno === 1644)) {
    return res.status(400).json({ hata: err.sqlMessage || err.message });
  }

  if (err && err.errno === 3819) {
    console.error('Veritabani kisit hatasi:', err.message);
    return res.status(400).json({ hata: 'Geçersiz işlem verisi.' });
  }

  console.error('Beklenmeyen hata:', err);
  return res.status(500).json({ hata: 'Sunucu hatası oluştu.' });
}

module.exports = {
  UygulamaHatasi,
  hataYakalayici,
};
