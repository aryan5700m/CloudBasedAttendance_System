import { studentSignup, saveAuth, isAuthenticated, getStoredRole } from './api.js';

console.log("JS LOADED");

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
  submitBtn.innerText = loading ? 'Creating Account...' : 'Create Account';
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlert();

  const fullName   = document.getElementById('fullName').value.trim();
  const division   = document.getElementById('division').value.trim();
  const rollNumber = document.getElementById('rollNumber').value.trim();
  const email      = document.getElementById('email').value.trim();
  const password   = document.getElementById('password').value;

  if (!fullName || !division || !rollNumber || !email || !password) {
    showAlert('All fields are required.');
    return;
  }

  setLoading(true);

  try {
    console.log("Submitting form...");

    const data = await studentSignup({ fullName, division, rollNumber, email, password });

    console.log("API RESPONSE:", data);

    saveAuth(data.token, data.student, 'student');

    window.location.replace('student-dashboard.html');

  } catch (error) {
    console.error("ERROR:", error);
    showAlert(error.message || 'Signup failed');
  } finally {
    setLoading(false);
  }
});