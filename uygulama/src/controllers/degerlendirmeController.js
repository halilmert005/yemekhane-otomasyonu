const degerlendirmeRepo = require('../repositories/degerlendirmeRepository');
const { UygulamaHatasi } = require('../middleware/hataMiddleware');

async function listele(req, res, next) {
  try {
    const degerlendirmeler = await degerlendirmeRepo.kullaniciDegerlendirmeleri(req.kullanici.id);
    return res.json({ degerlendirmeler });
  } catch (err) {
    return next(err);
  }
}

async function ekle(req, res, next) {
  try {
    const menuId = Number(req.body.menu_id);
    const puan = Number(req.body.puan);
    const yorum = typeof req.body.yorum === 'string' ? req.body.yorum.trim() : '';

    if (!Number.isInteger(menuId) || menuId <= 0) {
      throw new UygulamaHatasi(400, 'Geçerli bir menü seçilmelidir.');
    }
    if (!Number.isInteger(puan) || puan < 1 || puan > 5) {
      throw new UygulamaHatasi(400, 'Puan 1 ile 5 arasında tam sayı olmalıdır.');
    }
    if (yorum.length > 500) {
      throw new UygulamaHatasi(400, 'Yorum en fazla 500 karakter olabilir.');
    }

    const kayit = await degerlendirmeRepo.degerlendirmeEkle({
      kullaniciId: req.kullanici.id,
      menuId,
      puan,
      yorum,
    });

    return res.status(201).json({ degerlendirme: kayit });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listele,
  ekle,
};
