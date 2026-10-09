const mongoose = require('mongoose');

const { Schema } = mongoose;

// Reported content, reviewed by admins.
const reportSchema = new Schema(
  {
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: {
      type: String,
      enum: ['user', 'job', 'message', 'alumni_profile', 'question', 'answer'],
      required: true,
    },
    targetId: { type: Schema.Types.ObjectId, required: true },
    reason: { type: String, required: true, trim: true, maxlength: 800 },
    status: { type: String, enum: ['open', 'resolved', 'dismissed'], default: 'open', index: true },
    adminNote: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
