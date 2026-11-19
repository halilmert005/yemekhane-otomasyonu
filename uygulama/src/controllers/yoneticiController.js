const menuRepo = require('../repositories/menuRepository');
const { bugunTarih, tarihEkle, gecerliTarihMi } = require('../utils/tarih');
const { UygulamaHatasi } = require('../middleware/hataMiddleware');

function menuVerisiDogrula(body, guncellemeMi) {
  const ogrenciFiyati = Number(body.ogrenci_fiyati);
  const personelFiyati = Number(body.personel_fiyati);
  const yemekIdleri = Array.isArray(body.yemek_idleri)
    ? [...new Set(body.yemek_idleri.map(Number).filter((id) => Number.isInteger(id) && id > 0))]
    : [];

  if (!Number.isFinite(ogrenciFiyati) || ogrenciFiyati < 0 || !Number.isFinite(personelFiyati) || personelFiyati < 0) {
    throw new UygulamaHatasi(400, 'Öğrenci ve personel fiyatları 0 veya pozitif sayı olmalıdır.');
  }
  if (yemekIdleri.length === 0) {
    throw new UygulamaHatasi(400, 'Menüde en az bir yemek bulunmalıdır.');
  }

  if (guncellemeMi) {
    return { ogrenciFiyati, personelFiyati, yemekIdleri };
  }

  const yemekhaneId = Number(body.yemekhane_id);
  const ogunId = Number(body.ogun_id);
  const tarih = typeof body.tarih === 'string' ? body.tarih.trim() : '';

  if (!Number.isInteger(yemekhaneId) || yemekhaneId <= 0) {
    throw new UygulamaHatasi(400, 'Geçerli bir yemekhane seçilmelidir.');
  }
  if (!Number.isInteger(ogunId) || ogunId <= 0) {
    throw new UygulamaHatasi(400, 'Geçerli bir öğün seçilmelidir.');
  }
  if (!gecerliTarihMi(tarih)) {
    throw new UygulamaHatasi(400, 'Geçersiz tarih biçimi (YYYY-AA-GG).');
  }

  return { yemekhaneId, tarih, ogunId, ogrenciFiyati, personelFiyati, yemekIdleri };
}

async function yemekleriListele(req, res, next) {
  try {
    const yemekler = await menuRepo.yemekleriGetir();
    return res.json({ yemekler });
  } catch (err) {
    return next(err);
  }
}

async function menuleriListele(req, res, next) {
  try {
    const bugun = bugunTarih();
    const baslangic = req.query.baslangic || tarihEkle(bugun, -7);
    const bitis = req.query.bitis || tarihEkle(bugun, 14);
    if (!gecerliTarihMi(baslangic) || !gecerliTarihMi(bitis)) {
      throw new UygulamaHatasi(400, 'Geçersiz tarih aralığı.');
    }

    const yemekhaneId = req.query.yemekhane_id ? Number(req.query.yemekhane_id) : null;
    const menuler = await menuRepo.menuleriGetir({
      baslangicTarih: baslangic,
      bitisTarih: bitis,
      yemekhaneId,
    });
    return res.json({ baslangic, bitis, menuler });
  } catch (err) {
    return next(err);
  }
}

async function menuOlustur(req, res, next) {
  try {
    const veri = menuVerisiDogrula(req.body, false);
    const menuId = await menuRepo.menuOlustur(veri);
    return res.status(201).json({ menu_id: menuId, mesaj: 'Menü oluşturuldu.' });
  } catch (err) {
    return next(err);
  }
}

async function menuGuncelle(req, res, next) {
  try {
    const menuId = Number(req.params.id);
    if (!Number.isInteger(menuId) || menuId <= 0) {
      throw new UygulamaHatasi(400, 'Geçersiz menü numarası.');
    }
    const veri = menuVerisiDogrula(req.body, true);
    const guncellenen = await menuRepo.menuGuncelle(menuId, veri);
    return res.json({ menu: guncellenen, mesaj: 'Menü güncellendi.' });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  yemekleriListele,
  menuleriListele,
  menuOlustur,
  menuGuncelle,
};
