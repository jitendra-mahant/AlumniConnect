const mongoose = require('mongoose');

const { Schema } = mongoose;

const experienceSchema = new Schema(
  {
    company: { type: String, trim: true, required: true },
    title: { type: String, trim: true, required: true },
    startYear: Number,
    endYear: Number,
    description: { type: String, trim: true, maxlength: 600 },
  },
  { _id: false }
);

const alumniProfileSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

    // Personal
    fullName: { type: String, required: true, trim: true, index: true },
    profilePhoto: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    location: { type: String, trim: true, index: true },

    // Academic
    college: { type: String, trim: true, required: true },
    department: { type: String, trim: true, required: true, index: true },
    degree: { type: String, trim: true, required: true },
    graduationYear: { type: Number, required: true, min: 1950, max: 2100, index: true },
    batch: { type: String, trim: true },

    // Professional
    currentCompany: { type: String, trim: true, required: true, index: true },
    currentJobTitle: { type: String, trim: true, required: true },
    professionalDomain: { type: String, trim: true, required: true, index: true },
    experienceYears: { type: Number, min: 0, max: 60, default: 0, index: true },
    previousCompanies: [{ type: String, trim: true }],
    previousJobTitles: [{ type: String, trim: true }],
    experience: [experienceSchema], // structured previous experience for the profile page
    skills: [{ type: String, trim: true }],
    technologies: [{ type: String, trim: true }],
    industry: { type: String, trim: true, index: true },
    workLocation: { type: String, trim: true },
    employmentType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Self-employed', 'Freelance', 'Internship'],
      default: 'Full-time',
    },

    // Professional links
    linkedinUrl: { type: String, trim: true },
    githubUrl: { type: String, trim: true },
    portfolioUrl: { type: String, trim: true },

    // Student support
    availableForMentorship: { type: Boolean, default: false, index: true },
    availableForReferral: { type: Boolean, default: false, index: true },
    availableForCareerGuidance: { type: Boolean, default: true },
    availableForStudentQuestions: { type: Boolean, default: true },
    preferredMentorshipTopics: [{ type: String, trim: true }],
    areasOfGuidance: [{ type: String, trim: true }],

    // Additional
    bio: { type: String, trim: true, maxlength: 1500 },
    achievements: [{ type: String, trim: true }],
    certifications: [{ type: String, trim: true }],
    languages: [{ type: String, trim: true }],
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
      index: true,
    },
    verificationNote: { type: String, trim: true },
    verifiedAt: Date,
  },
  { timestamps: true }
);

// Weighted text index backs free-text searching in the directory.
alumniProfileSchema.index(
  {
    fullName: 'text',
    currentCompany: 'text',
    currentJobTitle: 'text',
    professionalDomain: 'text',
    industry: 'text',
    skills: 'text',
    technologies: 'text',
  },
  {
    weights: { fullName: 10, currentJobTitle: 6, currentCompany: 6, skills: 5, technologies: 5, professionalDomain: 4, industry: 2 },
    name: 'alumni_text_idx',
  }
);
alumniProfileSchema.index({ skills: 1 });
alumniProfileSchema.index({ technologies: 1 });

module.exports = mongoose.model('AlumniProfile', alumniProfileSchema);
