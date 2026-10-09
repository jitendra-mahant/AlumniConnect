import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  HelpCircle, MessageSquare, Eye, CheckCircle2, Plus, Search, Tag, Clock, ThumbsUp, Sparkles, Filter, X,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Avatar, EmptyState, Field, Modal, PageHeader, Pagination, Skeleton, VerifiedBadge } from '../components/ui';
import { timeAgo } from '../utils/format';

const CATEGORIES = [
  'All',
  'Career Guidance',
  'Interview Prep',
  'Higher Studies',
  'Industry Insights',
  'Internships & Referrals',
  'Tech Stack & Skills',
  'General',
];

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most Answers' },
  { value: 'unanswered', label: 'Unanswered' },
  { value: 'votes', label: 'Top Voted' },
];

export default function QA() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [params, setParams] = useSearchParams();

  const [questions, setQuestions] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filter states
  const activeCategory = params.get('category') || 'All';
  const activeSort = params.get('sort') || 'newest';
  const activeSearch = params.get('q') || '';
  const activeTag = params.get('tag') || '';
  const page = parseInt(params.get('page'), 10) || 1;

  // Search input state
  const [searchInput, setSearchInput] = useState(activeSearch);

  // Ask Question Modal
  const [askModalOpen, setAskModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Career Guidance',
    description: '',
    tags: '',
  });

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (activeCategory !== 'All') query.set('category', activeCategory);
      if (activeSort) query.set('sort', activeSort);
      if (activeSearch) query.set('q', activeSearch);
      if (activeTag) query.set('tag', activeTag);
      query.set('page', page);
      query.set('limit', 10);

      const res = await api.get(`/qa/questions?${query.toString()}`);
      setQuestions(res.data.data);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load questions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [activeCategory, activeSort, activeSearch, activeTag, page]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value && value !== 'All') {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.set('page', '1');
    setParams(next);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateParam('q', searchInput.trim());
  };

  const clearTagFilter = () => {
    updateParam('tag', '');
  };

  const handleAskSubmit = async (e) => {
    e.preventDefault();
    if (formData.title.trim().length < 5) {
      showToast('Title must be at least 5 characters', 'error');
      return;
    }
    if (formData.description.trim().length < 10) {
      showToast('Description must be at least 10 characters', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/qa/questions', {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      showToast('Question posted successfully!', 'success');
      setAskModalOpen(false);
      setFormData({ title: '', category: 'Career Guidance', description: '', tags: '' });
      loadQuestions();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to post question', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-page py-6">
      <PageHeader
        title="Alumni Q&A Forum"
        subtitle="Get career guidance, technical insights, and interview advice directly from verified alumni."
        action={
          <button onClick={() => setAskModalOpen(true)} className="btn-primary">
            <Plus className="h-4 w-4" /> Ask a Question
          </button>
        }
      />

      {/* Search and Filters Bar */}
      <div className="mb-6 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search questions by keyword, topic, or role..."
              className="input pl-10"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => { setSearchInput(''); updateParam('q', ''); }}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button type="submit" className="btn-secondary">
            Search
          </button>
        </form>

        {/* Category Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => updateParam('category', cat)}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 font-medium transition ${
                activeCategory === cat
                  ? 'bg-navy-800 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-navy-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Filter Details and Sort Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 pt-1 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">
              {total} {total === 1 ? 'Question' : 'Questions'}
            </span>
            {activeTag && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-200">
                <Tag className="h-3 w-3" /> tag: {activeTag}
                <button onClick={clearTagFilter} className="ml-1 hover:text-brand-900">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500 mr-1">Sort:</span>
            {SORTS.map((s) => (
              <button
                key={s.value}
                onClick={() => updateParam('sort', s.value)}
                className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                  activeSort === s.value
                    ? 'bg-navy-100 font-bold text-navy-900'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : questions.length === 0 ? (
        <EmptyState
          title="No questions found"
          message={
            activeSearch || activeTag || activeCategory !== 'All'
              ? 'Try adjusting your filters or search keywords.'
              : 'Be the first to ask a question to our college alumni network!'
          }
          icon={HelpCircle}
          action={
            <button onClick={() => setAskModalOpen(true)} className="btn-primary btn-sm">
              <Plus className="h-4 w-4" /> Ask a Question
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {questions.map((q) => {
            const author = q.author || {};
            const isAlum = author.role === 'alumni';
            const alumProf = author.alumniProfile;
            const studentProf = author.studentProfile;
            const hasAccepted = Boolean(q.acceptedAnswer);

            return (
              <article
                key={q._id}
                className="card p-5 hover:border-slate-300 transition-all hover:shadow-card flex flex-col justify-between"
              >
                <div>
                  {/* Author Header */}
                  <div className="flex items-center justify-between gap-2 mb-2 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <Avatar name={author.name} size="sm" />
                      <div>
                        <span className="font-semibold text-slate-800">{author.name}</span>
                        {isAlum ? (
                          <span className="ml-1 text-slate-500">
                            · {alumProf?.currentJobTitle || 'Alumnus'} {alumProf?.currentCompany ? `@ ${alumProf.currentCompany}` : ''}
                          </span>
                        ) : (
                          <span className="ml-1 text-slate-500">
                            · {studentProf?.department || 'Student'} {studentProf?.currentYear ? `(Year ${studentProf.currentYear})` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="h-3 w-3" /> {timeAgo(q.createdAt)}
                    </span>
                  </div>

                  {/* Title & Preview */}
                  <h2 className="text-base sm:text-lg font-bold text-navy-950 mb-1.5 hover:text-brand-600 transition">
                    <Link to={`/qa/${q._id}`}>{q.title}</Link>
                  </h2>
                  <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                    {q.description}
                  </p>

                  {/* Badges & Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-4">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {q.category}
                    </span>

                    {hasAccepted ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Solved
                      </span>
                    ) : q.status === 'answered' ? (
                      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
                        Answered
                      </span>
                    ) : (
                      <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                        Open
                      </span>
                    )}

                    {(q.tags || []).map((t) => (
                      <button
                        key={t}
                        onClick={() => updateParam('tag', t)}
                        className="rounded-full bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500 hover:bg-slate-200 transition"
                      >
                        #{t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Footer Stats */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                      <strong className="text-slate-700">{q.answersCount || 0}</strong> answers
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5 text-slate-400" />
                      <strong className="text-slate-700">{q.views || 0}</strong> views
                    </span>
                  </div>

                  <Link
                    to={`/qa/${q._id}`}
                    className="font-semibold text-brand-600 hover:text-brand-800 transition"
                  >
                    View Thread →
                  </Link>
                </div>
              </article>
            );
          })}

          <Pagination page={page} pages={pages} onChange={(p) => updateParam('page', String(p))} />
        </div>
      )}

      {/* Ask Question Modal */}
      <Modal
        open={askModalOpen}
        onClose={() => setAskModalOpen(false)}
        title="Ask a Question"
        wide
      >
        <form onSubmit={handleAskSubmit} className="space-y-4">
          <Field label="Question Title *" hint="Be specific and imagine you are asking another person.">
            <input
              type="text"
              required
              placeholder="e.g., How should I prepare for System Design interviews as a college student?"
              className="input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </Field>

          <Field label="Category *">
            <select
              className="input"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>

          <Field label="Detailed Description *" hint="Provide background context, what you have already tried, and what guidance you are seeking.">
            <textarea
              required
              rows={5}
              placeholder="Provide enough details for alumni to give you an actionable, high-quality answer..."
              className="input"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </Field>

          <Field label="Tags" hint="Comma-separated keywords (e.g. system design, faang, interview, resume)">
            <input
              type="text"
              placeholder="dsa, react, referral, career"
              className="input"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setAskModalOpen(false)}
              className="btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Posting...' : 'Post Question'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
