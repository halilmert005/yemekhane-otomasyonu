const rezervasyonRepo = require('../repositories/rezervasyonRepository');
const kullaniciRepo = require('../repositories/kullaniciRepository');
const { UygulamaHatasi } = require('../middleware/hataMiddleware');

async function listele(req, res, next) {
  try {
    const rezervasyonlar = await rezervasyonRepo.kullaniciRezervasyonlari(req.kullanici.id);
    return res.json({ rezervasyonlar });
  } catch (err) {
    return next(err);
  }
}

async function olustur(req, res, next) {
  try {
    const menuId = Number(req.body.menu_id);
    if (!Number.isInteger(menuId) || menuId <= 0) {
      throw new UygulamaHatasi(400, 'Geçerli bir menü seçilmelidir.');
    }

    const sonuc = await rezervasyonRepo.rezervasyonYap(req.kullanici.id, menuId);
    const guncelKullanici = await kullaniciRepo.idIleGetir(req.kullanici.id, true);

    return res.status(201).json({
      rezervasyon_id: sonuc.rezervasyon_id,
      ucret: sonuc.ucret,
      bakiye: guncelKullanici ? guncelKullanici.bakiye : sonuc.bakiye,
    });
  } catch (err) {
    return next(err);
  }
}

async function iptalEt(req, res, next) {
  try {
    const rezervasyonId = Number(req.params.id);
    if (!Number.isInteger(rezervasyonId) || rezervasyonId <= 0) {
      throw new UygulamaHatasi(400, 'Geçersiz rezervasyon numarası.');
    }

    const sonuc = await rezervasyonRepo.rezervasyonIptal(req.kullanici.id, rezervasyonId);
    const guncelKullanici = await kullaniciRepo.idIleGetir(req.kullanici.id, true);

    return res.json({
      rezervasyon_id: sonuc.rezervasyon_id,
      iade: sonuc.iade,
      bakiye: guncelKullanici ? guncelKullanici.bakiye : sonuc.bakiye,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listele,
  olustur,
  iptalEt,
};
