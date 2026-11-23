const menuRepo = require('../repositories/menuRepository');
const rezervasyonRepo = require('../repositories/rezervasyonRepository');
const kullaniciRepo = require('../repositories/kullaniciRepository');
const menuOnbellek = require('../services/menuOnbellekService');
const { bugunTarih, tarihEkle, gecerliTarihMi } = require('../utils/tarih');
const { UygulamaHatasi } = require('../middleware/hataMiddleware');

function kullaniciFiyatiSec(menu, rol) {
  return rol === 'ogrenci' ? menu.ogrenci_fiyati : menu.personel_fiyati;
}

function suresiDolduMu(rezervasyonSon) {
  if (!rezervasyonSon) return false;
  const hedef = new Date(String(rezervasyonSon).replace(' ', 'T') + '+03:00').getTime();
  return Date.now() >= hedef;
}

function menuleriZenginlestir(menuler, rezervasyonlar, rol, kullaniciAlerjenleri) {
  const rezHaritasi = new Map(rezervasyonlar.map((r) => [r.menu_id, r]));
  const alerjenHaritasi = new Map(kullaniciAlerjenleri.map((a) => [a.alerjen_id, a.ad]));

  return menuler.map((menu) => {
    const tamFiyat = kullaniciFiyatiSec(menu, rol);
    const yarimDestekli = Number(menu.ogun_id) !== 1;
    const yemekler = (menu.yemekler || []).map((y) => {
      const uyariAlerjenler = (y.alerjen_idler || [])
        .filter((id) => alerjenHaritasi.has(id))
        .map((id) => alerjenHaritasi.get(id));
      return {
        ...y,
        uyari_alerjenler: uyariAlerjenler,
        uyari_var: uyariAlerjenler.length > 0,
      };
    });

    return {
      ...menu,
      yemekler,
      suresi_doldu: suresiDolduMu(menu.rezervasyon_son),
      kullanici_fiyati: tamFiyat,
      yarim_porsiyon_destekli: yarimDestekli,
      yarim_porsiyon_fiyati: yarimDestekli ? Number((Number(tamFiyat) * 0.6).toFixed(2)) : null,
      kullanici_rezervasyon: rezHaritasi.get(menu.menu_id) || null,
    };
  });
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

    let menuler = null;
    if (yemekhaneId && ogunId) {
      const onbellekMenu = await menuOnbellek.menuGetir(yemekhaneId, tarih, ogunId);
      if (onbellekMenu) {
        menuler = [onbellekMenu];
      }
    }

    if (!menuler) {
      menuler = await menuRepo.menuleriGetir({
        baslangicTarih: tarih,
        bitisTarih: tarih,
        yemekhaneId,
        ogunId,
      });
      if (yemekhaneId && ogunId && menuler.length === 1) {
        await menuOnbellek.menuKaydet(menuler[0]);
      }
    }

    const [rezervasyonlar, kullaniciAlerjenleri] = await Promise.all([
      rezervasyonRepo.tarihAraligiKullaniciRezervasyonlari(req.kullanici.id, tarih, tarih),
      kullaniciRepo.kullaniciAlerjenleriniGetir(req.kullanici.id),
    ]);

    const sonuclar = menuleriZenginlestir(menuler, rezervasyonlar, req.kullanici.rol, kullaniciAlerjenleri);
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

    const [menuler, rezervasyonlar, kullaniciAlerjenleri] = await Promise.all([
      menuRepo.menuleriGetir({
        baslangicTarih: baslangic,
        bitisTarih: bitis,
        yemekhaneId,
      }),
      rezervasyonRepo.tarihAraligiKullaniciRezervasyonlari(req.kullanici.id, baslangic, bitis),
      kullaniciRepo.kullaniciAlerjenleriniGetir(req.kullanici.id),
    ]);

    const sonuclar = menuleriZenginlestir(menuler, rezervasyonlar, req.kullanici.rol, kullaniciAlerjenleri);
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
