const mongoose = require('mongoose');

const { Schema } = mongoose;

const mentorshipRequestSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    alumni: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    topic: { type: String, required: true, trim: true, maxlength: 150 },
    message: { type: String, required: true, trim: true, maxlength: 1500 },
    goals: { type: String, trim: true, maxlength: 600 },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    response: { type: String, trim: true, maxlength: 1000 },
    respondedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('MentorshipRequest', mentorshipRequestSchema);
