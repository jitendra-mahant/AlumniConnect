const router = require('express').Router();
const c = require('../controllers/mentorshipController');
const { protect, authorize, requireVerified } = require('../middleware/auth');

router.use(protect, requireVerified);
router.post('/', authorize('student'), c.createRequest);
router.get('/', c.listRequests);
router.put('/:id', authorize('student', 'alumni'), c.updateRequest);

module.exports = router;
