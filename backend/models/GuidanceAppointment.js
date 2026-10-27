const mongoose = require('mongoose');
const { Schema } = mongoose;

const guidanceAppointmentSchema = new Schema(
  {
    guide: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    studentName: { type: String, required: true, trim: true },
    studentEmail: { type: String, required: true, trim: true, lowercase: true },
    type: {
      type: String,
      enum: ['project_guidance', 'resume_review', 'interview_prep', 'career_guidance', 'academic_mentorship'],
      default: 'project_guidance',
      index: true,
    },
    topic: { type: String, required: true, trim: true, maxlength: 200 },
    notes: { type: String, trim: true, maxlength: 1000 },
    scheduledDate: { type: Date, required: true, index: true },
    scheduledTime: { type: String, default: '10:00 AM - 10:30 AM', trim: true },
    location: { type: String, default: 'Placement Office & Faculty Cabin, KKWAGH', trim: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled', 'rescheduled'],
      default: 'pending',
      index: true,
    },
    guideFeedback: { type: String, trim: true, maxlength: 1500 },
    actionItems: [{ type: String, trim: true }],
    completedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GuidanceAppointment', guidanceAppointmentSchema);
