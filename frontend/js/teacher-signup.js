import { teacherSignup, saveAuth, isAuthenticated, getStoredRole } from './api.js';

// Redirect if already logged in
if (isAuthenticated() && getStoredRole() === 'teacher') {
  window.location.replace('teacher-dashboard.html');
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
    : 'Create Teacher Account';
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlert();

  const fullName     = document.getElementById('fullName').value.trim();
  const email        = document.getElementById('email').value.trim();
  const mobileNumber = document.getElementById('mobileNumber').value.trim();
  const password     = document.getElementById('password').value;

  if (!fullName || !email || !mobileNumber || !password) {
    showAlert('All fields are required.');
    return;
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    showAlert('Please enter a valid email address.');
    return;
  }

  if (!/^\d{10}$/.test(mobileNumber)) {
    showAlert('Mobile number must be exactly 10 digits.');
    return;
  }

  if (password.length < 6) {
    showAlert('Password must be at least 6 characters.');
    return;
  }

  setLoading(true);

  try {
    const data = await teacherSignup({ fullName, email, mobileNumber, password });
    saveAuth(data.token, data.teacher, 'teacher');
    showAlert('Account created successfully! Redirecting...', 'success');
    setTimeout(() => window.location.replace('teacher-dashboard.html'), 1200);
  } catch (error) {
    showAlert(error.message || 'Sign up failed. Please try again.');
  } finally {
    setLoading(false);
  }
});
