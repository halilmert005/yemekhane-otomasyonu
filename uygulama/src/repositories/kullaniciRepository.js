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

module.exports = {
  epostaIleBul,
  idIleGetir,
};
