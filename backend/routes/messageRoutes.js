const router = require('express').Router();
const c = require('../controllers/messageController');
const { protect, authorize, requireVerified } = require('../middleware/auth');

router.use(protect, requireVerified, authorize('student', 'alumni', 'teacher'));
router.post('/', c.sendMessage);
router.get('/conversations', c.conversations);
router.get('/:userId', c.thread);

module.exports = router;
