const mongoose = require('mongoose');

const adminAuditLogSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    adminEmail: { type: String, required: true },
    action: { type: String, required: true, trim: true },
    targetType: { type: String, required: true, trim: true }, // e.g. 'alumni_record', 'company_standardization'
    targetId: { type: String, trim: true },
    details: { type: String, trim: true }, // Safe non-private description of what was changed
    ipAddress: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdminAuditLog', adminAuditLogSchema);
