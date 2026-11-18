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
    const kullanici = await kullaniciRepo.idIleGetir(req.kullanici.id, kaynaktan);
    if (!kullanici) {
      throw new UygulamaHatasi(404, 'Kullanıcı bulunamadı.');
    }
    return res.json({ kullanici });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  giris,
  cikis,
  ben,
};
