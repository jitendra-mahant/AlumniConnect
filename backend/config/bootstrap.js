const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const AlumniProfile = require('../models/AlumniProfile');
const TeacherProfile = require('../models/TeacherProfile');
const ProjectGroup = require('../models/ProjectGroup');

const PRIMARY_ADMIN = {
  name: 'KKWAGH Administrator',
  email: process.env.ADMIN_EMAIL || 'admin@kkwagh.edu.in',
  password: process.env.ADMIN_PASSWORD || 'admin@123',
  role: 'admin',
  status: 'active',
  isVerified: true,
  verificationStatus: 'verified',
  institution: 'K.K. Wagh Institute of Engineering Education & Research (KKWAGH)',
};

const PRIMARY_TEACHER = {
  name: 'Placement Office & Faculty Guide',
  email: 'guide@kkwagh.edu.in',
  password: 'guide@123',
  role: 'teacher',
  status: 'active',
  isVerified: true,
  verificationStatus: 'verified',
  institution: 'K.K. Wagh Institute of Engineering Education & Research (KKWAGH)',
};

const PRIMARY_STUDENT = {
  name: 'Aarav Mehta (Student Demo)',
  email: 'student@kkwagh.edu.in',
  password: 'student@123',
  role: 'student',
  status: 'active',
  isVerified: true,
  verificationStatus: 'verified',
  institution: 'K.K. Wagh Institute of Engineering Education & Research (KKWAGH)',
};

const PRIMARY_ALUMNI = {
  name: 'Priya Sharma (Alumnus Demo)',
  email: 'alumni@kkwagh.edu.in',
  password: 'alumni@123',
  role: 'alumni',
  status: 'active',
  isVerified: true,
  verificationStatus: 'verified',
  institution: 'K.K. Wagh Institute of Engineering Education & Research (KKWAGH)',
};

/**
 * Idempotently ensures primary administrator, demo teacher, demo student, demo alumni, and initial project groups exist.
 */
async function bootstrapPrimaryAdmin() {
  try {
    // 1. Ensure primary admin exists
    let admin = await User.findOne({ email: PRIMARY_ADMIN.email });
    if (!admin) {
      admin = await User.create(PRIMARY_ADMIN);
      console.log(`[bootstrap] Primary administrator created: ${PRIMARY_ADMIN.email}`);
    } else {
      let needsSave = false;
      if (admin.role !== 'admin') {
        admin.role = 'admin';
        needsSave = true;
      }
      if (admin.isVerified !== true || admin.verificationStatus !== 'verified') {
        admin.isVerified = true;
        admin.verificationStatus = 'verified';
        needsSave = true;
      }
      if (needsSave) {
        await admin.save();
        console.log(`[bootstrap] Primary administrator updated: ${PRIMARY_ADMIN.email}`);
      }
    }

    // 2. Ensure faculty guide / placement office account exists
    let teacher = await User.findOne({ email: PRIMARY_TEACHER.email });
    if (!teacher) {
      teacher = await User.create(PRIMARY_TEACHER);
      console.log(`[bootstrap] Faculty Guide / Placement Office account created: ${PRIMARY_TEACHER.email}`);
    } else {
      let needsSave = false;
      if (teacher.name !== PRIMARY_TEACHER.name) {
        teacher.name = PRIMARY_TEACHER.name;
        needsSave = true;
      }
      if (teacher.role !== 'teacher') {
        teacher.role = 'teacher';
        needsSave = true;
      }
      if (teacher.isVerified !== true || teacher.verificationStatus !== 'verified') {
        teacher.isVerified = true;
        teacher.verificationStatus = 'verified';
        needsSave = true;
      }
      if (needsSave) {
        await teacher.save();
        console.log(`[bootstrap] Faculty Guide / Placement Office account updated: ${PRIMARY_TEACHER.email}`);
      }
    }

    // 3. Ensure Teacher Profile exists
    let teacherProfile = await TeacherProfile.findOne({ user: teacher._id });
    if (!teacherProfile) {
      await TeacherProfile.create({
        user: teacher._id,
        fullName: teacher.name,
        department: 'Computer Engineering',
        designation: 'Placement Office Coordinator & Faculty Guide',
        cabin: 'Placement Office / Faculty Block, KKWAGH',
        officeHours: 'Monday - Friday, 10:00 AM - 5:00 PM',
        specialization: ['Campus Placements', 'Corporate Relations', 'Distributed Systems', 'Project Mentorship'],
        college: PRIMARY_TEACHER.institution,
      });
      console.log(`[bootstrap] Teacher profile created for: ${PRIMARY_TEACHER.email}`);
    } else if (teacherProfile.fullName !== teacher.name) {
      teacherProfile.fullName = teacher.name;
      teacherProfile.designation = 'Placement Office Coordinator & Faculty Guide';
      await teacherProfile.save();
    }

    // 4. Ensure demo student account and profile exist
    let student = await User.findOne({ email: PRIMARY_STUDENT.email });
    if (!student) {
      student = await User.create(PRIMARY_STUDENT);
      console.log(`[bootstrap] Demo student account created: ${PRIMARY_STUDENT.email}`);
    } else if (!student.isVerified || student.verificationStatus !== 'verified') {
      student.isVerified = true;
      student.verificationStatus = 'verified';
      await student.save();
    }

    let studentProfile = await StudentProfile.findOne({ user: student._id });
    if (!studentProfile) {
      await StudentProfile.create({
        user: student._id,
        fullName: student.name,
        college: PRIMARY_STUDENT.institution,
        department: 'Computer Engineering',
        degree: 'B.Tech',
        currentYear: 3,
        graduationYear: 2027,
        location: 'Nashik',
        skills: ['React', 'JavaScript', 'Node.js', 'MongoDB', 'Python'],
        interests: ['Full Stack Development', 'Distributed Systems', 'Web Development'],
        careerGoals: 'Looking for full-stack software development internship opportunities and career mentorship.',
        bio: 'Third-year Computer Engineering student at KKWAGH passionate about web development, open source, and building user-centric software.',
      });
      console.log(`[bootstrap] Student profile created for: ${PRIMARY_STUDENT.email}`);
    }

    // 5. Ensure demo alumni account and profile exist
    let alumni = await User.findOne({ email: PRIMARY_ALUMNI.email });
    if (!alumni) {
      alumni = await User.create(PRIMARY_ALUMNI);
      console.log(`[bootstrap] Demo alumni account created: ${PRIMARY_ALUMNI.email}`);
    } else if (!alumni.isVerified || alumni.verificationStatus !== 'verified') {
      alumni.isVerified = true;
      alumni.verificationStatus = 'verified';
      await alumni.save();
    }

    let alumniProfile = await AlumniProfile.findOne({ user: alumni._id });
    if (!alumniProfile) {
      await AlumniProfile.create({
        user: alumni._id,
        fullName: alumni.name,
        college: PRIMARY_ALUMNI.institution,
        department: 'Computer Engineering',
        degree: 'B.Tech',
        graduationYear: 2020,
        batch: '2020',
        currentCompany: 'Google',
        currentJobTitle: 'Senior Software Engineer',
        professionalDomain: 'Software Engineering',
        industry: 'Technology',
        experienceYears: 6,
        location: 'Bengaluru',
        workLocation: 'Bengaluru, India',
        skills: ['Distributed Systems', 'System Design', 'Java', 'Go', 'React'],
        technologies: ['Java', 'Kubernetes', 'Go', 'GCP'],
        availableForMentorship: true,
        availableForReferral: true,
        verificationStatus: 'verified',
        preferredMentorshipTopics: ['System Design', 'Interview Preparation', 'Career Growth'],
        areasOfGuidance: ['Career Guidance', 'Mentorship', 'Referral', 'Technical Guidance'],
        bio: 'Senior Software Engineer at Google, KKWAGH alumni Class of 2020. Passionate about large-scale distributed architectures and mentoring juniors.',
        email: PRIMARY_ALUMNI.email,
        linkedinUrl: 'https://www.linkedin.com/in/example-priya',
        linkedinConfirmed: true,
        linkedinVisibility: 'all_authenticated',
      });
      console.log(`[bootstrap] Alumni profile created for: ${PRIMARY_ALUMNI.email}`);
    }

    // 6. Ensure sample project groups exist for the guide
    const groupCount = await ProjectGroup.countDocuments({ assignedTeacher: teacher._id });
    if (groupCount === 0) {
      const sampleGroups = [
        {
          title: 'AI-Driven Adaptive Examination & Proctoring System',
          description: 'Vision-based automated proctoring platform with gaze tracking, face verification, and noise detection for remote university exams.',
          department: 'Computer Engineering',
          academicYear: '2025-2026',
          assignedTeacher: teacher._id,
          githubRepo: 'https://github.com/kkwagh-projects/proctor-ai',
          tags: ['Python', 'OpenCV', 'TensorFlow', 'FastAPI', 'React'],
          members: [
            { name: 'Rohan Patil', email: 'rohan.patil@kkwagh.edu.in', rollNumber: '3101', roleInGroup: 'Team Lead' },
            { name: 'Sneha Deshmukh', email: 'sneha.deshmukh@kkwagh.edu.in', rollNumber: '3114', roleInGroup: 'ML Engineer' },
            { name: 'Amit Jadhav', email: 'amit.jadhav@kkwagh.edu.in', rollNumber: '3122', roleInGroup: 'Full-Stack Developer' },
          ],
          milestones: [
            {
              title: 'Problem Definition & Literature Review',
              description: 'Analyze existing IEEE papers on webcam gaze tracking and formulate problem statement.',
              dueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              status: 'approved',
              submissionUrl: 'https://github.com/kkwagh-projects/proctor-ai/wiki/lit-review',
              feedback: 'Exhaustive literature review. Approved to proceed with system architecture design.',
              reviewedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
              reviewedBy: teacher._id,
            },
            {
              title: 'System Architecture & Dataset Collection',
              description: 'Design UML component diagrams, REST API specs, and curate synthetic benchmark video dataset.',
              dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
              status: 'submitted',
              submissionUrl: 'https://github.com/kkwagh-projects/proctor-ai/tree/main/docs/architecture',
              submissionNotes: 'Uploaded UML diagrams, API contracts, and sample test dataset. Ready for review.',
              submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            },
            {
              title: 'Core ML Model Prototype & Calibration',
              description: 'Train facial landmark detector and calibrate gaze orientation angles.',
              dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
              status: 'pending',
            },
            {
              title: 'Final Deployment, Security Audit & Report',
              description: 'Dockerize application, perform stress test, and submit bound project report.',
              dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
              status: 'pending',
            },
          ],
          isAtRisk: false,
          progress: 25,
        },
        {
          title: 'IoT-Based Smart Agriculture Water Management for Nashik Vineyards',
          description: 'LoRaWAN sensor network collecting soil moisture, canopy humidity, and temperature data to automate precision drip irrigation in vineyard plots.',
          department: 'Computer Engineering',
          academicYear: '2025-2026',
          assignedTeacher: teacher._id,
          githubRepo: 'https://github.com/kkwagh-projects/vineyard-iot',
          tags: ['IoT', 'ESP32', 'LoRaWAN', 'MQTT', 'Node.js', 'Grafana'],
          members: [
            { name: 'Pratik Shinde', email: 'pratik.shinde@kkwagh.edu.in', rollNumber: '4208', roleInGroup: 'Hardware & Embedded' },
            { name: 'Tanvi Kulkarni', email: 'tanvi.kulkarni@kkwagh.edu.in', rollNumber: '4235', roleInGroup: 'Cloud Backend & Dashboard' },
          ],
          milestones: [
            {
              title: 'Requirement Analysis & Sensor Hardware Specs',
              description: 'Select capacitive soil moisture probes, LoRa transceivers, and battery solar charge controllers.',
              dueDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
              status: 'approved',
              submissionUrl: 'https://github.com/kkwagh-projects/vineyard-iot/blob/main/BOM.md',
              feedback: 'Good selection of low-power components. Approved.',
              reviewedAt: new Date(Date.now() - 38 * 24 * 60 * 60 * 1000),
              reviewedBy: teacher._id,
            },
            {
              title: 'Hardware Sensor Interfacing & LoRaWAN Gateway',
              description: 'Assemble breadboard prototype and transmit telemetry packets to local gateway.',
              dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
              status: 'revisions_requested',
              submissionUrl: 'https://github.com/kkwagh-projects/vineyard-iot/tree/main/firmware',
              feedback: 'Sensor voltage drift detected in saline soil tests. Recalibrate ADC mapping and resubmit with lab graphs.',
              reviewedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
              reviewedBy: teacher._id,
            },
            {
              title: 'Cloud Dashboard & Telemetry API',
              description: 'Develop WebSockets live telemetry dashboard and automated valve control rules.',
              dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
              status: 'pending',
            },
            {
              title: 'Field Testing & Energy Optimization',
              description: 'Deploy 5 nodes in experimental farm plot and measure battery autonomy over 3 weeks.',
              dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
              status: 'pending',
            },
          ],
          isAtRisk: true,
          atRiskReason: 'Milestone 2 revisions delayed by 2 weeks due to sensor drift in high salinity tests. Needs urgent lab session.',
          progress: 25,
        },
        {
          title: 'Blockchain-Enabled Academic Credential Verification Platform',
          description: 'Decentralized document notarization ensuring tamper-proof degree certificates and transcripts for KKWAGH students via Polygon testnet smart contracts.',
          department: 'Computer Engineering',
          academicYear: '2025-2026',
          assignedTeacher: teacher._id,
          githubRepo: 'https://github.com/kkwagh-projects/kkwagh-verify',
          tags: ['Solidity', 'Hardhat', 'Polygon', 'Ethers.js', 'React', 'IPFS'],
          members: [
            { name: 'Harshal Pawar', email: 'harshal.pawar@kkwagh.edu.in', rollNumber: '4105', roleInGroup: 'Solidity Developer' },
            { name: 'Mayuri Joshi', email: 'mayuri.joshi@kkwagh.edu.in', rollNumber: '4142', roleInGroup: 'Frontend Developer' },
            { name: 'Sanket Borse', email: 'sanket.borse@kkwagh.edu.in', rollNumber: '4160', roleInGroup: 'Backend & IPFS Storage' },
          ],
          milestones: [
            {
              title: 'Smart Contract Architecture & ERC-721 Schema',
              description: 'Draft ERC-721 credential token metadata and access control roles.',
              dueDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
              status: 'approved',
              submissionUrl: 'https://github.com/kkwagh-projects/kkwagh-verify/blob/main/contracts/Credential.sol',
              feedback: 'Access control modifier is secure and gas-efficient. Approved.',
              reviewedAt: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000),
              reviewedBy: teacher._id,
            },
            {
              title: 'Verification Portal Frontend & Instant QR Scanner',
              description: 'Responsive web interface for employers to verify certificate hashes against smart contract in real time.',
              dueDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
              status: 'approved',
              submissionUrl: 'https://github.com/kkwagh-projects/kkwagh-verify/tree/main/frontend',
              feedback: 'Clean QR scan integration and responsive layout. Verified on mobile.',
              reviewedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
              reviewedBy: teacher._id,
            },
            {
              title: 'Enterprise Integration with KKWAGH ERP Registrar API',
              description: 'Batch issue graduation certificates through automated CLI tool connected to campus registrar API.',
              dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
              status: 'submitted',
              submissionUrl: 'https://github.com/kkwagh-projects/kkwagh-verify/tree/main/backend/erp-sync',
              submissionNotes: 'Implemented batch Merkle tree hashing and CSV upload parser. Ready for guide review.',
              submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            },
            {
              title: 'Security Audit & Final Presentation',
              description: 'Slither static analysis, reentrancy audits, gas optimization report, and final viva presentation.',
              dueDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
              status: 'pending',
            },
          ],
          isAtRisk: false,
          progress: 50,
        },
      ];

      await ProjectGroup.create(sampleGroups);
      console.log(`[bootstrap] Seeded ${sampleGroups.length} sample project groups for teacher: ${PRIMARY_TEACHER.email}`);
    }

    // 7. Ensure initial guidance and mentorship appointments exist for teacher
    const GuidanceAppointment = require('../models/GuidanceAppointment');
    const apptCount = await GuidanceAppointment.countDocuments({ guide: teacher._id });
    if (apptCount === 0 && student) {
      await GuidanceAppointment.create([
        {
          guide: teacher._id,
          student: student._id,
          studentName: student.name,
          studentEmail: student.email,
          type: 'project_guidance',
          topic: 'AI Proctoring Architecture Review & Edge Calibration',
          notes: 'Discussion on facial landmark latency and GPU quantization requirements for campus deployment.',
          scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          scheduledTime: '10:30 AM - 11:15 AM',
          location: 'Placement Cell & Faculty Block, Room 204, KKWAGH',
          status: 'confirmed',
          actionItems: ['Prepare benchmark FPS chart', 'Bring trained PyTorch checkpoint weights'],
        },
        {
          guide: teacher._id,
          student: student._id,
          studentName: student.name,
          studentEmail: student.email,
          type: 'resume_review',
          topic: 'Technical Resume & LinkedIn Profile Optimization for Tech Campus Drives',
          notes: 'Reviewing resume layout for upcoming Amazon and Google off-campus hiring phases.',
          scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          scheduledTime: '02:00 PM - 02:45 PM',
          location: 'Placement Office, KKWAGH',
          status: 'pending',
        },
        {
          guide: teacher._id,
          student: student._id,
          studentName: student.name,
          studentEmail: student.email,
          type: 'interview_prep',
          topic: 'Distributed Systems & Microservices Mock Technical Viva',
          notes: 'Mock technical interview covering Redis caching, database sharding, and CAP theorem.',
          scheduledDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          scheduledTime: '04:00 PM - 05:00 PM',
          location: 'Virtual Meet / Google Meet',
          status: 'completed',
          guideFeedback: 'Strong fundamentals in distributed architectures. Recommended practicing medium LeetCode concurrency problems.',
          actionItems: ['Review Raft consensus protocol', 'Implement distributed rate limiter in Node.js'],
          completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
      ]);
      console.log(`[bootstrap] Seeded sample guidance appointments for: ${PRIMARY_TEACHER.email}`);
    }

    // 8. Mark all legacy accounts without verificationStatus as verified so pre-existing accounts are not blocked
    const legacyResult = await User.updateMany(
      { verificationStatus: { $exists: false } },
      { $set: { isVerified: true, verificationStatus: 'verified' } }
    );
    if (legacyResult.modifiedCount > 0) {
      console.log(`[bootstrap] Updated ${legacyResult.modifiedCount} legacy accounts to verified.`);
    }

    // 8. Safely integrate the 2022 Alumni Database into existing models (strictly excluding phone numbers)
    const { import2022Alumni } = require('../services/import2022Service');
    const importRes = await import2022Alumni();
    console.log(`[bootstrap] 2022 Alumni synchronization: ${importRes.inserted} inserted, ${importRes.updated} updated, ${importRes.duplicates} existing/unchanged.`);

    // 9. Safely integrate the 2015-2018 CSV Alumni Datasets (idempotent, no dummy logins)
    const { importCsvAlumni } = require('../services/importCsvService');
    const csvRes = await importCsvAlumni({ silent: true });
    console.log(`[bootstrap] CSV Alumni synchronization (2015-2018): ${csvRes.inserted} inserted, ${csvRes.updated} updated, ${csvRes.duplicates} existing/unchanged across batches.`);
  } catch (err) {
    console.error('[bootstrap] Failed to bootstrap accounts and profiles:', err.message);
  }
}

module.exports = {
  bootstrapPrimaryAdmin,
  PRIMARY_ADMIN,
  PRIMARY_TEACHER,
  PRIMARY_STUDENT,
  PRIMARY_ALUMNI,
};
