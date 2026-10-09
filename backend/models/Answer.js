const mongoose = require('mongoose');

const { Schema } = mongoose;

const commentSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, trim: true, minlength: 2, maxlength: 2000 },
  },
  { timestamps: true }
);

const answerSchema = new Schema(
  {
    question: { type: Schema.Types.ObjectId, ref: 'Question', required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    body: { type: String, required: [true, 'Answer text is required'], trim: true, minlength: 5, maxlength: 10000 },
    isAccepted: { type: Boolean, default: false, index: true },
    upvotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    upvotesCount: { type: Number, default: 0, index: true },
    comments: [commentSchema],
    isHidden: { type: Boolean, default: false, index: true },
    moderationNote: { type: String, trim: true },
  },
  { timestamps: true }
);

answerSchema.index({ question: 1, createdAt: 1 });
answerSchema.index({ question: 1, upvotesCount: -1 });

module.exports = mongoose.model('Answer', answerSchema);
