import { studentSignup, saveAuth, isAuthenticated, getStoredRole } from './api.js';

// Redirect if already logged in
if (isAuthenticated() && getStoredRole() === 'student') {
  window.location.replace('student-dashboard.html');
}

const form = document.getElementById('signup-form');
const alertBox = document.getElementById('alert-box');
const submitBtn = document.getElementById('submit-btn');

const showAlert = (message, type = 'error') => {
  alertBox.textContent = message;
  alertBox.className = `alert alert-${type} show`;
};

const hideAlert = () => {
  alertBox.className = 'alert';
};

const setLoading = (loading) => {
  submitBtn.disabled = loading;
  submitBtn.innerHTML = loading
    ? '<span class="spinner"></span> Creating Account...'
    : 'Create Account';
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlert();

  const fullName   = document.getElementById('fullName').value.trim();
  const division   = document.getElementById('division').value.trim();
  const rollNumber = document.getElementById('rollNumber').value.trim();
  const email      = document.getElementById('email').value.trim();
  const password   = document.getElementById('password').value;

  // Client-side validation
  if (!fullName || !division || !rollNumber || !email || !password) {
    showAlert('All fields are required.');
    return;
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    showAlert('Please enter a valid email address.');
    return;
  }

  if (password.length < 6) {
    showAlert('Password must be at least 6 characters.');
    return;
  }

  setLoading(true);

  try {
    const data = await studentSignup({ fullName, division, rollNumber, email, password });
    saveAuth(data.token, data.student, 'student');
    showAlert('Account created successfully! Redirecting...', 'success');
    setTimeout(() => window.location.replace('student-dashboard.html'), 1200);
  } catch (error) {
    showAlert(error.message || 'Sign up failed. Please try again.');
  } finally {
    setLoading(false);
  }
});
