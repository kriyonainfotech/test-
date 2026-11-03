/**
 * User CRUD Portal - Frontend Application Logic
 */

// State
let allUsers = [];
let filteredUsers = [];
let activeView = 'table'; // 'table' or 'grid'
let userToDelete = null;

// Determine default API Base URL
function getInitialApiBase() {
  const saved = localStorage.getItem('usercurd_api_base');
  if (saved) return saved;
  if (window.location.protocol === 'file:') {
    return 'http://localhost:5000/api/user';
  }
  // If hosted on express server
  return `${window.location.origin}/api/user`;
}

let API_BASE_URL = getInitialApiBase();

// DOM Elements
const apiStatusDot = document.getElementById('api-status-dot');
const apiStatusText = document.getElementById('api-status-text');
const footerActiveUrl = document.getElementById('footer-active-url');

const authUserBox = document.getElementById('auth-user-box');
const authGuestBox = document.getElementById('auth-guest-box');
const authUserName = document.getElementById('auth-user-name');
const authAvatar = document.getElementById('auth-avatar');
const btnLogout = document.getElementById('btn-logout');
const btnOpenLogin = document.getElementById('btn-open-login');
const btnOpenRegister = document.getElementById('btn-open-register');

const statTotalUsers = document.getElementById('stat-total-users');
const statShowingUsers = document.getElementById('stat-showing-users');
const statSearchLabel = document.getElementById('stat-search-label');
const statAuthStatus = document.getElementById('stat-auth-status');
const statAuthDesc = document.getElementById('stat-auth-desc');
const statAuthIcon = document.getElementById('stat-auth-icon');

const searchInput = document.getElementById('search-input');
const searchClearBtn = document.getElementById('search-clear-btn');
const sortSelect = document.getElementById('sort-select');
const viewModeTable = document.getElementById('view-mode-table');
const viewModeGrid = document.getElementById('view-mode-grid');
const btnRefresh = document.getElementById('btn-refresh');
const refreshIcon = document.getElementById('refresh-icon');

const loadingState = document.getElementById('loading-state');
const emptyState = document.getElementById('empty-state');
const emptyStateTitle = document.getElementById('empty-state-title');
const emptyStateDesc = document.getElementById('empty-state-desc');
const tableViewContainer = document.getElementById('table-view-container');
const gridViewContainer = document.getElementById('grid-view-container');
const usersTableBody = document.getElementById('users-table-body');

// Modals
const modalAddUser = document.getElementById('modal-add-user');
const modalEditUser = document.getElementById('modal-edit-user');
const modalViewUser = document.getElementById('modal-view-user');
const modalLogin = document.getElementById('modal-login');
const modalRegister = document.getElementById('modal-register');
const modalDelete = document.getElementById('modal-delete');
const modalApiSettings = document.getElementById('modal-api-settings');

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  updateApiDisplay();
  checkAuthStatus();
  setupEventListeners();
  loadUsers();
});

// Update API URL display
function updateApiDisplay() {
  if (footerActiveUrl) {
    footerActiveUrl.textContent = `API: ${API_BASE_URL}`;
  }
}

// ----------------- AUTHENTICATION -----------------

function getAuthToken() {
  return localStorage.getItem('usercurd_token') || '';
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('usercurd_user') || 'null');
  } catch {
    return null;
  }
}

function setAuthSession(token, user) {
  localStorage.setItem('usercurd_token', token);
  localStorage.setItem('usercurd_user', JSON.stringify(user || {}));
  checkAuthStatus();
}

function clearAuthSession() {
  localStorage.removeItem('usercurd_token');
  localStorage.removeItem('usercurd_user');
  checkAuthStatus();
  showToast('Logged out successfully', 'info');
}

function checkAuthStatus() {
  const token = getAuthToken();
  const user = getStoredUser();

  if (token && user) {
    authUserBox.classList.remove('hidden');
    authGuestBox.classList.add('hidden');
    authUserName.textContent = user.name || 'User';
    authAvatar.textContent = (user.name || 'U').charAt(0).toUpperCase();

    statAuthStatus.textContent = 'Authenticated';
    statAuthStatus.className = 'text-base font-bold text-emerald-400 mt-1';
    statAuthDesc.textContent = `Logged in as ${user.email || user.name}`;
    statAuthIcon.className = 'w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl';
  } else {
    authUserBox.classList.add('hidden');
    authGuestBox.classList.remove('hidden');

    statAuthStatus.textContent = 'Guest';
    statAuthStatus.className = 'text-base font-bold text-slate-300 mt-1';
    statAuthDesc.textContent = 'Login for delete permissions';
    statAuthIcon.className = 'w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-xl';
  }
}

// ----------------- TOAST NOTIFICATIONS -----------------

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const typeStyles = {
    success: 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200 fa-circle-check text-emerald-400',
    error: 'bg-rose-950/90 border-rose-500/40 text-rose-200 fa-circle-xmark text-rose-400',
    warning: 'bg-amber-950/90 border-amber-500/40 text-amber-200 fa-triangle-exclamation text-amber-400',
    info: 'bg-indigo-950/90 border-indigo-500/40 text-indigo-200 fa-circle-info text-indigo-400'
  };

  const [bgBorder, , , iconClass, iconColor] = (typeStyles[type] || typeStyles.info).split(' ');

  toast.className = `toast pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl backdrop-blur-md text-xs font-medium ${bgBorder} border`;
  toast.innerHTML = `
    <i class="fa-solid ${iconClass} ${iconColor} text-base"></i>
    <span class="flex-1">${message}</span>
    <button class="text-slate-400 hover:text-white transition ml-2" onclick="this.parentElement.remove()">
      <i class="fa-solid fa-xmark text-xs"></i>
    </button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ----------------- MODAL CONTROLS -----------------

function openModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.remove('active');
  if (!document.querySelector('.modal-backdrop.active')) {
    document.body.style.overflow = '';
  }
}

function closeAllModals() {
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    closeModal(modal);
  });
}

// ----------------- DATA FETCHING (CRUD) -----------------

async function loadUsers() {
  showLoading(true);
  refreshIcon.classList.add('animate-spin');

  try {
    const res = await fetch(`${API_BASE_URL}/all`);
    if (!res.ok) {
      throw new Error(`Server responded with ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      allUsers = data.data;
      setApiStatus(true, 'Connected to API');
      applyFilterAndSort();
    } else {
      throw new Error(data.message || 'Failed to retrieve users');
    }
  } catch (err) {
    console.error('Error fetching users:', err);
    setApiStatus(false, 'API Disconnected');
    showEmptyState('Connection Failed', `Could not reach backend API at ${API_BASE_URL}. Ensure MongoDB and Node server are running.`);
  } finally {
    showLoading(false);
    refreshIcon.classList.remove('animate-spin');
  }
}

function setApiStatus(isOnline, text) {
  if (isOnline) {
    apiStatusDot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-400 pulse-dot';
    apiStatusText.textContent = text || 'API Online';
  } else {
    apiStatusDot.className = 'w-2.5 h-2.5 rounded-full bg-rose-500';
    apiStatusText.textContent = text || 'API Offline';
  }
}

function showLoading(isLoading) {
  if (isLoading) {
    loadingState.classList.remove('hidden');
    tableViewContainer.classList.add('hidden');
    gridViewContainer.classList.add('hidden');
    emptyState.classList.add('hidden');
  } else {
    loadingState.classList.add('hidden');
  }
}

function showEmptyState(title, desc) {
  emptyStateTitle.textContent = title || 'No Users Found';
  emptyStateDesc.textContent = desc || 'There are no users to display.';
  emptyState.classList.remove('hidden');
  tableViewContainer.classList.add('hidden');
  gridViewContainer.classList.add('hidden');
  statTotalUsers.textContent = '0';
  statShowingUsers.textContent = '0';
}

// Filter and Sort users
function applyFilterAndSort() {
  const query = searchInput.value.trim().toLowerCase();
  const sortMode = sortSelect.value;

  // Search filter
  filteredUsers = allUsers.filter(u => {
    const name = (u.name || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const phone = String(u.phoneNo || '').toLowerCase();
    return name.includes(query) || email.includes(query) || phone.includes(query);
  });

  // Sort
  if (sortMode === 'name-asc') {
    filteredUsers.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } else if (sortMode === 'name-desc') {
    filteredUsers.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
  } else if (sortMode === 'oldest') {
    filteredUsers.sort((a, b) => (a._id || '').localeCompare(b._id || ''));
  } else {
    // Newest first (default)
    filteredUsers.sort((a, b) => (b._id || '').localeCompare(a._id || ''));
  }

  // Update statistics
  statTotalUsers.textContent = allUsers.length;
  statShowingUsers.textContent = filteredUsers.length;
  if (query) {
    statSearchLabel.textContent = `Filtered for "${query}"`;
  } else {
    statSearchLabel.textContent = 'All users shown';
  }

  // Render view
  if (filteredUsers.length === 0) {
    showEmptyState(
      query ? 'No Matching Users' : 'No Users in Database',
      query ? `No user records matched "${query}". Try another search term.` : 'Get started by creating your first user record.'
    );
  } else {
    emptyState.classList.add('hidden');
    renderUsers();
  }
}

// Render Table and Grid views
function renderUsers() {
  if (activeView === 'table') {
    tableViewContainer.classList.remove('hidden');
    gridViewContainer.classList.add('hidden');
    renderTableView();
  } else {
    tableViewContainer.classList.add('hidden');
    gridViewContainer.classList.remove('hidden');
    renderGridView();
  }
}

function getAvatarColor(str) {
  const colors = [
    'avatar-grad-1',
    'avatar-grad-2',
    'avatar-grad-3',
    'avatar-grad-4',
    'avatar-grad-5',
    'avatar-grad-6'
  ];
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderTableView() {
  usersTableBody.innerHTML = filteredUsers.map(user => {
    const initial = (user.name || 'U').charAt(0).toUpperCase();
    const gradClass = getAvatarColor(user.email || user.name);

    return `
      <tr class="hover:bg-slate-800/40 transition group">
        <td class="py-3 px-4">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl ${gradClass} flex items-center justify-center font-bold text-white text-xs shadow-md">
              ${initial}
            </div>
            <div>
              <div class="font-semibold text-slate-100 group-hover:text-indigo-300 transition">${escapeHtml(user.name)}</div>
              <div class="text-[11px] text-slate-400 sm:hidden">${escapeHtml(user.email)}</div>
            </div>
          </div>
        </td>
        <td class="py-3 px-4 text-slate-300 text-xs">
          <div class="flex items-center gap-1.5">
            <i class="fa-regular fa-envelope text-slate-500 text-[11px]"></i>
            <span>${escapeHtml(user.email)}</span>
          </div>
        </td>
        <td class="py-3 px-4 text-slate-300 text-xs">
          <div class="flex items-center gap-1.5">
            <i class="fa-solid fa-phone text-slate-500 text-[10px]"></i>
            <span>${escapeHtml(user.phoneNo || '-')}</span>
          </div>
        </td>
        <td class="py-3 px-4 font-mono text-[11px] text-slate-500">
          <span title="${escapeHtml(user._id)}">${(user._id || '').slice(0, 10)}...</span>
        </td>
        <td class="py-3 px-4 text-right">
          <div class="flex items-center justify-end gap-1.5">
            <button class="btn-action-view p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition" title="View details" data-id="${user._id}">
              <i class="fa-regular fa-eye"></i>
            </button>
            <button class="btn-action-edit p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition" title="Edit user" data-id="${user._id}">
              <i class="fa-solid fa-pencil text-xs"></i>
            </button>
            <button class="btn-action-delete p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition" title="Delete user" data-id="${user._id}">
              <i class="fa-regular fa-trash-can text-xs"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderGridView() {
  gridViewContainer.innerHTML = filteredUsers.map(user => {
    const initial = (user.name || 'U').charAt(0).toUpperCase();
    const gradClass = getAvatarColor(user.email || user.name);

    return `
      <div class="glass-card rounded-2xl p-5 flex flex-col justify-between group">
        <div>
          <!-- Header -->
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl ${gradClass} flex items-center justify-center font-bold text-white text-base shadow-lg">
                ${initial}
              </div>
              <div>
                <h4 class="font-bold text-slate-100 group-hover:text-indigo-300 transition text-sm leading-snug">${escapeHtml(user.name)}</h4>
                <span class="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Active
                </span>
              </div>
            </div>
            <div class="font-mono text-[10px] text-slate-500 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800">
              ${(user._id || '').slice(-6)}
            </div>
          </div>

          <!-- Contact Info -->
          <div class="mt-4 space-y-2 text-xs text-slate-300">
            <div class="flex items-center gap-2 overflow-hidden text-ellipsis">
              <i class="fa-regular fa-envelope text-slate-500 text-xs w-4 text-center"></i>
              <span class="truncate" title="${escapeHtml(user.email)}">${escapeHtml(user.email)}</span>
            </div>
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-phone text-slate-500 text-xs w-4 text-center"></i>
              <span>${escapeHtml(user.phoneNo || 'No phone')}</span>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <button class="btn-action-view text-xs text-slate-400 hover:text-white transition flex items-center gap-1" data-id="${user._id}">
            <i class="fa-regular fa-eye text-xs"></i> View
          </button>
          <div class="flex items-center gap-1">
            <button class="btn-action-edit px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition" data-id="${user._id}">
              <i class="fa-solid fa-pencil text-[10px] mr-1 text-amber-400"></i> Edit
            </button>
            <button class="btn-action-delete px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-xs font-medium transition border border-rose-500/20" data-id="${user._id}">
              <i class="fa-regular fa-trash-can text-[10px] mr-1"></i> Delete
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ----------------- EVENT LISTENERS -----------------

function setupEventListeners() {
  // Search input with debounce
  let searchTimeout = null;
  searchInput.addEventListener('input', () => {
    if (searchInput.value.trim().length > 0) {
      searchClearBtn.classList.remove('hidden');
    } else {
      searchClearBtn.classList.add('hidden');
    }
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(applyFilterAndSort, 200);
  });

  searchClearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchClearBtn.classList.add('hidden');
    applyFilterAndSort();
  });

  // Sort dropdown
  sortSelect.addEventListener('change', applyFilterAndSort);

  // View switchers
  viewModeTable.addEventListener('click', () => {
    activeView = 'table';
    viewModeTable.className = 'px-2.5 py-1 rounded-lg text-xs font-medium transition bg-indigo-600 text-white';
    viewModeGrid.className = 'px-2.5 py-1 rounded-lg text-xs font-medium transition text-slate-400 hover:text-slate-200';
    renderUsers();
  });

  viewModeGrid.addEventListener('click', () => {
    activeView = 'grid';
    viewModeGrid.className = 'px-2.5 py-1 rounded-lg text-xs font-medium transition bg-indigo-600 text-white';
    viewModeTable.className = 'px-2.5 py-1 rounded-lg text-xs font-medium transition text-slate-400 hover:text-slate-200';
    renderUsers();
  });

  // Refresh
  btnRefresh.addEventListener('click', loadUsers);

  // Hero Add User & Button
  const btnOpenCreateUser = document.getElementById('btn-open-create-user');
  const btnOpenCreateUserHero = document.getElementById('btn-open-create-user-hero');
  const btnEmptyAddUser = document.getElementById('btn-empty-add-user');

  [btnOpenCreateUser, btnOpenCreateUserHero, btnEmptyAddUser].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        document.getElementById('form-add-user').reset();
        openModal(modalAddUser);
      });
    }
  });

  // Auth buttons
  btnOpenLogin.addEventListener('click', () => openModal(modalLogin));
  btnOpenRegister.addEventListener('click', () => openModal(modalRegister));
  btnLogout.addEventListener('click', clearAuthSession);

  document.getElementById('btn-switch-to-register').addEventListener('click', () => {
    closeModal(modalLogin);
    openModal(modalRegister);
  });

  document.getElementById('btn-switch-to-login').addEventListener('click', () => {
    closeModal(modalRegister);
    openModal(modalLogin);
  });

  // API Settings
  const btnApiSettings = document.getElementById('btn-api-settings');
  const settingApiUrl = document.getElementById('setting-api-url');
  const settingJwtToken = document.getElementById('setting-jwt-token');
  const btnSaveApiSettings = document.getElementById('btn-save-api-settings');
  const btnResetApiSettings = document.getElementById('btn-reset-api-settings');

  if (btnApiSettings) {
    btnApiSettings.addEventListener('click', () => {
      settingApiUrl.value = API_BASE_URL;
      settingJwtToken.value = getAuthToken();
      openModal(modalApiSettings);
    });
  }

  btnSaveApiSettings.addEventListener('click', () => {
    const newUrl = settingApiUrl.value.trim().replace(/\/+$/, '');
    if (newUrl) {
      API_BASE_URL = newUrl;
      localStorage.setItem('usercurd_api_base', API_BASE_URL);
    }
    const token = settingJwtToken.value.trim();
    if (token) {
      localStorage.setItem('usercurd_token', token);
    }
    closeModal(modalApiSettings);
    updateApiDisplay();
    checkAuthStatus();
    loadUsers();
    showToast('Settings saved & reloaded', 'success');
  });

  btnResetApiSettings.addEventListener('click', () => {
    localStorage.removeItem('usercurd_api_base');
    API_BASE_URL = getInitialApiBase();
    settingApiUrl.value = API_BASE_URL;
    updateApiDisplay();
    showToast('Reset to default API URL', 'info');
  });

  // Modal Close buttons
  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal-backdrop');
      closeModal(modal);
    });
  });

  // Click on modal backdrop outside content box to close
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeModal(backdrop);
      }
    });
  });

  // ESC key to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });

  // Toggle password visibility
  document.querySelectorAll('.toggle-password-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.previousElementSibling;
      if (input && input.type === 'password') {
        input.type = 'text';
        btn.innerHTML = '<i class="fa-regular fa-eye-slash text-xs"></i>';
      } else if (input) {
        input.type = 'password';
        btn.innerHTML = '<i class="fa-regular fa-eye text-xs"></i>';
      }
    });
  });

  // Copy User ID
  const btnCopyId = document.getElementById('btn-copy-id');
  if (btnCopyId) {
    btnCopyId.addEventListener('click', () => {
      const idText = document.getElementById('view-id').textContent;
      navigator.clipboard.writeText(idText).then(() => {
        showToast('User ID copied to clipboard!', 'success');
      });
    });
  }

  // Action delegation (View, Edit, Delete) for table & grid
  document.getElementById('content-area').addEventListener('click', (e) => {
    const viewBtn = e.target.closest('.btn-action-view');
    const editBtn = e.target.closest('.btn-action-edit');
    const deleteBtn = e.target.closest('.btn-action-delete');

    if (viewBtn) {
      const id = viewBtn.getAttribute('data-id');
      handleViewUser(id);
    } else if (editBtn) {
      const id = editBtn.getAttribute('data-id');
      handleEditUser(id);
    } else if (deleteBtn) {
      const id = deleteBtn.getAttribute('data-id');
      handleDeleteClick(id);
    }
  });

  // Form: Create User
  document.getElementById('form-add-user').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-add-user');
    const name = document.getElementById('add-name').value.trim();
    const email = document.getElementById('add-email').value.trim();
    const phoneNo = document.getElementById('add-phone').value.trim();
    const password = document.getElementById('add-password').value;

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Creating...';

    try {
      const res = await fetch(`${API_BASE_URL}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phoneNo, password })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('User created successfully!', 'success');
        closeModal(modalAddUser);
        loadUsers();
      } else {
        throw new Error(data.message || 'Failed to create user');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<span>Create User</span>';
    }
  });

  // Form: Edit User
  document.getElementById('form-edit-user').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-edit-user');
    const id = document.getElementById('edit-id').value;
    const name = document.getElementById('edit-name').value.trim();
    const email = document.getElementById('edit-email').value.trim();
    const phoneNo = document.getElementById('edit-phone').value.trim();

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Updating...';

    try {
      const res = await fetch(`${API_BASE_URL}/update/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phoneNo })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('User updated successfully!', 'success');
        closeModal(modalEditUser);
        loadUsers();
      } else {
        throw new Error(data.message || 'Failed to update user');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<span>Update User</span>';
    }
  });

  // Form: Login
  document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-login');
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Logging in...';

    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (res.ok && data.success && data.token) {
        setAuthSession(data.token, data.User || { email });
        showToast(`Welcome back, ${data.User?.name || 'User'}!`, 'success');
        closeModal(modalLogin);
      } else {
        throw new Error(data.message || 'Invalid credentials');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Login';
    }
  });

  // Form: Register
  document.getElementById('form-register').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-register');
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const phoneNo = document.getElementById('reg-phone').value.trim();
    const password = document.getElementById('reg-password').value;

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Registering...';

    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phoneNo, password })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Registered successfully! Logging you in...', 'success');
        closeModal(modalRegister);

        // Attempt automatic login to obtain JWT token
        try {
          const loginRes = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          const loginData = await loginRes.json();
          if (loginData.success && loginData.token) {
            setAuthSession(loginData.token, loginData.User);
          }
        } catch {
          // Fallback, user can login manually
        }

        loadUsers();
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Register & Get Token';
    }
  });

  // Confirm Delete
  document.getElementById('btn-confirm-delete').addEventListener('click', async () => {
    if (!userToDelete) return;
    const btn = document.getElementById('btn-confirm-delete');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Deleting...';

    const token = getAuthToken();

    try {
      const res = await fetch(`${API_BASE_URL}/delete/${userToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('User deleted successfully', 'success');
        closeModal(modalDelete);
        userToDelete = null;
        loadUsers();
      } else {
        if (res.status === 401) {
          throw new Error('Unauthorized: You must log in first to delete users.');
        }
        throw new Error(data.message || 'Failed to delete user');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Delete Now';
    }
  });
}

// ----------------- ACTION HANDLERS -----------------

async function handleViewUser(id) {
  const user = allUsers.find(u => u._id === id);
  if (!user) return;

  document.getElementById('view-name').textContent = user.name;
  document.getElementById('view-email').textContent = user.email;
  document.getElementById('view-phone').textContent = user.phoneNo || 'Not provided';
  document.getElementById('view-id').textContent = user._id;

  const initial = (user.name || 'U').charAt(0).toUpperCase();
  const avatarEl = document.getElementById('view-avatar');
  avatarEl.textContent = initial;
  avatarEl.className = `w-14 h-14 rounded-2xl ${getAvatarColor(user.email || user.name)} flex items-center justify-center text-xl font-bold text-white shadow-lg`;

  openModal(modalViewUser);
}

function handleEditUser(id) {
  const user = allUsers.find(u => u._id === id);
  if (!user) return;

  document.getElementById('edit-id').value = user._id;
  document.getElementById('edit-display-id').value = user._id;
  document.getElementById('edit-name').value = user.name || '';
  document.getElementById('edit-email').value = user.email || '';
  document.getElementById('edit-phone').value = user.phoneNo || '';

  openModal(modalEditUser);
}

function handleDeleteClick(id) {
  const user = allUsers.find(u => u._id === id);
  if (!user) return;

  userToDelete = user;
  document.getElementById('delete-user-name').textContent = user.name || 'this user';

  const tokenBanner = document.getElementById('delete-token-banner');
  const token = getAuthToken();

  if (token) {
    tokenBanner.innerHTML = `
      <div class="flex items-center gap-2 text-emerald-400 font-medium">
        <i class="fa-solid fa-circle-check"></i>
        <span>Authenticated session verified (Bearer token active).</span>
      </div>
    `;
  } else {
    tokenBanner.innerHTML = `
      <div class="flex items-start gap-2 text-amber-400">
        <i class="fa-solid fa-triangle-exclamation mt-0.5"></i>
        <div>
          <span class="font-semibold">Note:</span> The backend requires a valid JWT Token to delete records.
          <br>
          <button type="button" id="btn-delete-prompt-login" class="mt-1.5 text-xs underline font-semibold text-indigo-400 hover:text-indigo-300">
            Click here to Login first
          </button>
        </div>
      </div>
    `;

    setTimeout(() => {
      const promptBtn = document.getElementById('btn-delete-prompt-login');
      if (promptBtn) {
        promptBtn.onclick = () => {
          closeModal(modalDelete);
          openModal(modalLogin);
        };
      }
    }, 50);
  }

  openModal(modalDelete);
}
