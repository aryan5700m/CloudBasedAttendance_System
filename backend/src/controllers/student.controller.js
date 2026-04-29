import jwt from 'jsonwebtoken';
import Student from '../models/Student.js';
import { SUBJECTS } from '../utils/subjects.js';

/**
 * POST /api/student/signup
 * Register a new student. Subjects are auto-assigned.
 */
export const signup = async (req, res, next) => {
  try {
    const { fullName, division, rollNumber, email, password } = req.body;

    if (!fullName || !division || !rollNumber || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const student = await Student.create({
      fullName: fullName.trim(),
      division: division.trim(),
      rollNumber: rollNumber.trim(),
      email: email.trim().toLowerCase(),
      password,
      subjects: SUBJECTS,
    });

    const token = jwt.sign(
      { id: student._id, role: 'student' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: 'Student registered successfully.',
      token,
      student: {
        id: student._id,
        fullName: student.fullName,
        division: student.division,
        rollNumber: student.rollNumber,
        email: student.email,
        subjects: student.subjects,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/student/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const student = await Student.findOne({ email: email.trim().toLowerCase() });

    if (!student) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await student.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    student.isLoggedIn = true;
    await student.save({ validateBeforeSave: false });

    const token = jwt.sign(
      { id: student._id, role: 'student' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      student: {
        id: student._id,
        fullName: student.fullName,
        division: student.division,
        rollNumber: student.rollNumber,
        email: student.email,
        subjects: student.subjects,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/student/logout
 * Marks student as logged out.
 */
export const logout = async (req, res, next) => {
  try {
    await Student.findByIdAndUpdate(req.user.id, { isLoggedIn: false });
    res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/student/attendance
 * Returns the authenticated student's profile and attendance records.
 */
export const getAttendance = async (req, res, next) => {
  try {
    const student = await Student.findById(req.user.id).select('-password');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    res.status(200).json({
      success: true,
      student: {
        id: student._id,
        fullName: student.fullName,
        division: student.division,
        rollNumber: student.rollNumber,
        email: student.email,
        subjects: student.subjects,
        attendance: student.attendance,
      },
    });
  } catch (error) {
    next(error);
  }
};
