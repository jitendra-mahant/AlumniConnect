const mongoose = require('mongoose');
const env = require('../config/env');
const connectDB = require('../config/db');
const User = require('../models/User');
const AlumniProfile = require('../models/AlumniProfile');
const StudentProfile = require('../models/StudentProfile');
const Connection = require('../models/Connection');
const MentorshipRequest = require('../models/MentorshipRequest');
const ReferralRequest = require('../models/ReferralRequest');
const Job = require('../models/Job');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const Report = require('../models/Report');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const data = require('./data');

const DAY = 24 * 60 * 60 * 1000;

/** Wipes the app collections and inserts the sample data. */
async function seedDatabase({ log = console.log } = {}) {
  await Promise.all([
    User,
    AlumniProfile,
    StudentProfile,
    Connection,
    MentorshipRequest,
    ReferralRequest,
    Job,
    Message,
    Notification,
    Report,
    Question,
    Answer,
  ].map((M) => M.deleteMany({})));

  const users = {};
  const admin = await User.create({ ...data.ADMIN, role: 'admin' });
  users.admin = admin;

  // Students
  for (const s of data.students) {
    const user = await User.create({ name: s.name, email: s.email, password: data.PASSWORD, role: 'student' });
    await StudentProfile.create({
      user: user._id, fullName: s.name, college: env.collegeName, department: s.department, degree: s.degree,
      currentYear: s.currentYear, graduationYear: s.graduationYear, location: s.location, skills: s.skills,
      interests: s.interests, careerGoals: s.careerGoals, bio: s.bio, githubUrl: s.githubUrl,
    });
    users[s.email] = user;
  }

  // Alumni
  for (const a of data.alumni) {
    const user = await User.create({ name: a.name, email: a.email, password: data.PASSWORD, role: 'alumni' });
    const { name, verificationStatus = 'verified', ...rest } = a;
    await AlumniProfile.create({
      ...rest,
      user: user._id,
      fullName: name,
      college: env.collegeName,
      batch: `${a.graduationYear - 4}-${a.graduationYear}`,
      previousCompanies: (a.experience || []).map((e) => e.company),
      previousJobTitles: (a.experience || []).map((e) => e.title),
      verificationStatus,
      verifiedAt: verificationStatus === 'verified' ? new Date() : undefined,
    });
    users[a.email] = user;
  }

  // Jobs
  const jobDocs = {};
  for (const j of data.jobs()) {
    const { poster, daysToDeadline, ...rest } = j;
    const created = await Job.create({
      ...rest,
      postedBy: users[poster]._id,
      deadline: new Date(Date.now() + daysToDeadline * DAY),
    });
    jobDocs[j.company] = created;
  }

  const u = (email) => users[email]._id;
  const s1 = 'student1@alumniconnect.edu';
  const s2 = 'student2@alumniconnect.edu';
  const s3 = 'student3@alumniconnect.edu';

  // Connections (the BFS graph is built from accepted ones)
  await Connection.insertMany([
    { requester: u(s1), recipient: u('priya.sharma@alumniconnect.edu'), status: 'accepted', message: 'Hi Priya, I would love to learn about your path to Google.', respondedAt: new Date() },
    { requester: u(s2), recipient: u('priya.sharma@alumniconnect.edu'), status: 'accepted', message: 'Hello! Looking for interview guidance.', respondedAt: new Date() },
    { requester: u(s2), recipient: u('karan.malhotra@alumniconnect.edu'), status: 'accepted', message: 'Interested in data science mentorship.', respondedAt: new Date() },
    { requester: u(s1), recipient: u('aditya.kapoor@alumniconnect.edu'), status: 'accepted', message: 'Fellow MERN enthusiast here!', respondedAt: new Date() },
    { requester: u(s3), recipient: u('ananya.bose@alumniconnect.edu'), status: 'accepted', message: 'Embedded systems student seeking advice.', respondedAt: new Date() },
    { requester: u(s1), recipient: u('neha.kulkarni@alumniconnect.edu'), status: 'pending', message: 'Your React work at Microsoft is inspiring. Would love to connect.' },
    { requester: u(s3), recipient: u('meera.joshi@alumniconnect.edu'), status: 'pending', message: 'Could we connect about higher studies?' },
  ]);

  await MentorshipRequest.insertMany([
    { student: u(s1), alumni: u('neha.kulkarni@alumniconnect.edu'), topic: 'Frontend career roadmap', message: 'I am a 3rd year student building React projects. Could you guide me on what to focus on for frontend internships?', goals: 'Get a frontend internship by Jan 2027', status: 'pending' },
    { student: u(s2), alumni: u('karan.malhotra@alumniconnect.edu'), topic: 'Breaking into data science', message: 'I have done a few Kaggle projects and want advice on building a portfolio.', goals: 'Data science role after graduation', status: 'accepted', response: 'Happy to help! Let us start with a 30 min call this weekend.', respondedAt: new Date() },
  ]);

  await ReferralRequest.insertMany([
    { student: u(s1), alumni: u('arjun.reddy@alumniconnect.edu'), job: jobDocs.TCS._id, company: 'TCS', role: 'Associate Software Engineer', message: 'I have strong React and Node skills and would be grateful for a referral to the TCS Digital drive.', resumeUrl: 'https://example.com/resume-aarav.pdf', status: 'pending' },
    { student: u(s1), alumni: u('aditya.kapoor@alumniconnect.edu'), job: jobDocs.Razorpay._id, company: 'Razorpay', role: 'Full Stack Developer (0-2 yrs)', message: 'My MERN projects are on GitHub. I would appreciate a referral.', status: 'referred', response: 'Referred you today - check your email for the next steps.', respondedAt: new Date() },
  ]);

  // Messages: Aarav <-> Priya
  const convo = Message.makeConversationId(u(s1), u('priya.sharma@alumniconnect.edu'));
  const base = Date.now() - 2 * DAY;
  await Message.insertMany([
    { conversationId: convo, sender: u(s1), recipient: u('priya.sharma@alumniconnect.edu'), text: 'Hi Priya! Thanks for accepting my request. How did you prepare for system design rounds?', createdAt: new Date(base), readAt: new Date(base + 1000) },
    { conversationId: convo, sender: u('priya.sharma@alumniconnect.edu'), recipient: u(s1), text: 'Hey Aarav! Start with the fundamentals - load balancing, caching, databases - then practice designing real apps.', createdAt: new Date(base + 3600e3), readAt: new Date(base + 7200e3) },
    { conversationId: convo, sender: u(s1), recipient: u('priya.sharma@alumniconnect.edu'), text: 'Great, I will start with a URL shortener and a chat app. Could I share my design with you?', createdAt: new Date(base + 7300e3) },
  ]);

  await Notification.insertMany([
    { user: u('neha.kulkarni@alumniconnect.edu'), type: 'connection_request', title: 'New connection request', body: 'Aarav Mehta wants to connect with you.', link: '/dashboard' },
    { user: u('neha.kulkarni@alumniconnect.edu'), type: 'mentorship_request', title: 'New mentorship request', body: 'Aarav Mehta requested mentorship on "Frontend career roadmap".', link: '/mentors' },
    { user: u('arjun.reddy@alumniconnect.edu'), type: 'referral_request', title: 'New referral request', body: 'Aarav Mehta asked for a referral for Associate Software Engineer at TCS.', link: '/referrals' },
    { user: u('priya.sharma@alumniconnect.edu'), type: 'message', title: 'New message from Aarav Mehta', body: 'Great, I will start with a URL shortener...', link: `/messages?with=${u(s1)}` },
    { user: u(s1), type: 'connection_accepted', title: 'Connection accepted', body: 'Priya Sharma accepted your connection request.', link: '/dashboard' },
    { user: u(s1), type: 'referral_update', title: 'Referral request referred', body: 'Aditya Kapoor referred your referral request for Full Stack Developer (0-2 yrs).', link: '/referrals' },
    { user: u(s1), type: 'job_posted', title: 'New internship: Frontend Engineer Intern', body: 'Microsoft · Hyderabad', link: '/jobs' },
    { user: admin._id, type: 'profile_review', title: 'Alumni profile awaiting verification', body: 'Ishaan Gupta (Project Engineer at Wipro) submitted a profile.', link: '/admin' },
  ]);

  await Report.create({
    reporter: u(s2),
    targetType: 'job',
    targetId: jobDocs.TCS._id,
    reason: 'The apply link redirects to a generic page. Please verify this posting.',
  });

  // Seed Questions and Answers
  if (data.questions && data.questions.length) {
    for (const q of data.questions) {
      const qAuthor = users[q.studentEmail];
      const question = await Question.create({
        author: qAuthor._id,
        title: q.title,
        description: q.description,
        category: q.category,
        tags: q.tags,
        status: q.status || 'open',
        views: Math.floor(Math.random() * 25) + 5,
      });

      let acceptedAnswerId = null;
      for (const a of q.answers || []) {
        const aAuthor = users[a.alumniEmail];
        const comments = (a.comments || []).map((c) => ({
          author: users[c.authorEmail]._id,
          body: c.body,
          createdAt: new Date(),
        }));

        const answer = await Answer.create({
          question: question._id,
          author: aAuthor._id,
          body: a.body,
          isAccepted: a.isAccepted || false,
          upvotes: [qAuthor._id],
          upvotesCount: 1,
          comments,
        });

        if (a.isAccepted) {
          acceptedAnswerId = answer._id;
        }
      }

      if (acceptedAnswerId) {
        question.acceptedAnswer = acceptedAnswerId;
      }
      question.answersCount = (q.answers || []).length;
      await question.save();
    }
  }

  log(
    `[seed] Created ${data.students.length} students, ${data.alumni.length} alumni (3 awaiting/rejected review), ${data.jobs().length} jobs, ${data.questions.length} questions.`
  );
  log(`[seed] Admin:    ${data.ADMIN.email} / ${data.ADMIN.password}`);
  log(`[seed] Student:  student1@alumniconnect.edu / ${data.PASSWORD}`);
  log(`[seed] Alumni:   priya.sharma@alumniconnect.edu / ${data.PASSWORD}`);
}

module.exports = { seedDatabase };

if (require.main === module) {
  const net = require('net');
  const isPortOpen = (port, host = '127.0.0.1', timeout = 800) =>
    new Promise((resolve) => {
      const s = new net.Socket();
      s.setTimeout(timeout);
      s.on('connect', () => { s.destroy(); resolve(true); });
      s.on('timeout', () => { s.destroy(); resolve(false); });
      s.on('error', () => { s.destroy(); resolve(false); });
      s.connect(port, host);
    });

  (async () => {
    try {
      const uri =
        process.env.MONGODB_URI ||
        ((await isPortOpen(27018)) ? 'mongodb://127.0.0.1:27018/alumniconnect' : env.mongoUri);
      await connectDB(uri);
      await seedDatabase();
    } catch (err) {
      console.error('[seed] failed:', err.message);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
    }
  })();
}
