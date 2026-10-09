const mongoose = require('mongoose');

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'connection_request',
        'connection_accepted',
        'connection_rejected',
        'mentorship_request',
        'mentorship_update',
        'referral_request',
        'referral_update',
        'message',
        'job_posted',
        'profile_review',
        'verification',
        'question_answered',
        'answer_accepted',
        'answer_reply',
      ],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String },
    link: { type: String }, // frontend route to open
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
