const { okumaHavuzu, yazmaHavuzu } = require('../config/db');
const { UygulamaHatasi } = require('../middleware/hataMiddleware');

async function kullaniciDegerlendirmeleri(kullaniciId) {
  const [satirlar] = await okumaHavuzu.execute(
    `SELECT d.id, d.menu_id, d.puan, d.yorum, d.olusturma,
            m.tarih, yh.ad AS yemekhane, o.ad AS ogun
       FROM degerlendirmeler d
       JOIN menuler m       ON m.id = d.menu_id
       JOIN yemekhaneler yh ON yh.id = m.yemekhane_id
       JOIN ogunler o       ON o.id = m.ogun_id
      WHERE d.kullanici_id = ?
      ORDER BY d.olusturma DESC`,
    [kullaniciId]
  );
  return satirlar;
}

async function degerlendirmeEkle({ kullaniciId, menuId, puan, yorum }) {
  const [rezSatirlar] = await yazmaHavuzu.execute(
    `SELECT id, durum
       FROM rezervasyonlar
      WHERE kullanici_id = ? AND menu_id = ?
      LIMIT 1`,
    [kullaniciId, menuId]
  );

  if (rezSatirlar.length === 0 || rezSatirlar[0].durum !== 'kullanildi') {
    throw new UygulamaHatasi(400, 'Yalnızca kullanılmış menüler değerlendirilebilir.');
  }

  try {
    const [sonuc] = await yazmaHavuzu.execute(
      `INSERT INTO degerlendirmeler (kullanici_id, menu_id, puan, yorum)
       VALUES (?, ?, ?, ?)`,
      [kullaniciId, menuId, puan, yorum || null]
    );
    return {
      id: sonuc.insertId,
      menu_id: menuId,
      puan,
      yorum: yorum || null,
    };
  } catch (err) {
    if (err.errno === 1062) {
      throw new UygulamaHatasi(409, 'Bu menüyü zaten değerlendirdiniz.');
    }
    throw err;
  }
}

module.exports = {
  kullaniciDegerlendirmeleri,
  degerlendirmeEkle,
};
