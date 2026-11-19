const express = require('express');
const rezervasyonController = require('../controllers/rezervasyonController');
const { oturumGerekli } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/rezervasyonlarim', oturumGerekli, rezervasyonController.listele);
router.post('/rezervasyonlar', oturumGerekli, rezervasyonController.olustur);
router.post('/rezervasyonlar/:id/iptal', oturumGerekli, rezervasyonController.iptalEt);

module.exports = router;
