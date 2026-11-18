const crypto = require('crypto');

const OTURUM_SURESI_MS = 30 * 60 * 1000;
const oturumlar = new Map();

function olustur(kullanici) {
  const token = crypto.randomBytes(24).toString('hex');
  oturumlar.set(token, {
    id: kullanici.id,
    eposta: kullanici.eposta,
    rol: kullanici.rol,
    bitis: Date.now() + OTURUM_SURESI_MS,
  });
  return token;
}

function dogrula(token) {
  if (!token) return null;
  const kayit = oturumlar.get(token);
  if (!kayit) return null;
  if (Date.now() > kayit.bitis) {
    oturumlar.delete(token);
    return null;
  }
  kayit.bitis = Date.now() + OTURUM_SURESI_MS;
  return kayit;
}

function sil(token) {
  if (token) {
    oturumlar.delete(token);
  }
}

module.exports = {
  olustur,
  dogrula,
  sil,
};
