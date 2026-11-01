const mongoose = require('mongoose');

const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    // Deterministic key for a 1:1 conversation: sorted user ids joined by "_".
    conversationId: { type: String, required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    groupId: { type: Schema.Types.ObjectId, ref: 'ProjectGroup', index: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    readAt: Date,
    deliveredAt: Date,
    readBy: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        readAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ recipient: 1, readAt: 1, createdAt: -1 });
messageSchema.index({ groupId: 1, createdAt: -1 });

messageSchema.statics.makeConversationId = (a, b) => [String(a), String(b)].sort().join('_');

module.exports = mongoose.model('Message', messageSchema);
