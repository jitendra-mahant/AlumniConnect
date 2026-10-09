const router = require('express').Router();
const c = require('../controllers/connectionController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('student', 'alumni'));
router.post('/', authorize('student'), c.createConnection);
router.get('/', c.listConnections);
router.get('/path/:userId', c.connectionPath);
router.put('/:id', authorize('alumni'), c.respondToConnection);

module.exports = router;
