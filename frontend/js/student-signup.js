setLoading(true);

try {
  console.log("Submitting form...");

  const data = await studentSignup({ fullName, division, rollNumber, email, password });

  console.log("API RESPONSE:", data);

  saveAuth(data.token, data.student, 'student');

  console.log("Saved auth, redirecting...");

  window.location.replace('student-dashboard.html');

} catch (error) {
  console.error("ERROR:", error);
  showAlert(error.message || 'Sign up failed. Please try again.');
} finally {
  setLoading(false);
}
});