const oturumService = require('../services/oturumService');

function tokenCikar(req) {
  if (req.cookies && req.cookies.oturum_token) {
    return req.cookies.oturum_token;
  }
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  return null;
}

async function oturumGerekli(req, res, next) {
  try {
    const token = tokenCikar(req);
    const oturum = await oturumService.dogrula(token);
    if (!oturum) {
      return res.status(401).json({ hata: 'Oturum açmanız gerekiyor.' });
    }
    req.oturumToken = token;
    req.kullanici = oturum;
    return next();
  } catch (err) {
    return next(err);
  }
}

function yoneticiGerekli(req, res, next) {
  if (!req.kullanici || req.kullanici.rol !== 'yonetici') {
    return res.status(403).json({ hata: 'Bu işlem için yönetici yetkisi gerekir.' });
  }
  return next();
}

module.exports = {
  tokenCikar,
  oturumGerekli,
  yoneticiGerekli,
};
