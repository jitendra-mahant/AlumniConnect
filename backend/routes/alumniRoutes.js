const router = require('express').Router();
const c = require('../controllers/alumniController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Static paths must be declared before "/:id".
router.get('/search', c.searchAlumni);
router.get('/suggest', c.suggest);
router.get('/filters', c.filters);
router.get('/recommendations', c.getRecommendations);
router.post('/profile', authorize('alumni'), c.createProfile);
router.put('/profile', authorize('alumni'), c.updateProfile);

router.get('/', c.searchAlumni);
router.get('/:id', c.getAlumni);

module.exports = router;
