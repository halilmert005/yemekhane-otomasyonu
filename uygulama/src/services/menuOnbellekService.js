const { redis } = require('../config/redis');

function anahtarOlustur(yemekhaneId, tarih, ogunId) {
  return `menu:${yemekhaneId}:${tarih}:${ogunId}`;
}

function gunSonuKalanSaniye(tarihStr) {
  const hedefMs = new Date(`${tarihStr}T23:59:59+03:00`).getTime();
  return Math.floor((hedefMs - Date.now()) / 1000);
}

async function menuGetir(yemekhaneId, tarih, ogunId) {
  const anahtar = anahtarOlustur(yemekhaneId, tarih, ogunId);
  const kayit = await redis.get(anahtar);
  if (!kayit) {
    console.log(`[ONBELLEK YOK] ${anahtar} -> veritabanindan okunacak`);
    return null;
  }
  console.log(`[ONBELLEK BULUNDU] ${anahtar} -> Redis uzerinden donuldu`);
  return JSON.parse(kayit);
}

async function menuKaydet(menu) {
  const anahtar = anahtarOlustur(menu.yemekhane_id, menu.tarih, menu.ogun_id);
  const ttl = gunSonuKalanSaniye(menu.tarih);
  if (ttl > 0) {
    await redis.set(anahtar, JSON.stringify(menu), 'EX', ttl);
    console.log(`[ONBELLEK YAZILDI] ${anahtar} (TTL: ${ttl} sn)`);
  }
}

async function menuSil(yemekhaneId, tarih, ogunId) {
  const anahtar = anahtarOlustur(yemekhaneId, tarih, ogunId);
  const silinen = await redis.del(anahtar);
  console.log(`[ONBELLEK SILINDI] ${anahtar} (silinen: ${silinen})`);
}

module.exports = {
  anahtarOlustur,
  menuGetir,
  menuKaydet,
  menuSil,
};
