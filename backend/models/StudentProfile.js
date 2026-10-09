const mongoose = require('mongoose');

const { Schema } = mongoose;

const studentProfileSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    fullName: { type: String, required: true, trim: true },
    profilePhoto: { type: String, trim: true, default: '' },
    college: { type: String, trim: true },
    department: { type: String, trim: true },
    degree: { type: String, trim: true },
    currentYear: { type: Number, min: 1, max: 6 },
    graduationYear: { type: Number, min: 1950, max: 2100 },
    location: { type: String, trim: true },
    skills: [{ type: String, trim: true }],
    interests: [{ type: String, trim: true }], // preferred domains
    careerGoals: { type: String, trim: true, maxlength: 800 },
    bio: { type: String, trim: true, maxlength: 1000 },
    resumeUrl: { type: String, trim: true },
    linkedinUrl: { type: String, trim: true },
    githubUrl: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
