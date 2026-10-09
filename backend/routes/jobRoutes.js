const router = require('express').Router();
const c = require('../controllers/jobController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.post('/', authorize('alumni', 'admin'), c.createJob);
router.get('/', c.listJobs);
router.get('/saved', authorize('student'), c.savedJobs);
router.get('/:id', c.getJob);
router.put('/:id', authorize('alumni', 'admin'), c.updateJob);
router.delete('/:id', authorize('alumni', 'admin'), c.deleteJob);
router.post('/:id/save', authorize('student'), c.toggleSave);

module.exports = router;
