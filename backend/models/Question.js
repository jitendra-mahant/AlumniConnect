const mongoose = require('mongoose');

const { Schema } = mongoose;

const questionSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: [true, 'Question title is required'], trim: true, minlength: 5, maxlength: 250 },
    description: { type: String, required: [true, 'Question description is required'], trim: true, minlength: 10, maxlength: 10000 },
    category: {
      type: String,
      enum: [
        'Career Guidance',
        'Interview Prep',
        'Higher Studies',
        'Industry Insights',
        'Internships & Referrals',
        'Tech Stack & Skills',
        'General',
      ],
      default: 'General',
      index: true,
    },
    tags: [{ type: String, trim: true, lowercase: true }],
    status: {
      type: String,
      enum: ['open', 'answered', 'closed'],
      default: 'open',
      index: true,
    },
    acceptedAnswer: { type: Schema.Types.ObjectId, ref: 'Answer', default: null },
    views: { type: Number, default: 0 },
    answersCount: { type: Number, default: 0 },
    upvotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    upvotesCount: { type: Number, default: 0 },
    isHidden: { type: Boolean, default: false, index: true },
    moderationNote: { type: String, trim: true },
  },
  { timestamps: true }
);

questionSchema.index({ createdAt: -1 });
questionSchema.index({ category: 1, createdAt: -1 });
questionSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Question', questionSchema);
