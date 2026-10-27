const router = require('express').Router();
const c = require('../controllers/teacherController');
const { protect, authorize, requireVerified } = require('../middleware/auth');

router.use(protect, authorize('teacher', 'admin'), requireVerified);

router.get('/profile', c.getMyProfile);
router.put('/profile', c.saveProfile);

router.get('/stats', c.getStats);
router.get('/students', c.getAssignedStudents);
router.get('/appointments', c.getAppointments);
router.post('/appointments', c.createAppointment);
router.put('/appointments/:id', c.updateAppointment);
router.get('/placement-overview', c.getPlacementOverview);
router.get('/groups', c.getGroups);
router.get('/groups/:id', c.getGroupById);
router.post('/groups', c.createGroup);
router.delete('/groups/:id', c.deleteGroup);
router.put('/milestones/:groupId/:milestoneId/review', c.reviewMilestone);
router.put('/groups/:id/flag', c.toggleAtRisk);
router.post('/groups/:id/milestones', c.addMilestone);

module.exports = router;
