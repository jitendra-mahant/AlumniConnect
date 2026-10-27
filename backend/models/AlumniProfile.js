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
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: undefined,
      index: {
        unique: true,
        partialFilterExpression: { user: { $type: 'objectId' } },
      },
    },

    // Personal
    fullName: { type: String, required: true, trim: true, index: true },
    profilePhoto: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true },
    secondaryEmail: { type: String, trim: true, lowercase: true },
    location: { type: String, trim: true, index: true },

    // Academic
    college: {
      type: String,
      trim: true,
      default: 'K.K. Wagh Institute of Engineering Education & Research (KKWAGH)',
    },
    department: { type: String, trim: true, default: 'Computer Engineering', index: true },
    degree: { type: String, trim: true, default: 'B.E.' },
    graduationYear: { type: Number, default: 2022, min: 1950, max: 2100, index: true },
    batch: { type: String, trim: true, default: '2022' },

    // Professional
    currentCompany: { type: String, trim: true, default: 'Company Not Specified', index: true },
    companyNormalized: { type: String, trim: true, index: true },
    currentJobTitle: { type: String, trim: true, default: 'Role Not Specified' },
    professionalDomain: { type: String, trim: true, default: 'Technology', index: true },
    experienceYears: { type: Number, min: 0, max: 60, default: 0, index: true },
    previousCompanies: [{ type: String, trim: true }],
    previousJobTitles: [{ type: String, trim: true }],
    experience: [experienceSchema], // structured previous experience for the profile page
    skills: [{ type: String, trim: true }],
    technologies: [{ type: String, trim: true }],
    industry: { type: String, trim: true, default: 'Information Technology', index: true },
    workLocation: { type: String, trim: true },
    employmentType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Self-employed', 'Freelance', 'Internship'],
      default: 'Full-time',
    },

    // Professional links & Privacy
    linkedinUrl: { type: String, trim: true },
    linkedinVisibility: {
      type: String,
      enum: ['private', 'verified_alumni', 'verified_students_and_alumni', 'all_authenticated'],
      default: 'private',
      index: true,
    },
    linkedinConfirmed: { type: Boolean, default: false },
    importSource: { type: String, default: 'alumni_database_2022' },
    importBatch: { type: String, default: '2022' },
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

alumniProfileSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.phone;
    delete ret.secondary_phone;
    delete ret.secondaryPhone;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('AlumniProfile', alumniProfileSchema);
