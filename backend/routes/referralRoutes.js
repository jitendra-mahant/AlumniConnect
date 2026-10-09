const router = require('express').Router();
const c = require('../controllers/referralController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.post('/', authorize('student'), c.createRequest);
router.get('/', c.listRequests);
router.put('/:id', authorize('student', 'alumni'), c.updateRequest);

module.exports = router;
