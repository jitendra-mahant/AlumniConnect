const router = require('express').Router();
const c = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('student'));
router.get('/profile', c.getMyProfile);
router.post('/profile', c.saveProfile);
router.put('/profile', c.saveProfile);

module.exports = router;
