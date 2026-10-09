import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, CheckCircle2, Clock, Edit2, Flag, MessageSquare,
  MoreVertical, Send, ThumbsUp, Trash2, UserCheck, ShieldAlert,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Avatar, EmptyState, Field, Modal, PageLoader, StatusBadge, VerifiedBadge,
} from '../components/ui';
import { timeAgo } from '../utils/format';

export default function QADetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // New Answer Form
  const [newAnswerBody, setNewAnswerBody] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  // Follow-up Comment Form (keyed by answerId)
  const [activeCommentAnswerId, setActiveCommentAnswerId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Report Modal
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState({ type: 'question', id: null });
  const [reportReason, setReportReason] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  // Edit Question Modal
  const [editQuestionOpen, setEditQuestionOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('General');
  const [editTags, setEditTags] = useState('');
  const [savingQuestion, setSavingQuestion] = useState(false);

  const loadQuestion = async () => {
    try {
      const res = await api.get(`/qa/questions/${id}`);
      setData(res.data.data);
      if (res.data.data.question) {
        setEditTitle(res.data.data.question.title);
        setEditDescription(res.data.data.question.description);
        setEditCategory(res.data.data.question.category);
        setEditTags((res.data.data.question.tags || []).join(', '));
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load question details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestion();
  }, [id]);

  if (loading) return <PageLoader label="Loading discussion..." />;
  if (!data?.question) {
    return (
      <div className="container-page py-10">
        <EmptyState
          title="Question not found"
          message="This question may have been removed or does not exist."
          action={
            <Link to="/qa" className="btn-secondary btn-sm">
              <ArrowLeft className="h-4 w-4" /> Back to Q&A
            </Link>
          }
        />
      </div>
    );
  }

  const { question, answers } = data;
  const isQuestionAuthor = String(question.author?._id) === String(user._id);
  const isAdmin = user.role === 'admin';
  const isAlumni = user.role === 'alumni';

  // Handling Answer Submission
  const handlePostAnswer = async (e) => {
    e.preventDefault();
    if (newAnswerBody.trim().length < 5) {
      showToast('Answer must be at least 5 characters', 'error');
      return;
    }

    setSubmittingAnswer(true);
    try {
      await api.post(`/qa/questions/${question._id}/answers`, {
        body: newAnswerBody.trim(),
      });
      showToast('Answer posted successfully!', 'success');
      setNewAnswerBody('');
      loadQuestion();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to post answer', 'error');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Upvote Answer Toggle
  const handleToggleUpvote = async (answerId) => {
    try {
      const res = await api.post(`/qa/answers/${answerId}/upvote`);
      setData((prev) => ({
        ...prev,
        answers: prev.answers.map((a) =>
          a._id === answerId
            ? { ...a, isUpvoted: res.data.data.upvoted, upvotesCount: res.data.data.upvotesCount }
            : a
        ),
      }));
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to upvote', 'error');
    }
  };

  // Accept / Unaccept Answer
  const handleToggleAccept = async (answerId) => {
    try {
      const res = await api.post(`/qa/answers/${answerId}/accept`);
      showToast(res.data.data.isAccepted ? 'Answer marked as accepted!' : 'Answer unmarked.', 'success');
      loadQuestion();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update answer acceptance', 'error');
    }
  };

  // Delete Answer
  const handleDeleteAnswer = async (answerId) => {
    if (!window.confirm('Are you sure you want to delete this answer?')) return;
    try {
      await api.delete(`/qa/answers/${answerId}`);
      showToast('Answer deleted', 'success');
      loadQuestion();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete answer', 'error');
    }
  };

  // Post Follow-Up Comment
  const handlePostComment = async (answerId) => {
    if (commentText.trim().length < 2) {
      showToast('Comment must be at least 2 characters', 'error');
      return;
    }

    setSubmittingComment(true);
    try {
      await api.post(`/qa/answers/${answerId}/comments`, {
        body: commentText.trim(),
      });
      showToast('Comment added!', 'success');
      setCommentText('');
      setActiveCommentAnswerId(null);
      loadQuestion();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to post comment', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Delete Question
  const handleDeleteQuestion = async () => {
    if (!window.confirm('Are you sure you want to delete this question? All answers will also be removed.')) return;
    try {
      await api.delete(`/qa/questions/${question._id}`);
      showToast('Question deleted successfully', 'success');
      navigate('/qa');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete question', 'error');
    }
  };

  // Save Edited Question
  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    setSavingQuestion(true);
    try {
      await api.put(`/qa/questions/${question._id}`, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        category: editCategory,
        tags: editTags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      showToast('Question updated', 'success');
      setEditQuestionOpen(false);
      loadQuestion();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update question', 'error');
    } finally {
      setSavingQuestion(false);
    }
  };

  // Submit Report
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportReason.trim()) {
      showToast('Please provide a reason for reporting', 'error');
      return;
    }

    setSubmittingReport(true);
    try {
      await api.post('/reports', {
        targetType: reportTarget.type,
        targetId: reportTarget.id,
        reason: reportReason.trim(),
      });
      showToast('Report submitted. Admins will review this content.', 'success');
      setReportModalOpen(false);
      setReportReason('');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit report', 'error');
    } finally {
      setSubmittingReport(false);
    }
  };

  const openReport = (type, targetId) => {
    setReportTarget({ type, id: targetId });
    setReportReason('');
    setReportModalOpen(true);
  };

  return (
    <div className="container-page py-6 max-w-4xl">
      {/* Back Link */}
      <div className="mb-4">
        <Link to="/qa" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-navy-900 transition">
          <ArrowLeft className="h-4 w-4" /> Back to All Questions
        </Link>
      </div>

      {/* Main Question Card */}
      <article className="card p-6 mb-8 border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
              {question.category}
            </span>
            <StatusBadge status={question.status} />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Asked {timeAgo(question.createdAt)}
            </span>
            <span>·</span>
            <span>{question.views || 0} views</span>
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold text-navy-950 mb-4 leading-snug">
          {question.title}
        </h1>

        {/* Author Bio Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 text-sm">
          <div className="flex items-center gap-3">
            <Avatar name={question.author?.name} size="md" />
            <div>
              <p className="font-semibold text-slate-800">{question.author?.name}</p>
              <p className="text-xs text-slate-500">
                {question.author?.role === 'alumni'
                  ? `${question.author?.alumniProfile?.currentJobTitle || 'Alumnus'} ${
                      question.author?.alumniProfile?.currentCompany ? `@ ${question.author.alumniProfile.currentCompany}` : ''
                    }`
                  : `${question.author?.studentProfile?.department || 'Student'} ${
                      question.author?.studentProfile?.currentYear ? `· Year ${question.author.studentProfile.currentYear}` : ''
                    }`}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {(isQuestionAuthor || isAdmin) && (
              <>
                <button
                  onClick={() => setEditQuestionOpen(true)}
                  className="btn-ghost !p-2 text-slate-500 hover:text-navy-900"
                  title="Edit Question"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={handleDeleteQuestion}
                  className="btn-ghost !p-2 text-red-500 hover:bg-red-50"
                  title="Delete Question"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
            <button
              onClick={() => openReport('question', question._id)}
              className="btn-ghost !p-2 text-slate-400 hover:text-slate-600"
              title="Report Question"
            >
              <Flag className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Question Body */}
        <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-wrap text-sm sm:text-base leading-relaxed mb-6">
          {question.description}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
          {(question.tags || []).map((t) => (
            <Link
              key={t}
              to={`/qa?tag=${encodeURIComponent(t)}`}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 transition"
            >
              #{t}
            </Link>
          ))}
        </div>
      </article>

      {/* Answers Section */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-navy-950 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-brand-600" />
            {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
          </h2>
        </div>

        {answers.length === 0 ? (
          <div className="card p-8 text-center text-slate-500 mb-8 border-dashed">
            <p className="font-semibold text-slate-700">No answers yet.</p>
            <p className="text-sm mt-1">Verified alumni are notified of questions in their domain.</p>
          </div>
        ) : (
          <div className="space-y-6 mb-8">
            {answers.map((ans) => {
              const ansAuthor = ans.author || {};
              const alumProf = ansAuthor.alumniProfile;
              const isAccepted = ans.isAccepted;
              const isAnsAuthor = String(ansAuthor._id) === String(user._id);

              return (
                <article
                  key={ans._id}
                  className={`card p-6 transition-all ${
                    isAccepted
                      ? 'border-emerald-300 bg-emerald-50/20 ring-1 ring-emerald-200'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Accepted Badge */}
                  {isAccepted && (
                    <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Accepted Answer
                    </div>
                  )}

                  {/* Answer Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={ansAuthor.name} size="md" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{ansAuthor.name}</span>
                          <VerifiedBadge />
                        </div>
                        <p className="text-xs text-slate-500">
                          {alumProf?.currentJobTitle || 'Alumni'}
                          {alumProf?.currentCompany ? ` at ${alumProf.currentCompany}` : ''}
                          {' · '}
                          {timeAgo(ans.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {(isAnsAuthor || isAdmin) && (
                        <button
                          onClick={() => handleDeleteAnswer(ans._id)}
                          className="btn-ghost !p-1.5 text-red-500 hover:bg-red-50"
                          title="Delete Answer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => openReport('answer', ans._id)}
                        className="btn-ghost !p-1.5 text-slate-400 hover:text-slate-600"
                        title="Report Answer"
                      >
                        <Flag className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Answer Body */}
                  <div className="prose prose-slate max-w-none text-slate-800 whitespace-pre-wrap text-sm sm:text-base leading-relaxed mb-5">
                    {ans.body}
                  </div>

                  {/* Actions & Upvote Bar */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleUpvote(ans._id)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition ${
                          ans.isUpvoted
                            ? 'bg-brand-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                        Helpful ({ans.upvotesCount || 0})
                      </button>

                      {/* Question Author Accept Button */}
                      {(isQuestionAuthor || isAdmin) && (
                        <button
                          onClick={() => handleToggleAccept(ans._id)}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition ${
                            isAccepted
                              ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                              : 'bg-slate-100 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          {isAccepted ? 'Accepted' : 'Mark as Accepted'}
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() =>
                        setActiveCommentAnswerId(
                          activeCommentAnswerId === ans._id ? null : ans._id
                        )
                      }
                      className="font-semibold text-brand-600 hover:text-brand-800 transition"
                    >
                      {activeCommentAnswerId === ans._id ? 'Cancel Reply' : 'Reply / Ask Follow-up'}
                    </button>
                  </div>

                  {/* Comments / Follow-ups Section */}
                  {((ans.comments && ans.comments.length > 0) || activeCommentAnswerId === ans._id) && (
                    <div className="mt-4 border-t border-slate-100 pt-3 bg-slate-50/60 rounded-lg p-3 space-y-3">
                      {(ans.comments || []).map((c) => (
                        <div key={c._id} className="text-xs text-slate-700 border-b border-slate-100 last:border-none pb-2 last:pb-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-navy-950">
                              {c.author?.name}
                              <span className="ml-1 text-[11px] text-slate-400 capitalize">({c.author?.role})</span>
                            </span>
                            <span className="text-[11px] text-slate-400">{timeAgo(c.createdAt)}</span>
                          </div>
                          <p className="text-slate-600 whitespace-pre-wrap">{c.body}</p>
                        </div>
                      ))}

                      {/* Follow-up comment input form */}
                      {activeCommentAnswerId === ans._id && (
                        <div className="pt-2">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Ask a clarifying follow-up question or add a comment..."
                              className="input text-xs flex-1"
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handlePostComment(ans._id);
                              }}
                            />
                            <button
                              onClick={() => handlePostComment(ans._id)}
                              disabled={submittingComment}
                              className="btn-primary btn-sm"
                            >
                              <Send className="h-3.5 w-3.5" /> Post
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {/* Write an Answer Section */}
        <div className="card p-6 border-slate-200">
          <h3 className="text-base font-bold text-navy-950 mb-2">Your Answer</h3>
          {isAlumni || isAdmin ? (
            <form onSubmit={handlePostAnswer} className="space-y-4">
              <Field hint="Share actionable advice, industry experience, or specific resources.">
                <textarea
                  rows={5}
                  required
                  placeholder="Write your answer to guide the student..."
                  className="input"
                  value={newAnswerBody}
                  onChange={(e) => setNewAnswerBody(e.target.value)}
                />
              </Field>
              <div className="flex justify-end">
                <button type="submit" disabled={submittingAnswer} className="btn-primary">
                  {submittingAnswer ? 'Posting Answer...' : 'Post Answer'}
                </button>
              </div>
            </form>
          ) : (
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-sm text-slate-600">
              <p className="font-semibold text-navy-900 mb-1">
                Verified Alumni Answers Only
              </p>
              <p>
                To maintain high guidance quality, primary answers are submitted by verified alumni.
                As a student, you can post follow-up questions in the replies section of any existing answer.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Edit Question Modal */}
      <Modal
        open={editQuestionOpen}
        onClose={() => setEditQuestionOpen(false)}
        title="Edit Question"
        wide
      >
        <form onSubmit={handleSaveQuestion} className="space-y-4">
          <Field label="Question Title *">
            <input
              type="text"
              required
              className="input"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
          </Field>
          <Field label="Category *">
            <select
              className="input"
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
            >
              {[
                'Career Guidance', 'Interview Prep', 'Higher Studies',
                'Industry Insights', 'Internships & Referrals', 'Tech Stack & Skills', 'General',
              ].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Detailed Description *">
            <textarea
              rows={5}
              required
              className="input"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />
          </Field>
          <Field label="Tags">
            <input
              type="text"
              className="input"
              value={editTags}
              onChange={(e) => setEditTags(e.target.value)}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditQuestionOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={savingQuestion}>
              {savingQuestion ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Report Modal */}
      <Modal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title={`Report ${reportTarget.type === 'question' ? 'Question' : 'Answer'}`}
      >
        <form onSubmit={handleReportSubmit} className="space-y-4">
          <p className="text-sm text-slate-600">
            Please describe why this content violates community guidelines (e.g. spam, harassment, incorrect information).
          </p>
          <Field label="Reason *">
            <textarea
              rows={4}
              required
              placeholder="Provide context for moderators..."
              className="input"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setReportModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submittingReport}>
              {submittingReport ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
