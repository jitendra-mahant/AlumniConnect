const mongoose = require('mongoose');
const { Schema } = mongoose;

const passwordResetRequestSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    name: { type: String, trim: true },
    role: { type: String, enum: ['student', 'alumni', 'teacher', 'admin'], default: 'student' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'pending',
      index: true,
    },
    reason: { type: String, trim: true, default: 'Forgotten institutional account credentials' },
    temporaryCredentialHash: { type: String, select: false },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectedReason: { type: String, trim: true },
    completedAt: { type: Date },
    expiresAt: { type: Date, index: true },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PasswordResetRequest', passwordResetRequestSchema);
