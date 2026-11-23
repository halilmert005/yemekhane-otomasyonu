const express = require('express');
const authController = require('../controllers/authController');
const { oturumGerekli } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/giris', authController.giris);
router.post('/cikis', authController.cikis);
router.get('/ben', oturumGerekli, authController.ben);
router.get('/alerjenler', oturumGerekli, authController.alerjenlerListele);
router.get('/profil/alerjenler', oturumGerekli, authController.profilAlerjenleriGetir);
router.put('/profil/alerjenler', oturumGerekli, authController.profilAlerjenleriKaydet);

module.exports = router;
