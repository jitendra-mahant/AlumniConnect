const mongoose = require('mongoose');

const { Schema } = mongoose;

const jobSchema = new Schema(
  {
    postedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    company: { type: String, required: true, trim: true, index: true },
    type: { type: String, enum: ['job', 'internship'], default: 'job', index: true },
    domain: { type: String, trim: true },
    location: { type: String, trim: true },
    workMode: { type: String, enum: ['onsite', 'remote', 'hybrid'], default: 'onsite' },
    description: { type: String, required: true, trim: true, maxlength: 4000 },
    requiredSkills: [{ type: String, trim: true }],
    experienceRequired: { type: String, trim: true },
    compensation: { type: String, trim: true }, // salary / stipend text
    applyUrl: { type: String, trim: true },
    deadline: Date,
    referralAvailable: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'closed'], default: 'active', index: true },
  },
  { timestamps: true }
);

jobSchema.index({ title: 'text', company: 'text', description: 'text', requiredSkills: 'text' });

module.exports = mongoose.model('Job', jobSchema);
