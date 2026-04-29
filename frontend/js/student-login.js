import { studentLogin, saveAuth, isAuthenticated, getStoredRole } from './api.js';

// Redirect if already logged in
if (isAuthenticated() && getStoredRole() === 'student') {
  window.location.replace('student-dashboard.html');
}

const form = document.getElementById('login-form');
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
    ? '<span class="spinner"></span> Signing in...'
    : 'Sign In';
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlert();

  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    showAlert('Email and password are required.');
    return;
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    showAlert('Please enter a valid email address.');
    return;
  }

  setLoading(true);

  try {
    const data = await studentLogin({ email, password });
    saveAuth(data.token, data.student, 'student');
    showAlert('Login successful! Redirecting...', 'success');
    setTimeout(() => window.location.replace('student-dashboard.html'), 1000);
  } catch (error) {
    showAlert(error.message || 'Login failed. Please check your credentials.');
  } finally {
    setLoading(false);
  }
});
