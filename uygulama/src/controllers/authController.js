const bcrypt = require('bcryptjs');
const kullaniciRepo = require('../repositories/kullaniciRepository');
const oturumService = require('../services/oturumService');
const { tokenCikar } = require('../middleware/authMiddleware');
const { UygulamaHatasi } = require('../middleware/hataMiddleware');

async function giris(req, res, next) {
  try {
    const eposta = (req.body.eposta || '').trim().toLowerCase();
    const sifre = req.body.sifre || '';

    if (!eposta || !sifre) {
      throw new UygulamaHatasi(400, 'E-posta ve şifre zorunludur.');
    }

    const kullanici = await kullaniciRepo.epostaIleBul(eposta);
    if (!kullanici) {
      throw new UygulamaHatasi(401, 'E-posta veya şifre hatalı.');
    }
    if (!kullanici.aktif) {
      throw new UygulamaHatasi(403, 'Hesabınız pasif durumdadır.');
    }

    const dogruMu = await bcrypt.compare(sifre, kullanici.sifre_hash);
    if (!dogruMu) {
      throw new UygulamaHatasi(401, 'E-posta veya şifre hatalı.');
    }

    const token = await oturumService.olustur(kullanici);

    res.cookie('oturum_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 60 * 1000,
    });

    return res.json({
      token,
      kullanici: {
        id: kullanici.id,
        ad: kullanici.ad,
        soyad: kullanici.soyad,
        eposta: kullanici.eposta,
        rol: kullanici.rol,
        ogrenci_no: kullanici.ogrenci_no,
        bakiye: kullanici.bakiye,
      },
    });
  } catch (err) {
    return next(err);
  }
}

async function cikis(req, res, next) {
  try {
    const token = tokenCikar(req);
    await oturumService.sil(token);
    res.clearCookie('oturum_token', { path: '/' });
    return res.json({ mesaj: 'Çıkış yapıldı.' });
  } catch (err) {
    return next(err);
  }
}

async function ben(req, res, next) {
  try {
    const kaynaktan = req.query.kaynak === '1';
    const [kullanici, alerjenler] = await Promise.all([
      kullaniciRepo.idIleGetir(req.kullanici.id, kaynaktan),
      kullaniciRepo.kullaniciAlerjenleriniGetir(req.kullanici.id, kaynaktan),
    ]);
    if (!kullanici) {
      throw new UygulamaHatasi(404, 'Kullanıcı bulunamadı.');
    }
    return res.json({
      kullanici,
      alerjen_idler: alerjenler.map((a) => a.alerjen_id),
    });
  } catch (err) {
    return next(err);
  }
}

async function alerjenlerListele(req, res, next) {
  try {
    const alerjenler = await kullaniciRepo.tumAlerjenler();
    return res.json({ alerjenler });
  } catch (err) {
    return next(err);
  }
}

async function profilAlerjenleriGetir(req, res, next) {
  try {
    const kaynaktan = req.query.kaynak === '1';
    const alerjenler = await kullaniciRepo.kullaniciAlerjenleriniGetir(req.kullanici.id, kaynaktan);
    return res.json({
      alerjenler,
      alerjen_idler: alerjenler.map((a) => a.alerjen_id),
    });
  } catch (err) {
    return next(err);
  }
}

async function profilAlerjenleriKaydet(req, res, next) {
  try {
    const hamListe = Array.isArray(req.body.alerjen_idler) ? req.body.alerjen_idler : [];
    const alerjenIdleri = [
      ...new Set(hamListe.map(Number).filter((id) => Number.isInteger(id) && id > 0)),
    ];
    await kullaniciRepo.kullaniciAlerjenleriniGuncelle(req.kullanici.id, alerjenIdleri);
    return res.json({
      alerjen_idler: alerjenIdleri,
      mesaj: 'Alerjen tercihleriniz kaydedildi.',
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  giris,
  cikis,
  ben,
  alerjenlerListele,
  profilAlerjenleriGetir,
  profilAlerjenleriKaydet,
};
