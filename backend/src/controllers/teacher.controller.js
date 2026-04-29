import jwt from 'jsonwebtoken';
import Teacher from '../models/Teacher.js';
import Student from '../models/Student.js';
import { SUBJECTS } from '../utils/subjects.js';

/**
 * POST /api/teacher/signup
 */
export const signup = async (req, res, next) => {
  try {
    const { fullName, email, mobileNumber, password } = req.body;

    if (!fullName || !email || !mobileNumber || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    if (!/^\d{10}$/.test(mobileNumber.trim())) {
      return res.status(400).json({ success: false, message: 'Mobile number must be exactly 10 digits.' });
    }

    const teacher = await Teacher.create({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      mobileNumber: mobileNumber.trim(),
      password,
    });

    const token = jwt.sign(
      { id: teacher._id, role: 'teacher' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: 'Teacher registered successfully.',
      token,
      teacher: {
        id: teacher._id,
        fullName: teacher.fullName,
        email: teacher.email,
        mobileNumber: teacher.mobileNumber,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/teacher/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const teacher = await Teacher.findOne({ email: email.trim().toLowerCase() });

    if (!teacher) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await teacher.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: teacher._id, role: 'teacher' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      teacher: {
        id: teacher._id,
        fullName: teacher.fullName,
        email: teacher.email,
        mobileNumber: teacher.mobileNumber,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/teacher/students
 * Returns all students with their attendance and online status.
 */
export const getStudents = async (req, res, next) => {
  try {
    const students = await Student.find({}).select('-password').sort({ rollNumber: 1 });

    res.status(200).json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/teacher/mark-attendance
 * Body: { subject, date, records: [{ studentId, status }] }
 * - Validates subject is one of 4 fixed subjects
 * - Validates date is Monday–Friday
 * - Prevents duplicate attendance (same studentId + subject + date)
 */
export const markAttendance = async (req, res, next) => {
  try {
    const { subject, date, records } = req.body;

    // Validate presence
    if (!subject || !date || !records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'Subject, date, and records are required.' });
    }

    // Validate subject
    if (!SUBJECTS.includes(subject)) {
      return res.status(400).json({ success: false, message: `Subject must be one of: ${SUBJECTS.join(', ')}.` });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ success: false, message: 'Date must be in YYYY-MM-DD format.' });
    }

    // Validate weekday (Mon–Fri)
    const parsedDate = new Date(`${date}T00:00:00`);
    const dayOfWeek = parsedDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return res.status(400).json({ success: false, message: 'Attendance can only be marked on weekdays (Monday to Friday).' });
    }

    // Validate each record
    for (const record of records) {
      if (!record.studentId || !record.status) {
        return res.status(400).json({ success: false, message: 'Each record must have studentId and status.' });
      }
      if (!['Present', 'Absent'].includes(record.status)) {
        return res.status(400).json({ success: false, message: 'Status must be either Present or Absent.' });
      }
    }

    const results = [];
    const errors = [];

    for (const record of records) {
      const student = await Student.findById(record.studentId);

      if (!student) {
        errors.push({ studentId: record.studentId, error: 'Student not found.' });
        continue;
      }

      // Check for duplicate attendance
      const duplicate = student.attendance.some(
        (a) => a.subject === subject && a.date === date
      );

      if (duplicate) {
        errors.push({
          studentId: record.studentId,
          studentName: student.fullName,
          error: `Attendance already marked for ${subject} on ${date}.`,
        });
        continue;
      }

      student.attendance.push({ subject, date, status: record.status });
      await student.save({ validateBeforeSave: false });

      results.push({
        studentId: record.studentId,
        studentName: student.fullName,
        status: record.status,
      });
    }

    res.status(200).json({
      success: true,
      message: `Attendance processed. ${results.length} marked, ${errors.length} skipped.`,
      marked: results,
      skipped: errors,
    });
  } catch (error) {
    next(error);
  }
};
