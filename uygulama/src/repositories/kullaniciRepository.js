const { okumaHavuzu, yazmaHavuzu } = require('../config/db');

async function epostaIleBul(eposta) {
  const [satirlar] = await okumaHavuzu.execute(
    `SELECT id, ad, soyad, eposta, sifre_hash, rol, ogrenci_no, bakiye, aktif
       FROM kullanicilar
      WHERE eposta = ?
      LIMIT 1`,
    [eposta]
  );
  return satirlar[0] || null;
}

async function idIleGetir(id, kaynaktan = false) {
  const havuz = kaynaktan ? yazmaHavuzu : okumaHavuzu;
  const [satirlar] = await havuz.execute(
    `SELECT id, ad, soyad, eposta, rol, ogrenci_no, bakiye, aktif
       FROM kullanicilar
      WHERE id = ?
      LIMIT 1`,
    [id]
  );
  return satirlar[0] || null;
}

async function tumAlerjenler() {
  const [satirlar] = await okumaHavuzu.execute('SELECT id, ad FROM alerjenler ORDER BY id');
  return satirlar;
}

async function kullaniciAlerjenleriniGetir(kullaniciId, kaynaktan = false) {
  const havuz = kaynaktan ? yazmaHavuzu : okumaHavuzu;
  const [satirlar] = await havuz.execute(
    `SELECT ka.alerjen_id, a.ad
       FROM kullanici_alerjenleri ka
       JOIN alerjenler a ON a.id = ka.alerjen_id
      WHERE ka.kullanici_id = ?
      ORDER BY ka.alerjen_id`,
    [kullaniciId]
  );
  return satirlar;
}

async function kullaniciAlerjenleriniGuncelle(kullaniciId, alerjenIdleri) {
  const baglanti = await yazmaHavuzu.getConnection();
  try {
    await baglanti.beginTransaction();
    await baglanti.execute('DELETE FROM kullanici_alerjenleri WHERE kullanici_id = ?', [kullaniciId]);
    if (alerjenIdleri.length > 0) {
      const degerler = alerjenIdleri.map((alerjenId) => [kullaniciId, alerjenId]);
      await baglanti.query(
        'INSERT INTO kullanici_alerjenleri (kullanici_id, alerjen_id) VALUES ?',
        [degerler]
      );
    }
    await baglanti.commit();
  } catch (err) {
    await baglanti.rollback();
    throw err;
  } finally {
    baglanti.release();
  }
}

module.exports = {
  epostaIleBul,
  idIleGetir,
  tumAlerjenler,
  kullaniciAlerjenleriniGetir,
  kullaniciAlerjenleriniGuncelle,
};
