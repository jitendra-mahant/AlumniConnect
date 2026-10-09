const router = require('express').Router();
const c = require('../controllers/messageController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('student', 'alumni'));
router.post('/', c.sendMessage);
router.get('/conversations', c.conversations);
router.get('/:userId', c.thread);

module.exports = router;
