const express = require('express');
const router = express.Router();
const { getPrediction, getInsights } = require('../controllers/mlController');
const { protect } = require('../middleware/authMiddleware');

router.get('/predict', protect, getPrediction);
router.get('/insights', protect, getInsights);

module.exports = router;
