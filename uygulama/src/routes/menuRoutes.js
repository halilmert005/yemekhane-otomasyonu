const express = require('express');
const menuController = require('../controllers/menuController');
const { oturumGerekli } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/referanslar', oturumGerekli, menuController.referanslar);
router.get('/menuler/gunun', oturumGerekli, menuController.gununMenusu);
router.get('/menuler/haftalik', oturumGerekli, menuController.haftalikMenuler);

module.exports = router;
