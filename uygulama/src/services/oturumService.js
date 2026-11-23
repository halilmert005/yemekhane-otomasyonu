const crypto = require('crypto');
const { redis } = require('../config/redis');

const OTURUM_SURESI_SN = 30 * 60;
const ON_EK = 'oturum:';

async function olustur(kullanici) {
  const token = crypto.randomBytes(24).toString('hex');
  const veri = JSON.stringify({
    id: kullanici.id,
    eposta: kullanici.eposta,
    rol: kullanici.rol,
  });
  await redis.set(ON_EK + token, veri, 'EX', OTURUM_SURESI_SN);
  return token;
}

async function dogrula(token) {
  if (!token) return null;
  const anahtar = ON_EK + token;
  const ham = await redis.get(anahtar);
  if (!ham) return null;
  await redis.expire(anahtar, OTURUM_SURESI_SN);
  return JSON.parse(ham);
}

async function sil(token) {
  if (token) {
    await redis.del(ON_EK + token);
  }
}

module.exports = {
  olustur,
  dogrula,
  sil,
};
