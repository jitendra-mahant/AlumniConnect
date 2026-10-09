const mongoose = require('mongoose');

const { Schema } = mongoose;

const referralRequestSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    alumni: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    job: { type: Schema.Types.ObjectId, ref: 'Job' }, // optional: referral for a posted opportunity
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true, maxlength: 1500 },
    resumeUrl: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'referred', 'cancelled'],
      default: 'pending',
      index: true,
    },
    response: { type: String, trim: true, maxlength: 1000 },
    respondedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('ReferralRequest', referralRequestSchema);
