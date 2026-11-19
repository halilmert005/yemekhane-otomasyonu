const express = require('express');
const yoneticiController = require('../controllers/yoneticiController');
const { oturumGerekli, yoneticiGerekli } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(oturumGerekli, yoneticiGerekli);

router.get('/yemekler', yoneticiController.yemekleriListele);
router.get('/menuler', yoneticiController.menuleriListele);
router.post('/menuler', yoneticiController.menuOlustur);
router.put('/menuler/:id', yoneticiController.menuGuncelle);

module.exports = router;
