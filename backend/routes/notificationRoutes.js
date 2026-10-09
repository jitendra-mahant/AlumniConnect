const router = require('express').Router();
const c = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', c.list);
router.get('/unread-count', c.unreadCount);
router.put('/read-all', c.markAllRead);
router.put('/:id/read', c.markRead);

module.exports = router;
