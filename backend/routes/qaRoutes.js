const router = require('express').Router();
const c = require('../controllers/qaController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Questions
router.get('/questions', c.listQuestions);
router.get('/questions/:id', c.getQuestionById);
router.post('/questions', c.createQuestion);
router.put('/questions/:id', c.updateQuestion);
router.delete('/questions/:id', c.deleteQuestion);

// Answers
router.post('/questions/:id/answers', c.createAnswer);
router.put('/answers/:id', c.updateAnswer);
router.delete('/answers/:id', c.deleteAnswer);
router.post('/answers/:id/accept', c.acceptAnswer);
router.post('/answers/:id/upvote', c.toggleUpvoteAnswer);
router.post('/answers/:id/comments', c.addComment);

// Admin Moderation
router.put('/questions/:id/moderate', authorize('admin'), c.moderateQuestion);
router.put('/answers/:id/moderate', authorize('admin'), c.moderateAnswer);

module.exports = router;
