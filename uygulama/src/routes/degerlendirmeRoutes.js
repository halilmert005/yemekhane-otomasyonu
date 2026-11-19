const express = require('express');
const degerlendirmeController = require('../controllers/degerlendirmeController');
const { oturumGerekli } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/degerlendirmeler', oturumGerekli, degerlendirmeController.listele);
router.post('/degerlendirmeler', oturumGerekli, degerlendirmeController.ekle);

module.exports = router;
