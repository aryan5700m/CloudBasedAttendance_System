/**
 * Centralized API utility for the Student Attendance System.
 * All fetch calls use async/await and send Authorization headers.
 */

const BASE_URL = 'http://localhost:5000/api';

/**
 * Internal helper: performs a fetch request and returns parsed JSON.
 * Throws an error object with `message` on non-2xx responses.
 */
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || 'Something went wrong.');
    error.status = response.status;
    throw error;
  }

  return data;
};

// ─── Student APIs ──────────────────────────────────────────────
export const studentSignup = (payload) =>
  request('/student/signup', { method: 'POST', body: JSON.stringify(payload) });

export const studentLogin = (payload) =>
  request('/student/login', { method: 'POST', body: JSON.stringify(payload) });

export const studentLogout = () =>
  request('/student/logout', { method: 'POST' });

export const getStudentAttendance = () =>
  request('/student/attendance');

// ─── Teacher APIs ──────────────────────────────────────────────
export const teacherSignup = (payload) =>
  request('/teacher/signup', { method: 'POST', body: JSON.stringify(payload) });

export const teacherLogin = (payload) =>
  request('/teacher/login', { method: 'POST', body: JSON.stringify(payload) });

export const getTeacherStudents = () =>
  request('/teacher/students');

export const markAttendance = (payload) =>
  request('/teacher/mark-attendance', { method: 'POST', body: JSON.stringify(payload) });

// ─── Auth Helpers ──────────────────────────────────────────────
export const saveAuth = (token, user, role) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('role', role);
};

export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('role');
};

export const getStoredUser = () => {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
};

export const getStoredRole = () => localStorage.getItem('role');
export const getToken = () => localStorage.getItem('token');

export const isAuthenticated = () => !!getToken();
