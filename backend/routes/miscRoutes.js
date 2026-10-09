const router = require('express').Router();
const admin = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const { invalidate } = require('../dsa/indexService');

// Public landing-page numbers.
router.get('/public/stats', admin.publicStats);
// Any signed-in user can report content for admin review.
router.post('/reports', protect, admin.createReport);
// Admin can force index rebuild
router.post('/admin/reindex', protect, authorize('admin'), (_req, res) => {
  invalidate();
  res.json({ success: true, message: 'Indexes invalidated' });
});

module.exports = router;
