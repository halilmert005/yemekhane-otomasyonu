const bakiyeRepo = require('../repositories/bakiyeRepository');
const kullaniciRepo = require('../repositories/kullaniciRepository');

async function durumGetir(req, res, next) {
  try {
    const kaynaktan = req.query.kaynak === '1';
    const [kullanici, hareketler] = await Promise.all([
      kullaniciRepo.idIleGetir(req.kullanici.id, kaynaktan),
      bakiyeRepo.hareketleriGetir(req.kullanici.id, kaynaktan),
    ]);
    return res.json({
      bakiye: kullanici ? kullanici.bakiye : 0,
      hareketler,
    });
  } catch (err) {
    return next(err);
  }
}

async function yukle(req, res, next) {
  try {
    const hamTutar = req.body.tutar;
    const tutar = hamTutar === undefined || hamTutar === null || hamTutar === '' ? null : Number(hamTutar);
    const gecerliTutar = Number.isFinite(tutar) ? tutar : null;

    const sonuc = await bakiyeRepo.bakiyeYukle(req.kullanici.id, gecerliTutar);
    const guncelKullanici = await kullaniciRepo.idIleGetir(req.kullanici.id, true);

    return res.status(201).json({
      hareket_id: sonuc.hareket_id,
      bakiye: guncelKullanici ? guncelKullanici.bakiye : sonuc.bakiye,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  durumGetir,
  yukle,
};
