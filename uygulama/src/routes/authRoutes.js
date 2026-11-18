const express = require('express');
const authController = require('../controllers/authController');
const { oturumGerekli } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/giris', authController.giris);
router.post('/cikis', authController.cikis);
router.get('/ben', oturumGerekli, authController.ben);

module.exports = router;
