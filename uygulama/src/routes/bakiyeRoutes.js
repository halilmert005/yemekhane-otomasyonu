const express = require('express');
const bakiyeController = require('../controllers/bakiyeController');
const { oturumGerekli } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/bakiye', oturumGerekli, bakiyeController.durumGetir);
router.post('/bakiye/yukle', oturumGerekli, bakiyeController.yukle);

module.exports = router;
