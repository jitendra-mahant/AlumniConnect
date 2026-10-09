const router = require('express').Router();
const c = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));
router.get('/stats', c.stats);
router.get('/users', c.listUsers);
router.put('/users/:id', c.updateUser);
router.delete('/users/:id', c.deleteUser);
router.get('/alumni', c.listAlumniProfiles);
router.put('/alumni/:id/verify', c.verifyAlumni);
router.get('/jobs', c.listJobs);
router.get('/reports', c.listReports);
router.put('/reports/:id', c.updateReport);

module.exports = router;
