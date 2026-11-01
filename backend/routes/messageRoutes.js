const router = require('express').Router();
const c = require('../controllers/messageController');
const { protect, authorize, requireVerified } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many messaging requests. Please wait a moment.' },
});

router.use(protect, requireVerified, authorize('student', 'alumni', 'teacher', 'admin'));
router.use(messageLimiter);
router.post('/', c.sendMessage);
router.get('/conversations', c.conversations);
router.get('/directory', c.directory);
router.get('/groups', c.groups);
router.get('/groups/:groupId', c.groupThread);
router.post('/conversations', c.openConversation);
router.get('/:userId', c.thread);

module.exports = router;
