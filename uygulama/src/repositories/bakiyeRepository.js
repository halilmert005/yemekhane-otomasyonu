const { okumaHavuzu, yazmaHavuzu } = require('../config/db');

async function bakiyeYukle(kullaniciId, tutar) {
  const [sonucKumeleri] = await yazmaHavuzu.query('CALL sp_bakiye_yukle(?, ?)', [
    kullaniciId,
    tutar,
  ]);
  return sonucKumeleri[0][0];
}

async function hareketleriGetir(kullaniciId, kaynaktan = false) {
  const havuz = kaynaktan ? yazmaHavuzu : okumaHavuzu;
  const [satirlar] = await havuz.execute(
    `SELECT id, tur, tutar, rezervasyon_id, aciklama, olusturma
       FROM bakiye_hareketleri
      WHERE kullanici_id = ?
      ORDER BY olusturma DESC, id DESC
      LIMIT 100`,
    [kullaniciId]
  );
  return satirlar;
}

module.exports = {
  bakiyeYukle,
  hareketleriGetir,
};
