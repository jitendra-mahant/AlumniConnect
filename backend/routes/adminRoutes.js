const router = require('express').Router();
const c = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));
router.get('/stats', c.stats);
router.get('/users', c.listUsers);
router.put('/users/:id', c.updateUser);
router.put('/users/:id/verify', c.verifyUser);
router.delete('/users/:id', c.deleteUser);
router.get('/alumni', c.listAlumniProfiles);
router.put('/alumni/:id/verify', c.verifyAlumni);
router.get('/jobs', c.listJobs);
router.get('/reports', c.listReports);
router.get('/reports/summary', c.reportSummary);
router.put('/reports/:id', c.updateReport);
router.get('/email-status', c.emailStatus);
router.post('/test-email', c.sendTestEmail);
router.get('/data-cleanup/dry-run', c.dataCleanupDryRun);
router.post('/data-cleanup/execute', c.dataCleanupExecute);
router.get('/alumni-2022/summary', c.alumni2022Summary);
router.put('/alumni-2022/correct-company', c.correctCompanyVariant);
router.get('/export/alumni', c.exportAlumni);
router.get('/recovery-requests', c.listRecoveryRequests);
router.put('/recovery-requests/:id/approve', c.approveRecoveryRequest);
router.put('/recovery-requests/:id/reject', c.rejectRecoveryRequest);

module.exports = router;
