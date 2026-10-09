const PriorityQueue = require('./PriorityQueue');

const DAY = 24 * 60 * 60 * 1000;

/**
 * Score one job for a student. Higher is better.
 *  - skill overlap (strongest signal)
 *  - domain/interest match
 *  - referral available
 *  - freshness (newer posts rank higher)
 *  - deadline urgency (closing soon gets a small boost; expired is excluded upstream)
 */
function scoreJob(job, student = {}, now = Date.now()) {
  const wanted = (job.requiredSkills || []).map((s) => s.toLowerCase());
  const have = new Set((student.skills || []).map((s) => s.toLowerCase()));
  const matched = wanted.filter((s) => have.has(s));

  let score = matched.length * 10;
  if (wanted.length) score += (matched.length / wanted.length) * 10;

  const interests = (student.interests || []).map((s) => s.toLowerCase());
  if (job.domain && interests.some((i) => job.domain.toLowerCase().includes(i) || i.includes(job.domain.toLowerCase()))) {
    score += 8;
  }
  if (job.referralAvailable) score += 3;

  const ageDays = (now - new Date(job.createdAt).getTime()) / DAY;
  score += Math.max(0, 10 - ageDays / 3); // decays over ~30 days

  if (job.deadline) {
    const daysLeft = (new Date(job.deadline).getTime() - now) / DAY;
    if (daysLeft >= 0 && daysLeft <= 7) score += 4 - daysLeft / 2;
  }
  return { score: Math.round(score * 10) / 10, matchedSkills: matched };
}

/**
 * Rank jobs with a max-heap priority queue (O(n log n)).
 * Returns jobs (plain objects) with `matchScore` and `matchedSkills`, best first.
 */
function rankJobs(jobs, student) {
  const pq = new PriorityQueue((a, b) => b.score - a.score);
  const now = Date.now();
  for (const job of jobs) {
    const plain = typeof job.toObject === 'function' ? job.toObject() : job;
    const { score, matchedSkills } = scoreJob(plain, student, now);
    pq.push({ score, job: { ...plain, matchScore: score, matchedSkills } });
  }
  const out = [];
  while (!pq.isEmpty()) out.push(pq.pop().job);
  return out;
}

module.exports = { rankJobs, scoreJob };
