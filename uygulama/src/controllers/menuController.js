const menuRepo = require('../repositories/menuRepository');
const rezervasyonRepo = require('../repositories/rezervasyonRepository');
const { bugunTarih, tarihEkle, gecerliTarihMi } = require('../utils/tarih');
const { UygulamaHatasi } = require('../middleware/hataMiddleware');

function kullaniciFiyatiSec(menu, rol) {
  return rol === 'ogrenci' ? menu.ogrenci_fiyati : menu.personel_fiyati;
}

async function referanslar(req, res, next) {
  try {
    const [yemekhaneler, ogunler] = await Promise.all([
      menuRepo.yemekhaneleriGetir(),
      menuRepo.ogunleriGetir(),
    ]);
    return res.json({ yemekhaneler, ogunler });
  } catch (err) {
    return next(err);
  }
}

async function gununMenusu(req, res, next) {
  try {
    const tarih = req.query.tarih || bugunTarih();
    if (!gecerliTarihMi(tarih)) {
      throw new UygulamaHatasi(400, 'Geçersiz tarih biçimi (YYYY-AA-GG).');
    }

    const yemekhaneId = req.query.yemekhane_id ? Number(req.query.yemekhane_id) : null;
    const ogunId = req.query.ogun_id ? Number(req.query.ogun_id) : null;

    const [menuler, rezervasyonlar] = await Promise.all([
      menuRepo.menuleriGetir({
        baslangicTarih: tarih,
        bitisTarih: tarih,
        yemekhaneId,
        ogunId,
      }),
      rezervasyonRepo.tarihAraligiKullaniciRezervasyonlari(req.kullanici.id, tarih, tarih),
    ]);

    const rezHaritasi = new Map(rezervasyonlar.map((r) => [r.menu_id, r]));
    const sonuclar = menuler.map((menu) => ({
      ...menu,
      kullanici_fiyati: kullaniciFiyatiSec(menu, req.kullanici.rol),
      kullanici_rezervasyon: rezHaritasi.get(menu.menu_id) || null,
    }));

    return res.json({ tarih, menuler: sonuclar });
  } catch (err) {
    return next(err);
  }
}

async function haftalikMenuler(req, res, next) {
  try {
    const baslangic = req.query.baslangic || bugunTarih();
    if (!gecerliTarihMi(baslangic)) {
      throw new UygulamaHatasi(400, 'Geçersiz başlangıç tarihi.');
    }
    const bitis = req.query.bitis || tarihEkle(baslangic, 6);
    if (!gecerliTarihMi(bitis)) {
      throw new UygulamaHatasi(400, 'Geçersiz bitiş tarihi.');
    }
    const yemekhaneId = req.query.yemekhane_id ? Number(req.query.yemekhane_id) : null;

    const [menuler, rezervasyonlar] = await Promise.all([
      menuRepo.menuleriGetir({
        baslangicTarih: baslangic,
        bitisTarih: bitis,
        yemekhaneId,
      }),
      rezervasyonRepo.tarihAraligiKullaniciRezervasyonlari(req.kullanici.id, baslangic, bitis),
    ]);

    const rezHaritasi = new Map(rezervasyonlar.map((r) => [r.menu_id, r]));
    const sonuclar = menuler.map((menu) => ({
      ...menu,
      kullanici_fiyati: kullaniciFiyatiSec(menu, req.kullanici.rol),
      kullanici_rezervasyon: rezHaritasi.get(menu.menu_id) || null,
    }));

    return res.json({ baslangic, bitis, menuler: sonuclar });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  referanslar,
  gununMenusu,
  haftalikMenuler,
};
