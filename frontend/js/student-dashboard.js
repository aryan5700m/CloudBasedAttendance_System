import {
  getStudentAttendance,
  studentLogout,
  isAuthenticated,
  getStoredRole,
  getStoredUser,
  clearAuth,
} from './api.js';

// ─── Auth Guard ────────────────────────────────────────────────
if (!isAuthenticated() || getStoredRole() !== 'student') {
  window.location.replace('student-login.html');
}

// ─── DOM References ────────────────────────────────────────────
const pageLoading       = document.getElementById('page-loading');
const avatarInitials    = document.getElementById('avatar-initials');
const userDisplayName   = document.getElementById('user-display-name');
const logoutBtn         = document.getElementById('logout-btn');

const profileName       = document.getElementById('profile-name');
const profileDivision   = document.getElementById('profile-division');
const profileRoll       = document.getElementById('profile-roll');
const profileEmail      = document.getElementById('profile-email');

const statTotal         = document.getElementById('stat-total-classes');
const statPresent       = document.getElementById('stat-present');
const statAbsent        = document.getElementById('stat-absent');
const statPercentage    = document.getElementById('stat-percentage');

const subjectsList      = document.getElementById('subjects-list');
const filterSubject     = document.getElementById('filter-subject');
const attendanceTbody   = document.getElementById('attendance-tbody');
const attendanceEmpty   = document.getElementById('attendance-empty');

let allAttendance = [];

// ─── Helpers ───────────────────────────────────────────────────
const getInitials = (name) =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

const formatDate = (dateStr) => {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const renderAttendanceTable = (records) => {
  attendanceTbody.innerHTML = '';

  if (records.length === 0) {
    attendanceEmpty.style.display = 'block';
    document.getElementById('attendance-table').style.display = 'none';
    return;
  }

  attendanceEmpty.style.display = 'none';
  document.getElementById('attendance-table').style.display = 'table';

  // Sort by date descending
  const sorted = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));

  sorted.forEach((rec, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${rec.subject}</td>
      <td>${formatDate(rec.date)}</td>
      <td>
        <span class="badge ${rec.status === 'Present' ? 'badge-present' : 'badge-absent'}">
          ${rec.status === 'Present' ? '✓' : '✗'} ${rec.status}
        </span>
      </td>
    `;
    attendanceTbody.appendChild(tr);
  });
};

const computeStats = (records) => {
  const total   = records.length;
  const present = records.filter((r) => r.status === 'Present').length;
  const absent  = total - present;
  const pct     = total > 0 ? Math.round((present / total) * 100) : 0;

  statTotal.textContent     = total;
  statPresent.textContent   = present;
  statAbsent.textContent    = absent;
  statPercentage.textContent = `${pct}%`;

  // Color percentage
  if (pct >= 75) {
    statPercentage.style.color = 'var(--accent-green)';
  } else if (pct >= 50) {
    statPercentage.style.color = 'var(--accent-amber)';
  } else {
    statPercentage.style.color = 'var(--accent-red)';
  }
};

// ─── Filter Handler ─────────────────────────────────────────────
filterSubject.addEventListener('change', () => {
  const selected = filterSubject.value;
  const filtered = selected
    ? allAttendance.filter((r) => r.subject === selected)
    : allAttendance;
  renderAttendanceTable(filtered);
});

// ─── Logout ────────────────────────────────────────────────────
logoutBtn.addEventListener('click', async () => {
  logoutBtn.disabled = true;
  logoutBtn.textContent = 'Signing out...';
  try {
    await studentLogout();
  } catch {
    // Best-effort logout
  } finally {
    clearAuth();
    window.location.replace('student-login.html');
  }
});

// ─── Load Dashboard Data ────────────────────────────────────────
const loadDashboard = async () => {
  try {
    const data = await getStudentAttendance();
    const { student } = data;

    // Navbar
    avatarInitials.textContent  = getInitials(student.fullName);
    userDisplayName.textContent = student.fullName;

    // Profile
    profileName.textContent     = student.fullName;
    profileDivision.textContent = student.division;
    profileRoll.textContent     = student.rollNumber;
    profileEmail.textContent    = student.email;

    // Subjects pills
    student.subjects.forEach((subj) => {
      const pill = document.createElement('span');
      pill.className = 'subject-pill';
      pill.innerHTML = `📖 ${subj}`;
      subjectsList.appendChild(pill);

      // Populate filter dropdown
      const opt = document.createElement('option');
      opt.value       = subj;
      opt.textContent = subj;
      filterSubject.appendChild(opt);
    });

    // Attendance
    allAttendance = student.attendance || [];
    computeStats(allAttendance);
    renderAttendanceTable(allAttendance);
  } catch (error) {
    if (error.status === 401) {
      clearAuth();
      window.location.replace('student-login.html');
    }
  } finally {
    pageLoading.classList.add('hidden');
  }
};

loadDashboard();
