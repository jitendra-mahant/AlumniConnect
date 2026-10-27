const mongoose = require('mongoose');
const { Schema } = mongoose;

const teacherProfileSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    fullName: { type: String, required: true, trim: true },
    profilePhoto: { type: String, trim: true, default: '' },
    department: { type: String, trim: true, default: 'Computer Engineering' },
    designation: { type: String, trim: true, default: 'Assistant Professor & Project Guide' },
    cabin: { type: String, trim: true, default: 'IT / Computer Dept, B-Building' },
    officeHours: { type: String, trim: true, default: 'Mon - Fri, 2:00 PM - 5:00 PM' },
    specialization: [{ type: String, trim: true }],
    college: { type: String, trim: true, default: 'K.K. Wagh Institute of Engineering Education & Research (KKWAGH)' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TeacherProfile', teacherProfileSchema);
