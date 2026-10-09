const mongoose = require('mongoose');

const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    // Deterministic key for a 1:1 conversation: sorted user ids joined by "_".
    conversationId: { type: String, required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    readAt: Date,
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

messageSchema.statics.makeConversationId = (a, b) => [String(a), String(b)].sort().join('_');

module.exports = mongoose.model('Message', messageSchema);
