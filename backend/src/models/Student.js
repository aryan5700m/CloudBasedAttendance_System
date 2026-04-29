import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { SUBJECTS } from '../utils/subjects.js';

const attendanceSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
      enum: SUBJECTS,
    },
    date: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['Present', 'Absent'],
    },
  },
  { _id: false }
);

const studentSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    division: {
      type: String,
      required: [true, 'Division is required'],
      trim: true,
    },
    rollNumber: {
      type: String,
      required: [true, 'Roll number is required'],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    subjects: {
      type: [String],
      default: SUBJECTS,
    },
    isLoggedIn: {
      type: Boolean,
      default: false,
    },
    attendance: {
      type: [attendanceSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Enforce unique attendance per subject+date
studentSchema.index(
  { rollNumber: 1, 'attendance.subject': 1, 'attendance.date': 1 },
  { unique: false }
);

// Hash password before saving
studentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare plain password with hash
studentSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const Student = mongoose.model('Student', studentSchema);
export default Student;
