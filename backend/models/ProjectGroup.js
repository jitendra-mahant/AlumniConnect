const mongoose = require('mongoose');
const { Schema } = mongoose;

const milestoneSchema = new Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  dueDate: { type: Date },
  status: {
    type: String,
    enum: ['pending', 'submitted', 'approved', 'revisions_requested'],
    default: 'pending',
  },
  submissionUrl: { type: String, trim: true },
  submissionNotes: { type: String, trim: true },
  submittedAt: { type: Date },
  feedback: { type: String, trim: true },
  reviewedAt: { type: Date },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
});

const memberSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  rollNumber: { type: String, trim: true },
  roleInGroup: { type: String, trim: true, default: 'Team Member' },
});

const projectGroupSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    department: { type: String, trim: true, default: 'Computer Engineering' },
    academicYear: { type: String, trim: true, default: '2025-2026' },
    assignedTeacher: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    members: [memberSchema],
    milestones: [milestoneSchema],
    isAtRisk: { type: Boolean, default: false, index: true },
    atRiskReason: { type: String, trim: true, default: '' },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    githubRepo: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

projectGroupSchema.methods.recalculateProgress = function () {
  if (!this.milestones || this.milestones.length === 0) {
    this.progress = 0;
    return;
  }
  const approved = this.milestones.filter((m) => m.status === 'approved').length;
  this.progress = Math.round((approved / this.milestones.length) * 100);
};

module.exports = mongoose.model('ProjectGroup', projectGroupSchema);
