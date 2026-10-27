const AlumniProfile = require('../models/AlumniProfile');
const StudentProfile = require('../models/StudentProfile');
const Connection = require('../models/Connection');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');
const { assertId, escapeRegex, toArray, toBool, pick, isSafeUrl } = require('../utils/helpers');
const { notifyRole } = require('../utils/notify');
const { ensureIndex, invalidate } = require('../dsa/indexService');

const SCALAR_FIELDS = [
  'fullName', 'profilePhoto', 'email', 'secondaryEmail', 'location',
  'college', 'department', 'degree', 'graduationYear', 'batch',
  'currentCompany', 'currentJobTitle', 'professionalDomain', 'experienceYears',
  'industry', 'workLocation', 'employmentType',
  'linkedinUrl', 'linkedinVisibility', 'githubUrl', 'portfolioUrl', 'bio',
];
const BOOL_FIELDS = [
  'availableForMentorship', 'availableForReferral',
  'availableForCareerGuidance', 'availableForStudentQuestions',
];
const ARRAY_FIELDS = [
  'previousCompanies', 'previousJobTitles', 'skills', 'technologies',
  'preferredMentorshipTopics', 'areasOfGuidance', 'achievements', 'certifications', 'languages',
];

// ---------- search query builder ----------

const STOP_WORDS = new Set([
  'alumni', 'alumnus', 'alumna', 'who', 'are', 'is', 'the', 'a', 'an', 'in', 'at', 'for', 'with',
  'and', 'of', 'working', 'work', 'works', 'from', 'people', 'students', 'find', 'show', 'me',
]);

// Light stemming so "engineering" also matches "Software Engineer".
const stem = (t) => (t.length >= 6 ? t.replace(/(ing|ers|er|s)$/, '') : t);

const SEARCH_FIELDS = [
  'fullName', 'currentCompany', 'currentJobTitle', 'professionalDomain', 'industry',
  'skills', 'technologies', 'department', 'location', 'workLocation',
];

/**
 * Natural-language handling for the free-text `q`:
 *   "Alumni working at TCS" -> company = TCS
 *   "Software Engineering"  -> tokens software + engineer (each may match any field)
 */
function parseFreeText(q) {
  let text = String(q || '').trim();
  let company;
  const m = text.match(/\b(?:working|works?|employed)\s+(?:at|in|for|with)\s+(.+)$/i) || text.match(/^(?:alumni\s+)?(?:at|from)\s+(.+)$/i);
  if (m) {
    company = m[1].trim();
    text = text.slice(0, m.index).trim();
  }
  const tokens = text
    .split(/[\s,]+/)
    .map((t) => t.toLowerCase())
    .filter((t) => t && !STOP_WORDS.has(t));
  return { company, tokens };
}

const rx = (v) => new RegExp(escapeRegex(v), 'i');

async function buildSearchQuery(params, { includeUnverified = false } = {}) {
  const and = [];
  const query = {};

  if (!includeUnverified) query.verificationStatus = 'verified';
  else if (params.verificationStatus) query.verificationStatus = params.verificationStatus;

  let companyFromText;
  if (params.q) {
    const { company, tokens } = parseFreeText(params.q);
    companyFromText = company;
    tokens.forEach((token) => {
      const re = rx(stem(token));
      const or = SEARCH_FIELDS.map((f) => ({ [f]: re }));
      if (/^(19|20)\d{2}$/.test(token)) or.push({ graduationYear: Number(token) });
      and.push({ $or: or });
    });
  }

  const company = params.company || companyFromText;
  if (company) and.push({ $or: [{ currentCompany: rx(company) }] });
  if (params.name) and.push({ fullName: rx(params.name) });
  if (params.jobTitle || params.title) and.push({ currentJobTitle: rx(stem((params.jobTitle || params.title).toLowerCase())) });
  if (params.domain) and.push({ professionalDomain: rx(stem(params.domain.toLowerCase())) });
  if (params.industry) and.push({ industry: rx(params.industry) });
  if (params.department) and.push({ department: rx(params.department) });
  if (params.location) and.push({ $or: [{ location: rx(params.location) }, { workLocation: rx(params.location) }] });

  // Skill / technology: O(1) hash-map lookup first, fall back to regex for partial terms.
  const skillTerms = [params.skill, params.technology].filter(Boolean);
  if (skillTerms.length) {
    const { skills } = await ensureIndex();
    for (const term of skillTerms) {
      if (skills.has(term)) {
        and.push({ _id: { $in: skills.lookup(term) } });
      } else {
        const re = rx(term);
        and.push({ $or: [{ skills: re }, { technologies: re }] });
      }
    }
  }

  if (params.graduationYear) {
    const years = toArray(params.graduationYear).map(Number).filter(Boolean);
    if (years.length) and.push({ graduationYear: { $in: years } });
  }
  if (params.minExperience !== undefined && params.minExperience !== '') {
    and.push({ experienceYears: { $gte: Number(params.minExperience) || 0 } });
  }
  if (params.maxExperience !== undefined && params.maxExperience !== '') {
    and.push({ experienceYears: { $lte: Number(params.maxExperience) } });
  }

  ['availableForMentorship', 'availableForReferral', 'availableForCareerGuidance', 'availableForStudentQuestions'].forEach((f) => {
    const b = toBool(params[f]);
    if (b !== undefined) query[f] = b;
  });

  if (and.length) query.$and = and;
  return query;
}

const SORTS = {
  experience: { experienceYears: -1, fullName: 1 },
  recent: { graduationYear: -1, fullName: 1 },
  oldest: { graduationYear: 1, fullName: 1 },
  name: { fullName: 1 },
};

// Privacy and security sanitizer enforcing LinkedIn visibility rules and strict phone omission
const sanitizeAlumni = (p, viewer) => {
  const obj = typeof p.toObject === 'function' ? p.toObject() : { ...p };
  delete obj.phone;
  delete obj.secondary_phone;
  delete obj.secondaryPhone;

  const isAdmin = viewer?.role === 'admin';
  const isOwner = viewer && String(obj.user) === String(viewer._id);

  if (!isAdmin && !isOwner) {
    delete obj.verificationNote;

    // Evaluate LinkedIn privacy settings
    let allowLinkedIn = false;
    const vis = obj.linkedinVisibility || 'private';

    if (obj.linkedinConfirmed && obj.linkedinUrl) {
      if (vis === 'all_authenticated' && viewer) {
        allowLinkedIn = true;
      } else if (vis === 'verified_students_and_alumni' && viewer && ['student', 'alumni', 'teacher'].includes(viewer.role)) {
        allowLinkedIn = true;
      } else if (vis === 'verified_alumni' && viewer && viewer.role === 'alumni') {
        allowLinkedIn = true;
      }
    }

    if (!allowLinkedIn) {
      obj.linkedinUrl = null;
      obj.linkedinProtected = true;
    }
  }

  return obj;
};

// Hide contact details from the public directory view
const publicView = (p, viewer) => {
  const obj = sanitizeAlumni(p, viewer);
  delete obj.email;
  delete obj.secondaryEmail;
  return obj;
};

// GET /api/alumni  and  GET /api/alumni/search
exports.searchAlumni = asyncHandler(async (req, res) => {
  const isAdmin = req.user?.role === 'admin';
  const query = await buildSearchQuery(req.query, { includeUnverified: isAdmin });

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);
  const sort = SORTS[req.query.sort] || SORTS.experience;

  const [total, docs] = await Promise.all([
    AlumniProfile.countDocuments(query),
    AlumniProfile.find(query).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
  ]);

  const sanitizedDocs = docs.map((d) => sanitizeAlumni(d, req.user));

  res.json({
    success: true,
    data: sanitizedDocs,
    total,
    page,
    pages: Math.max(Math.ceil(total / limit), 1),
  });
});

// GET /api/alumni/suggest?q=rea  -> Trie autocomplete over skills, companies, titles, domains
exports.suggest = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json({ success: true, data: [] });
  const { trie } = await ensureIndex();
  res.json({ success: true, data: trie.autocomplete(q, 8) });
});

// GET /api/alumni/filters  -> values to populate filter dropdowns straight from the DB
exports.filters = asyncHandler(async (_req, res) => {
  const match = { verificationStatus: 'verified' };
  const distinct = async (field) => (await AlumniProfile.distinct(field, match)).filter(Boolean).sort();
  const [departments, domains, industries, companies, locations, years] = await Promise.all([
    distinct('department'),
    distinct('professionalDomain'),
    distinct('industry'),
    distinct('currentCompany'),
    distinct('location'),
    distinct('graduationYear'),
  ]);
  const { skills } = await ensureIndex();
  res.json({
    success: true,
    data: {
      departments, domains, industries, companies, locations,
      graduationYears: years.sort((a, b) => b - a),
      topSkills: skills.topSkills(20),
    },
  });
});

// GET /api/alumni/:id
exports.getAlumni = asyncHandler(async (req, res) => {
  assertId(req.params.id, 'alumni id');
  let profile = await AlumniProfile.findById(req.params.id);
  if (!profile) {
    profile = await AlumniProfile.findOne({ user: req.params.id });
  }
  if (!profile) throw new ApiError(404, 'Alumni profile not found');

  const isOwner = Boolean(profile.user && String(profile.user) === String(req.user._id));
  const isAdmin = req.user.role === 'admin';

  // Prevent unverified users from viewing other alumni profiles
  if (!isOwner && !isAdmin && (req.user.verificationStatus === 'pending' || req.user.isVerified === false)) {
    throw new ApiError(
      403,
      'Your profile is awaiting college administrator verification. You will be notified as soon as it is approved.',
      {
        code: 'PENDING_VERIFICATION',
        verificationStatus: 'pending',
      }
    );
  }

  if (profile.verificationStatus !== 'verified' && !isOwner && !isAdmin) {
    throw new ApiError(404, 'Alumni profile not found');
  }

  // Relationship between the viewer and this alumnus.
  const conn = profile.user
    ? await Connection.findOne({
        $or: [
          { requester: req.user._id, recipient: profile.user },
          { requester: profile.user, recipient: req.user._id },
        ],
      }).lean()
    : null;

  const connected = conn && conn.status === 'accepted';
  const data = isOwner || isAdmin || connected ? sanitizeAlumni(profile.toObject(), req.user) : publicView(profile, req.user);
  if (!isAdmin && !isOwner) delete data.verificationNote;

  res.json({
    success: true,
    data,
    connection: conn
      ? {
          id: conn._id,
          status: conn.status,
          direction: String(conn.requester) === String(req.user._id) ? 'sent' : 'received',
        }
      : null,
  });
});

function applyBody(target, body) {
  // Prevent unauthorized modification of administrative and security fields
  delete body.verificationStatus;
  delete body.isVerified;
  delete body.role;
  delete body.user;

  for (const urlField of ['profilePhoto', 'linkedinUrl', 'githubUrl', 'portfolioUrl']) {
    if (body[urlField] && !isSafeUrl(body[urlField])) {
      throw new ApiError(400, `Invalid URL provided for ${urlField}. Must start with http:// or https://`);
    }
  }
  Object.assign(target, pick(body, SCALAR_FIELDS));
  BOOL_FIELDS.forEach((f) => {
    const b = toBool(body[f]);
    if (b !== undefined) target[f] = b;
  });
  ARRAY_FIELDS.forEach((f) => {
    if (body[f] !== undefined) target[f] = toArray(body[f]);
  });
  if (body.experience !== undefined) {
    const list = Array.isArray(body.experience) ? body.experience : [];
    target.experience = list
      .filter((e) => e && e.company && e.title)
      .map((e) => ({
        company: e.company,
        title: e.title,
        startYear: e.startYear ? Number(e.startYear) : undefined,
        endYear: e.endYear ? Number(e.endYear) : undefined,
        description: e.description,
      }));
    // Keep the flat arrays in sync so they remain searchable.
    target.previousCompanies = [...new Set(target.experience.map((e) => e.company))];
    target.previousJobTitles = [...new Set(target.experience.map((e) => e.title))];
  }
}

// POST /api/alumni/profile
exports.createProfile = asyncHandler(async (req, res) => {
  if (await AlumniProfile.exists({ user: req.user._id })) {
    throw new ApiError(409, 'You already have a profile. Use PUT /api/alumni/profile to update it.');
  }
  const profile = new AlumniProfile({
    user: req.user._id,
    fullName: req.user.name,
    email: req.user.email,
    college: env.collegeName,
    verificationStatus: 'pending', // only admins can verify
  });
  applyBody(profile, req.body);
  await profile.save();

  await notifyRole('admin', {
    type: 'profile_review',
    title: 'Alumni profile awaiting verification',
    body: `${profile.fullName} (${profile.currentJobTitle} at ${profile.currentCompany}) submitted a profile.`,
    link: '/admin',
  });
  invalidate();
  res.status(201).json({ success: true, data: profile });
});

// PUT /api/alumni/profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const profile = await AlumniProfile.findOne({ user: req.user._id });
  if (!profile) throw new ApiError(404, 'Profile not found. Create it first with POST /api/alumni/profile.');

  applyBody(profile, req.body);
  // A rejected profile goes back into the review queue once corrected.
  if (profile.verificationStatus === 'rejected') {
    profile.verificationStatus = 'pending';
    profile.verificationNote = undefined;
    await notifyRole('admin', {
      type: 'profile_review',
      title: 'Alumni profile resubmitted',
      body: `${profile.fullName} updated a rejected profile.`,
      link: '/admin',
    });
  }
  await profile.save();
  invalidate();
  res.json({ success: true, data: profile });
});

// GET /api/alumni/recommendations -> Personalized recommendations based on student profile
exports.getRecommendations = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;

  // 1. Get existing connections to exclude already connected / pending alumni
  const existingConnections = await Connection.find({
    $or: [{ requester: currentUserId }, { recipient: currentUserId }],
  }).select('requester recipient');

  const excludedUserIds = new Set([
    String(currentUserId),
    ...existingConnections.map((c) =>
      String(c.requester) === String(currentUserId) ? String(c.recipient) : String(c.requester)
    ),
  ]);

  // 2. Fetch student profile if user is a student
  const student = req.user.role === 'student' ? await StudentProfile.findOne({ user: currentUserId }) : null;
  const studentSkills = new Set((student?.skills || []).map((s) => s.toLowerCase()));
  const studentInterests = new Set((student?.interests || []).map((i) => i.toLowerCase()));
  const studentDept = student?.department ? student.department.toLowerCase() : null;

  // 3. Fetch all verified alumni
  const alumniList = await AlumniProfile.find({
    verificationStatus: 'verified',
    user: { $nin: Array.from(excludedUserIds) },
  }).lean();

  // 4. Score each alumnus
  const scored = alumniList.map((alumnus) => {
    let score = 0;
    const matchReasons = [];

    // Department match
    if (studentDept && alumnus.department && alumnus.department.toLowerCase() === studentDept) {
      score += 4;
      matchReasons.push(`Same department (${alumnus.department})`);
    }

    // Skill & technology overlap
    const alumnusSkills = [...(alumnus.skills || []), ...(alumnus.technologies || [])].map((s) => s.toLowerCase());
    const matchedSkills = alumnusSkills.filter((s) => studentSkills.has(s) || studentInterests.has(s));
    if (matchedSkills.length > 0) {
      score += matchedSkills.length * 3;
      const uniqueMatched = [...new Set(matchedSkills)].slice(0, 3);
      matchReasons.push(`Shares skills: ${uniqueMatched.join(', ')}`);
    }

    // Availability for mentorship
    if (alumnus.availableForMentorship) {
      score += 2;
      matchReasons.push('Available for mentorship');
    }

    // Availability for referral
    if (alumnus.availableForReferral) {
      score += 1;
      matchReasons.push('Open to referrals');
    }

    // Experience boost
    if (alumnus.experienceYears && alumnus.experienceYears >= 3) {
      score += 1;
    }

    // Default reason if score was purely baseline
    if (matchReasons.length === 0) {
      if (alumnus.currentCompany) matchReasons.push(`Works at ${alumnus.currentCompany}`);
      else matchReasons.push(`Class of ${alumnus.graduationYear}`);
    }

    return {
      alumnus: publicView(alumnus),
      score,
      matchReasons,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 8).map((item) => ({
    ...item.alumnus,
    matchScore: item.score,
    matchReasons: item.matchReasons,
  }));

  res.json({ success: true, data: top });
});

// GET /api/alumni/company-directory
// Groups all verified alumni by company, supporting search, batch, role, and department filters
exports.companyDirectory = asyncHandler(async (req, res) => {
  const isAdmin = req.user?.role === 'admin';
  const query = await buildSearchQuery(req.query, { includeUnverified: isAdmin });

  const docs = await AlumniProfile.find(query).sort({ fullName: 1 }).lean();
  const sanitized = docs.map((d) => sanitizeAlumni(d, req.user));

  const map = new Map();
  for (const a of sanitized) {
    const comp = (a.currentCompany || '').trim() || 'Company Not Specified';
    if (!map.has(comp)) {
      map.set(comp, {
        company: comp,
        count: 0,
        alumni: [],
      });
    }
    const group = map.get(comp);
    group.count += 1;
    group.alumni.push({
      _id: a._id,
      fullName: a.fullName,
      currentJobTitle: a.currentJobTitle || 'Role Not Specified',
      graduationYear: a.graduationYear,
      batch: a.batch || String(a.graduationYear || '2022'),
      department: a.department,
      skills: a.skills || [],
      profilePhoto: a.profilePhoto || '',
      linkedinUrl: a.linkedinUrl,
      linkedinProtected: !!a.linkedinProtected,
      verificationStatus: a.verificationStatus,
      availableForMentorship: !!a.availableForMentorship,
      availableForReferral: !!a.availableForReferral,
    });
  }

  // Sort companies: highest alumni count first; 'Company Not Specified' placed cleanly at end
  const list = Array.from(map.values()).sort((a, b) => {
    if (a.company === 'Company Not Specified') return 1;
    if (b.company === 'Company Not Specified') return -1;
    return b.count - a.count || a.company.localeCompare(b.company);
  });

  res.json({
    success: true,
    totalAlumni: sanitized.length,
    totalCompanies: list.length,
    data: list,
  });
});

// PUT /api/alumni/profile/privacy
// Updates LinkedIn visibility settings and confirmation status
exports.updatePrivacy = asyncHandler(async (req, res) => {
  const { linkedinVisibility, linkedinConfirmed } = req.body;
  const validVis = ['private', 'verified_alumni', 'verified_students_and_alumni', 'all_authenticated'];
  if (linkedinVisibility && !validVis.includes(linkedinVisibility)) {
    throw new ApiError(400, 'Invalid linkedin visibility setting');
  }

  const profile = await AlumniProfile.findOne({ user: req.user._id });
  if (!profile) throw new ApiError(404, 'Alumni profile not found');

  if (linkedinVisibility) profile.linkedinVisibility = linkedinVisibility;
  if (typeof linkedinConfirmed === 'boolean') profile.linkedinConfirmed = linkedinConfirmed;
  await profile.save();

  res.json({
    success: true,
    data: sanitizeAlumni(profile, req.user),
    message: 'Privacy settings updated successfully',
  });
});

// GET /api/alumni/year-overview
// Groups all verified alumni by graduation year and computes dynamic year-wise statistics
exports.yearOverview = asyncHandler(async (req, res) => {
  const isAdmin = req.user?.role === 'admin';
  const query = await buildSearchQuery(req.query, { includeUnverified: isAdmin });

  const docs = await AlumniProfile.find(query).sort({ graduationYear: -1, fullName: 1 }).lean();
  const sanitized = docs.map((d) => sanitizeAlumni(d, req.user));

  // Distinct graduation years in database for dropdown filter
  const allYears = (await AlumniProfile.distinct('graduationYear')).filter(Boolean).sort((a, b) => b - a);

  // Group by graduationYear
  const map = new Map();
  for (const a of sanitized) {
    const yr = a.graduationYear ? String(a.graduationYear) : 'Year Not Specified';
    if (!map.has(yr)) {
      map.set(yr, {
        year: yr,
        count: 0,
        companies: new Set(),
        roles: new Set(),
        departments: new Set(),
        alumni: [],
      });
    }
    const group = map.get(yr);
    group.count += 1;
    if (a.currentCompany && a.currentCompany !== 'Company Not Specified') {
      group.companies.add(a.currentCompany);
    }
    if (a.currentJobTitle && a.currentJobTitle !== 'Role Not Specified') {
      group.roles.add(a.currentJobTitle);
    }
    if (a.department) {
      group.departments.add(a.department);
    }
    group.alumni.push({
      _id: a._id,
      fullName: a.fullName,
      currentCompany: a.currentCompany || 'Company Not Specified',
      currentJobTitle: a.currentJobTitle || 'Role Not Specified',
      graduationYear: a.graduationYear,
      batch: a.batch || (a.graduationYear ? String(a.graduationYear) : 'N/A'),
      department: a.department,
      skills: a.skills || [],
      profilePhoto: a.profilePhoto || '',
      linkedinUrl: a.linkedinUrl,
      linkedinProtected: !!a.linkedinProtected,
      verificationStatus: a.verificationStatus,
      availableForMentorship: !!a.availableForMentorship,
      availableForReferral: !!a.availableForReferral,
    });
  }

  // Convert to array and sort: recent years first, unspecified at end
  const list = Array.from(map.values()).map((g) => ({
    year: g.year,
    count: g.count,
    distinctCompanies: g.companies.size,
    topCompanies: Array.from(g.companies).slice(0, 6),
    distinctRoles: g.roles.size,
    departments: Array.from(g.departments),
    alumni: g.alumni,
  })).sort((a, b) => {
    if (a.year === 'Year Not Specified') return 1;
    if (b.year === 'Year Not Specified') return -1;
    return Number(b.year) - Number(a.year);
  });

  res.json({
    success: true,
    totalAlumni: sanitized.length,
    totalBatches: list.length,
    availableYears: allYears,
    data: list,
  });
});

exports.sanitizeAlumni = sanitizeAlumni;
exports.buildSearchQuery = buildSearchQuery;
