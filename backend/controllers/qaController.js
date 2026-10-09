const Question = require('../models/Question');
const Answer = require('../models/Answer');
const AlumniProfile = require('../models/AlumniProfile');
const StudentProfile = require('../models/StudentProfile');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { assertId, escapeRegex, assertOwnerOrAdmin, toArray } = require('../utils/helpers');
const { notify } = require('../utils/notify');

// Enrich user documents with their respective role profile details
async function enrichAuthor(user) {
  if (!user) return null;
  const base = {
    _id: user._id,
    name: user.name,
    role: user.role,
  };
  if (user.role === 'alumni') {
    const prof = await AlumniProfile.findOne({ user: user._id })
      .select('currentCompany currentJobTitle professionalDomain verificationStatus')
      .lean();
    return { ...base, alumniProfile: prof || null };
  }
  if (user.role === 'student') {
    const prof = await StudentProfile.findOne({ user: user._id })
      .select('department currentYear graduationYear')
      .lean();
    return { ...base, studentProfile: prof || null };
  }
  return base;
}

// ---------------- QUESTIONS ----------------

// GET /api/qa/questions
exports.listQuestions = asyncHandler(async (req, res) => {
  const filter = {};
  const isAdmin = req.user && req.user.role === 'admin';

  if (!isAdmin) {
    filter.isHidden = false;
  } else if (req.query.hidden !== undefined) {
    filter.isHidden = req.query.hidden === 'true';
  }

  if (req.query.category && req.query.category !== 'All') {
    filter.category = req.query.category;
  }

  if (req.query.status && ['open', 'answered', 'closed'].includes(req.query.status)) {
    filter.status = req.query.status;
  }

  if (req.query.tag) {
    filter.tags = req.query.tag.toLowerCase();
  }

  if (req.query.q) {
    const re = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ title: re }, { description: re }, { tags: re }];
  }

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);

  let sort = { createdAt: -1 };
  if (req.query.sort === 'popular') sort = { views: -1, answersCount: -1 };
  else if (req.query.sort === 'unanswered') sort = { answersCount: 1, createdAt: -1 };
  else if (req.query.sort === 'votes') sort = { upvotesCount: -1, createdAt: -1 };

  const [total, docs] = await Promise.all([
    Question.countDocuments(filter),
    Question.find(filter)
      .populate('author', 'name email role')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  const enriched = await Promise.all(
    docs.map(async (doc) => {
      const author = await enrichAuthor(doc.author);
      return { ...doc, author };
    })
  );

  res.json({
    success: true,
    data: enriched,
    total,
    page,
    pages: Math.max(Math.ceil(total / limit), 1),
  });
});

// GET /api/qa/questions/:id
exports.getQuestionById = asyncHandler(async (req, res) => {
  assertId(req.params.id, 'question id');
  const question = await Question.findById(req.params.id).populate('author', 'name email role');
  if (!question) throw new ApiError(404, 'Question not found');

  const isAdmin = req.user.role === 'admin';
  const isAuthor = String(question.author._id) === String(req.user._id);

  if (question.isHidden && !isAdmin && !isAuthor) {
    throw new ApiError(404, 'Question not found or has been hidden by moderators');
  }

  // Increment view count
  await Question.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
  question.views += 1;

  // Fetch answers
  const answerFilter = { question: question._id };
  if (!isAdmin) answerFilter.isHidden = false;

  const answers = await Answer.find(answerFilter)
    .populate('author', 'name email role')
    .populate('comments.author', 'name role')
    .sort({ isAccepted: -1, upvotesCount: -1, createdAt: 1 })
    .lean();

  const enrichedAnswers = await Promise.all(
    answers.map(async (ans) => {
      const author = await enrichAuthor(ans.author);
      const isUpvoted = (ans.upvotes || []).some((u) => String(u) === String(req.user._id));
      return {
        ...ans,
        author,
        isUpvoted,
      };
    })
  );

  const enrichedAuthor = await enrichAuthor(question.author);

  res.json({
    success: true,
    data: {
      question: { ...question.toObject(), author: enrichedAuthor },
      answers: enrichedAnswers,
    },
  });
});

// POST /api/qa/questions
exports.createQuestion = asyncHandler(async (req, res) => {
  const { title, description, category, tags } = req.body;
  if (!title || title.trim().length < 5) throw new ApiError(400, 'Title must be at least 5 characters');
  if (!description || description.trim().length < 10) throw new ApiError(400, 'Description must be at least 10 characters');

  const cleanTags = toArray(tags)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 6);

  const question = await Question.create({
    author: req.user._id,
    title: title.trim(),
    description: description.trim(),
    category: category || 'General',
    tags: cleanTags,
  });

  const populated = await Question.findById(question._id).populate('author', 'name email role');
  const enrichedAuthor = await enrichAuthor(populated.author);

  res.status(201).json({
    success: true,
    data: { ...populated.toObject(), author: enrichedAuthor },
  });
});

// PUT /api/qa/questions/:id
exports.updateQuestion = asyncHandler(async (req, res) => {
  assertId(req.params.id, 'question id');
  const question = await Question.findById(req.params.id);
  if (!question) throw new ApiError(404, 'Question not found');

  assertOwnerOrAdmin(req, question.author, 'Only the author or an admin can edit this question');

  const { title, description, category, tags, status } = req.body;
  if (title) {
    if (title.trim().length < 5) throw new ApiError(400, 'Title must be at least 5 characters');
    question.title = title.trim();
  }
  if (description) {
    if (description.trim().length < 10) throw new ApiError(400, 'Description must be at least 10 characters');
    question.description = description.trim();
  }
  if (category) question.category = category;
  if (tags !== undefined) {
    question.tags = toArray(tags).map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 6);
  }
  if (status && ['open', 'answered', 'closed'].includes(status)) {
    question.status = status;
  }

  await question.save();
  const populated = await Question.findById(question._id).populate('author', 'name email role');
  res.json({ success: true, data: populated });
});

// DELETE /api/qa/questions/:id
exports.deleteQuestion = asyncHandler(async (req, res) => {
  assertId(req.params.id, 'question id');
  const question = await Question.findById(req.params.id);
  if (!question) throw new ApiError(404, 'Question not found');

  assertOwnerOrAdmin(req, question.author, 'Only the author or an admin can delete this question');

  await Answer.deleteMany({ question: question._id });
  await question.deleteOne();

  res.json({ success: true, message: 'Question and associated answers deleted successfully' });
});

// ---------------- ANSWERS ----------------

// POST /api/qa/questions/:id/answers
exports.createAnswer = asyncHandler(async (req, res) => {
  assertId(req.params.id, 'question id');
  const question = await Question.findById(req.params.id);
  if (!question) throw new ApiError(404, 'Question not found');
  if (question.status === 'closed') throw new ApiError(400, 'This question is closed and cannot receive new answers');

  // Authorization check: Only verified alumni (or admin) can post answers
  if (req.user.role === 'alumni') {
    const profile = await AlumniProfile.findOne({ user: req.user._id });
    if (!profile || profile.verificationStatus !== 'verified') {
      throw new ApiError(403, 'Only verified alumni can answer questions. Please wait for profile verification.');
    }
  } else if (req.user.role !== 'admin') {
    throw new ApiError(403, 'Only verified alumni can provide answers in this forum.');
  }

  const { body } = req.body;
  if (!body || body.trim().length < 5) throw new ApiError(400, 'Answer must be at least 5 characters');

  const answer = await Answer.create({
    question: question._id,
    author: req.user._id,
    body: body.trim(),
  });

  // Increment question answer count
  await Question.findByIdAndUpdate(question._id, { $inc: { answersCount: 1 } });

  // Notify question author if answer was posted by someone else
  if (String(question.author) !== String(req.user._id)) {
    await notify(question.author, {
      type: 'question_answered',
      title: 'New answer on your question',
      body: `${req.user.name} answered: "${question.title.slice(0, 60)}"`,
      link: `/qa/${question._id}`,
    });
  }

  const populated = await Answer.findById(answer._id).populate('author', 'name email role');
  const enrichedAuthor = await enrichAuthor(populated.author);

  res.status(201).json({
    success: true,
    data: { ...populated.toObject(), author: enrichedAuthor, isUpvoted: false },
  });
});

// PUT /api/qa/answers/:id
exports.updateAnswer = asyncHandler(async (req, res) => {
  assertId(req.params.id, 'answer id');
  const answer = await Answer.findById(req.params.id);
  if (!answer) throw new ApiError(404, 'Answer not found');

  assertOwnerOrAdmin(req, answer.author, 'Only the author or an admin can edit this answer');

  const { body } = req.body;
  if (!body || body.trim().length < 5) throw new ApiError(400, 'Answer must be at least 5 characters');

  answer.body = body.trim();
  await answer.save();

  const populated = await Answer.findById(answer._id).populate('author', 'name email role');
  res.json({ success: true, data: populated });
});

// DELETE /api/qa/answers/:id
exports.deleteAnswer = asyncHandler(async (req, res) => {
  assertId(req.params.id, 'answer id');
  const answer = await Answer.findById(req.params.id);
  if (!answer) throw new ApiError(404, 'Answer not found');

  assertOwnerOrAdmin(req, answer.author, 'Only the author or an admin can delete this answer');

  const question = await Question.findById(answer.question);
  if (question) {
    const update = { $inc: { answersCount: -1 } };
    if (String(question.acceptedAnswer) === String(answer._id)) {
      update.acceptedAnswer = null;
      update.status = 'open';
    }
    await Question.findByIdAndUpdate(question._id, update);
  }

  await answer.deleteOne();
  res.json({ success: true, message: 'Answer deleted successfully' });
});

// POST /api/qa/answers/:id/accept
exports.acceptAnswer = asyncHandler(async (req, res) => {
  assertId(req.params.id, 'answer id');
  const answer = await Answer.findById(req.params.id);
  if (!answer) throw new ApiError(404, 'Answer not found');

  const question = await Question.findById(answer.question);
  if (!question) throw new ApiError(404, 'Question not found');

  // Only question author can accept an answer
  if (String(question.author) !== String(req.user._id) && req.user.role !== 'admin') {
    throw new ApiError(403, 'Only the author of the question can mark an answer as accepted');
  }

  // Toggle acceptance
  const willBeAccepted = !answer.isAccepted;

  // Clear previous accepted answers on this question
  await Answer.updateMany({ question: question._id }, { isAccepted: false });

  if (willBeAccepted) {
    answer.isAccepted = true;
    await answer.save();
    question.acceptedAnswer = answer._id;
    question.status = 'answered';
    await question.save();

    // Notify answer author
    if (String(answer.author) !== String(req.user._id)) {
      await notify(answer.author, {
        type: 'answer_accepted',
        title: 'Your answer was marked as accepted!',
        body: `${req.user.name} accepted your solution to "${question.title.slice(0, 60)}"`,
        link: `/qa/${question._id}`,
      });
    }
  } else {
    answer.isAccepted = false;
    await answer.save();
    question.acceptedAnswer = null;
    question.status = 'open';
    await question.save();
  }

  res.json({
    success: true,
    data: { isAccepted: answer.isAccepted, questionStatus: question.status },
  });
});

// POST /api/qa/answers/:id/upvote
exports.toggleUpvoteAnswer = asyncHandler(async (req, res) => {
  assertId(req.params.id, 'answer id');
  const answer = await Answer.findById(req.params.id);
  if (!answer) throw new ApiError(404, 'Answer not found');

  const userIdStr = String(req.user._id);
  const upvotedIndex = answer.upvotes.findIndex((u) => String(u) === userIdStr);

  let upvoted = false;
  if (upvotedIndex > -1) {
    // Remove upvote
    answer.upvotes.splice(upvotedIndex, 1);
    answer.upvotesCount = Math.max(0, answer.upvotes.length);
    upvoted = false;
  } else {
    // Add upvote
    answer.upvotes.push(req.user._id);
    answer.upvotesCount = answer.upvotes.length;
    upvoted = true;
  }

  await answer.save();

  res.json({
    success: true,
    data: {
      upvoted,
      upvotesCount: answer.upvotesCount,
    },
  });
});

// POST /api/qa/answers/:id/comments
exports.addComment = asyncHandler(async (req, res) => {
  assertId(req.params.id, 'answer id');
  const answer = await Answer.findById(req.params.id);
  if (!answer) throw new ApiError(404, 'Answer not found');

  const { body } = req.body;
  if (!body || body.trim().length < 2) throw new ApiError(400, 'Comment must be at least 2 characters');

  const newComment = {
    author: req.user._id,
    body: body.trim(),
  };

  answer.comments.push(newComment);
  await answer.save();

  // Notify answer author if someone else commented
  if (String(answer.author) !== String(req.user._id)) {
    await notify(answer.author, {
      type: 'answer_reply',
      title: 'New follow-up reply on your answer',
      body: `${req.user.name} commented: "${body.trim().slice(0, 60)}"`,
      link: `/qa/${answer.question}`,
    });
  }

  const updated = await Answer.findById(answer._id)
    .populate('comments.author', 'name role')
    .lean();

  const added = updated.comments[updated.comments.length - 1];

  res.status(201).json({
    success: true,
    data: added,
  });
});

// ---------------- MODERATION (ADMIN) ----------------

// PUT /api/qa/questions/:id/moderate
exports.moderateQuestion = asyncHandler(async (req, res) => {
  assertId(req.params.id, 'question id');
  const { isHidden, moderationNote } = req.body;
  if (isHidden === undefined) throw new ApiError(400, 'isHidden is required');

  const question = await Question.findByIdAndUpdate(
    req.params.id,
    { isHidden: Boolean(isHidden), moderationNote: moderationNote || '' },
    { new: true }
  );
  if (!question) throw new ApiError(404, 'Question not found');

  res.json({ success: true, data: question });
});

// PUT /api/qa/answers/:id/moderate
exports.moderateAnswer = asyncHandler(async (req, res) => {
  assertId(req.params.id, 'answer id');
  const { isHidden, moderationNote } = req.body;
  if (isHidden === undefined) throw new ApiError(400, 'isHidden is required');

  const answer = await Answer.findByIdAndUpdate(
    req.params.id,
    { isHidden: Boolean(isHidden), moderationNote: moderationNote || '' },
    { new: true }
  );
  if (!answer) throw new ApiError(404, 'Answer not found');

  res.json({ success: true, data: answer });
});
