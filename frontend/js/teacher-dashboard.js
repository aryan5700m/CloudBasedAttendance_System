import {
  getTeacherStudents,
  markAttendance,
  isAuthenticated,
  getStoredRole,
  getStoredUser,
  clearAuth,
} from './api.js';

// ─── Auth Guard ────────────────────────────────────────────────
if (!isAuthenticated() || getStoredRole() !== 'teacher') {
  window.location.replace('teacher-login.html');
}

// ─── DOM References ────────────────────────────────────────────
const pageLoading       = document.getElementById('page-loading');
const avatarInitials    = document.getElementById('avatar-initials');
const userDisplayName   = document.getElementById('user-display-name');
const logoutBtn         = document.getElementById('logout-btn');

const statTotal         = document.getElementById('stat-total');
const statOnline        = document.getElementById('stat-online');
const statRecords       = document.getElementById('stat-records');
const statToday         = document.getElementById('stat-today');

const attSubject        = document.getElementById('att-subject');
const attDate           = document.getElementById('att-date');
const markTableWrapper  = document.getElementById('mark-table-wrapper');
const markTbody         = document.getElementById('mark-tbody');
const markEmpty         = document.getElementById('mark-empty');
const markActions       = document.getElementById('mark-actions');
const alertMark         = document.getElementById('alert-mark');
const markResultBox     = document.getElementById('mark-result-box');

const btnAllPresent     = document.getElementById('btn-mark-all-present');
const btnAllAbsent      = document.getElementById('btn-mark-all-absent');
const btnSubmit         = document.getElementById('btn-submit-attendance');

const studentTbody      = document.getElementById('student-tbody');
const studentEmpty      = document.getElementById('student-empty');
const studentSearch     = document.getElementById('student-search');

// ─── State ─────────────────────────────────────────────────────
let allStudents = [];

// ─── Helpers ───────────────────────────────────────────────────
const getInitials = (name) =>
  name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

const getTodayString = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

const showMarkAlert = (message, type = 'error') => {
  alertMark.textContent = message;
  alertMark.className = `alert alert-${type} show`;
};

const hideMarkAlert = () => {
  alertMark.className = 'alert';
};

// ─── Student List Renderer ──────────────────────────────────────
const renderStudentList = (students) => {
  studentTbody.innerHTML = '';

  if (students.length === 0) {
    studentEmpty.style.display = 'block';
    studentTbody.closest('table').style.display = 'none';
    return;
  }

  studentEmpty.style.display = 'none';
  studentTbody.closest('table').style.display = 'table';

  const today = getTodayString();

  students.forEach((s) => {
    const totalRecords  = s.attendance.length;
    const presentCount  = s.attendance.filter((a) => a.status === 'Present').length;
    const pct = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

    const isOnline = s.isLoggedIn;

    const tr = document.createElement('tr');
    tr.dataset.name = s.fullName.toLowerCase();
    tr.dataset.roll = s.rollNumber.toLowerCase();

    tr.innerHTML = `
      <td><strong>${s.rollNumber}</strong></td>
      <td>${s.fullName}</td>
      <td>${s.division}</td>
      <td style="color:var(--text-secondary);font-size:0.85rem;">${s.email}</td>
      <td>
        <span class="badge ${isOnline ? 'badge-online' : 'badge-offline'}">
          <span class="online-dot ${isOnline ? 'online' : 'offline'}"></span>
          ${isOnline ? 'Online' : 'Offline'}
        </span>
      </td>
      <td>
        <span style="color:${pct >= 75 ? 'var(--accent-green)' : pct >= 50 ? 'var(--accent-amber)' : 'var(--accent-red)'}; font-weight:700;">
          ${pct}%
        </span>
        <span style="color:var(--text-muted);font-size:0.78rem;margin-left:4px;">(${presentCount}/${totalRecords})</span>
      </td>
    `;
    studentTbody.appendChild(tr);
  });
};

// ─── Mark Attendance Table Renderer ────────────────────────────
const renderMarkTable = () => {
  markTbody.innerHTML = '';
  hideMarkAlert();
  markResultBox.className = 'mark-result-box';
  markResultBox.innerHTML = '';

  if (allStudents.length === 0) {
    markTableWrapper.style.display = 'none';
    markActions.style.display      = 'none';
    markEmpty.style.display        = 'block';
    return;
  }

  markEmpty.style.display        = 'none';
  markTableWrapper.style.display = 'block';
  markActions.style.display      = 'flex';

  allStudents.forEach((s) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${s.rollNumber}</strong></td>
      <td>
        <div class="student-row-name">${s.fullName}</div>
        <div class="student-row-meta">${s.email}</div>
      </td>
      <td>${s.division}</td>
      <td>
        <div class="status-toggle" id="toggle-${s._id}">
          <input type="radio" name="status-${s._id}" id="present-${s._id}" value="Present" checked />
          <label for="present-${s._id}">Present</label>
          <input type="radio" name="status-${s._id}" id="absent-${s._id}" value="Absent" />
          <label for="absent-${s._id}">Absent</label>
        </div>
      </td>
    `;
    markTbody.appendChild(tr);
  });
};

// ─── Mark All Present / Absent ──────────────────────────────────
btnAllPresent.addEventListener('click', () => {
  allStudents.forEach((s) => {
    const el = document.getElementById(`present-${s._id}`);
    if (el) el.checked = true;
  });
});

btnAllAbsent.addEventListener('click', () => {
  allStudents.forEach((s) => {
    const el = document.getElementById(`absent-${s._id}`);
    if (el) el.checked = true;
  });
});

// ─── Submit Attendance ──────────────────────────────────────────
btnSubmit.addEventListener('click', async () => {
  hideMarkAlert();
  markResultBox.className = 'mark-result-box';
  markResultBox.innerHTML = '';

  const subject = attSubject.value;
  const date    = attDate.value;

  if (!subject) {
    showMarkAlert('Please select a subject.');
    return;
  }

  if (!date) {
    showMarkAlert('Please select a date.');
    return;
  }

  // Validate weekday on client too
  const parsed   = new Date(`${date}T00:00:00`);
  const dayOfWeek = parsed.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    showMarkAlert('Attendance can only be marked on weekdays (Monday to Friday).');
    return;
  }

  const records = allStudents.map((s) => {
    const present = document.getElementById(`present-${s._id}`);
    return {
      studentId: s._id,
      status: present?.checked ? 'Present' : 'Absent',
    };
  });

  btnSubmit.disabled = true;
  btnSubmit.innerHTML = '<span class="spinner"></span> Saving...';

  try {
    const data = await markAttendance({ subject, date, records });

    // Show results
    markResultBox.className = 'mark-result-box show';
    let html = `<strong style="color:var(--text-primary);">${data.message}</strong><br/><br/>`;

    data.marked.forEach((m) => {
      html += `<div class="result-item success">✓ ${m.studentName} — ${m.status}</div>`;
    });
    data.skipped.forEach((sk) => {
      html += `<div class="result-item warn">⚠ ${sk.studentName || sk.studentId} — ${sk.error}</div>`;
    });

    markResultBox.innerHTML = html;

    // Refresh student list to reflect updated attendance
    await loadDashboard();
  } catch (error) {
    showMarkAlert(error.message || 'Failed to mark attendance. Please try again.');
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = 'Save Attendance';
  }
});

// ─── Student Search ─────────────────────────────────────────────
studentSearch.addEventListener('input', () => {
  const query = studentSearch.value.toLowerCase();
  document.querySelectorAll('#student-tbody tr').forEach((row) => {
    const name = row.dataset.name || '';
    const roll = row.dataset.roll || '';
    row.style.display = name.includes(query) || roll.includes(query) ? '' : 'none';
  });
});

// ─── Logout ────────────────────────────────────────────────────
logoutBtn.addEventListener('click', () => {
  clearAuth();
  window.location.replace('teacher-login.html');
});

// ─── Load Dashboard ─────────────────────────────────────────────
const loadDashboard = async () => {
  try {
    const data = await getTeacherStudents();
    allStudents = data.students;

    const teacher = getStoredUser();
    if (teacher) {
      avatarInitials.textContent  = getInitials(teacher.fullName);
      userDisplayName.textContent = teacher.fullName;
    }

    // Stats
    const totalStudents  = allStudents.length;
    const onlineStudents = allStudents.filter((s) => s.isLoggedIn).length;
    const totalRecords   = allStudents.reduce((sum, s) => sum + s.attendance.length, 0);

    const today = getTodayString();
    const markedToday = allStudents.reduce((sum, s) => {
      return sum + s.attendance.filter((a) => a.date === today).length;
    }, 0);

    statTotal.textContent   = totalStudents;
    statOnline.textContent  = onlineStudents;
    statRecords.textContent = totalRecords;
    statToday.textContent   = markedToday;

    renderStudentList(allStudents);
    renderMarkTable();
  } catch (error) {
    if (error.status === 401) {
      clearAuth();
      window.location.replace('teacher-login.html');
    }
  } finally {
    pageLoading.classList.add('hidden');
  }
};

// ─── Set default date to today ──────────────────────────────────
attDate.value = getTodayString();

loadDashboard();
