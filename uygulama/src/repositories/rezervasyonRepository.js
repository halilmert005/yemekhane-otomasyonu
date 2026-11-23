const { okumaHavuzu, yazmaHavuzu } = require('../config/db');

async function rezervasyonYap(kullaniciId, menuId, porsiyon = 'tam') {
  const [sonucKumeleri] = await yazmaHavuzu.query('CALL sp_rezervasyon_yap(?, ?, ?)', [
    kullaniciId,
    menuId,
    porsiyon,
  ]);
  return sonucKumeleri[0][0];
}

async function rezervasyonIptal(kullaniciId, rezervasyonId) {
  const [sonucKumeleri] = await yazmaHavuzu.query('CALL sp_rezervasyon_iptal(?, ?)', [
    kullaniciId,
    rezervasyonId,
  ]);
  return sonucKumeleri[0][0];
}

async function kullaniciRezervasyonlari(kullaniciId) {
  const [satirlar] = await okumaHavuzu.execute(
    `SELECT r.id AS rezervasyon_id, r.menu_id, r.porsiyon, r.durum, r.ucret,
            r.olusturma, r.kullanma_zamani, r.iptal_zamani,
            m.tarih, m.yemekhane_id, yh.ad AS yemekhane,
            m.ogun_id, o.ad AS ogun, o.sira AS ogun_sira,
            TIMESTAMP(m.tarih, o.son_saat) AS rezervasyon_son,
            (r.durum = 'aktif' AND NOW() < TIMESTAMP(m.tarih, o.son_saat)) AS iptal_edilebilir,
            d.id AS degerlendirme_id, d.puan AS verilen_puan, d.yorum AS verilen_yorum
       FROM rezervasyonlar r
       JOIN menuler m       ON m.id = r.menu_id
       JOIN yemekhaneler yh ON yh.id = m.yemekhane_id
       JOIN ogunler o       ON o.id = m.ogun_id
       LEFT JOIN degerlendirmeler d ON d.kullanici_id = r.kullanici_id AND d.menu_id = r.menu_id
      WHERE r.kullanici_id = ?
      ORDER BY m.tarih DESC, o.sira ASC, r.id DESC`,
    [kullaniciId]
  );
  return satirlar.map((s) => ({
    ...s,
    iptal_edilebilir: Boolean(s.iptal_edilebilir),
  }));
}

async function tarihAraligiKullaniciRezervasyonlari(kullaniciId, baslangicTarih, bitisTarih) {
  const [satirlar] = await okumaHavuzu.execute(
    `SELECT r.id AS rezervasyon_id, r.menu_id, r.porsiyon, r.durum, r.ucret
       FROM rezervasyonlar r
       JOIN menuler m ON m.id = r.menu_id
      WHERE r.kullanici_id = ?
        AND m.tarih BETWEEN ? AND ?`,
    [kullaniciId, baslangicTarih, bitisTarih]
  );
  return satirlar;
}

module.exports = {
  rezervasyonYap,
  rezervasyonIptal,
  kullaniciRezervasyonlari,
  tarihAraligiKullaniciRezervasyonlari,
};
