/* ═══════════════════════════════════════════════════════════════════
   NeuAI FabricGuard — Application Logic
   app.js — Single-page application controller
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

/* ── DEFECT DATABASE ──────────────────────────────────────────────
   Maps defect class names to root-cause analysis data.
   In production this would come from a backend model API.
   ─────────────────────────────────────────────────────────────── */
const DEFECT_DATABASE = {
  'hole': {
    label: 'Defect Found: Hole',
    status: 'defect',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><circle cx="12" cy="14" r="2.5"/></svg>`,
  },
  'stain': {
    label: 'Defect Found: Stain',
    status: 'defect',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>`,
  },
  'broken stitch': {
    label: 'Defect Found: Broken Stitch',
    status: 'defect',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 17H7A5 5 0 0 1 7 7"/><path d="M15 7h2a5 5 0 0 1 4 8"/><line x1="8" x2="12" y1="12" y2="12"/><line x1="2" x2="22" y1="2" y2="22"/></svg>`,
  },
  'needle mark': {
    label: 'Defect Found: Needle Mark',
    status: 'defect',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="m20 12-8 8-8-8"/></svg>`,
  },
  'pinched fabric': {
    label: 'Defect Found: Pinched Fabric',
    status: 'defect',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 11V7a5 5 0 0 1 10 0v4"/><path d="M11 21a2 2 0 0 0 2-2v-4a2 2 0 1 0-4 0v4a2 2 0 0 0 2 2z"/></svg>`,
  },
  'vertical': {
    label: 'Defect Found: Vertical Line',
    status: 'defect',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="3" x2="12" y2="21"/><line x1="8" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="16" y2="21"/></svg>`,
  },
  'horizontal': {
    label: 'Defect Found: Horizontal Line',
    status: 'defect',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="8" x2="21" y2="8"/><line x1="3" y1="16" x2="21" y2="16"/></svg>`,
  },
  'lines': {
    label: 'Defect Found: Lines',
    status: 'defect',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h18"/><path d="M3 12h18"/><path d="M3 17h18"/></svg>`,
  },
  'defect free': {
    label: 'Status: Defect Free',
    status: 'ok',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  },
};

/* ── DEMO IMAGE POOL ─────────────────────────────────────────── */
const DEMO_IMAGES = [
  'fabric_defect.png',
];

/* ── API CONFIGURATION ───────────────────────────────────────── */
const API_BASE_URL = "https://fabric-dd-bb.onrender.com";

function setAuthToken(token) {
  localStorage.setItem('token', token);
}

function getAuthToken() {
  return localStorage.getItem('token');
}

function removeAuthToken() {
  localStorage.removeItem('token');
}

/* ── ROLES ───────────────────────────────────────────────────── */
const ROLES = ['Floor Operator', 'Shift Supervisor', 'QA Manager', 'Plant Director'];
let currentRoleIndex = 0;

/* ─────────────────────────────────────────────────────────────
   APPLICATION STATE
   ───────────────────────────────────────────────────────────── */
const appState = {
  currentImage: null,
  currentResult: null,
  cameraStream: null,
  isCameraActive: false,
  isProcessing: false,
  logs: [],
  analytics: { total: 0, defects: 0, ok: 0 },
  user: { name: 'John Doe', email: '' },
};

/* ─────────────────────────────────────────────────────────────
   DOM ELEMENT REFERENCES
   ───────────────────────────────────────────────────────────── */
const $ = (id) => document.getElementById(id);

const DOM = {
  networkStatus: $('network-status'),
  statusDot: $('status-dot'),
  statusLabel: $('status-label'),
  logCountBadge: $('log-count-badge'),
  headerRight: $('header-right'),
  brandContainer: $('brand-container'),
  profileContainer: $('profile-container'),
  profileTrigger: $('profile-trigger'),
  profileName: $('profile-name'),
  profileDropdown: $('profile-dropdown'),

  loginLayout: $('login-layout'),
  loginView: $('login-view'),
  signupView: $('signup-view'),
  forgotView: $('forgot-view'),
  loginForm: $('login-form'),
  signupForm: $('signup-form'),
  forgotForm: $('forgot-form'),
  loginId: $('login-id'),
  loginPassword: $('login-password'),
  signupName: $('signup-name'),
  signupId: $('signup-id'),
  signupPassword: $('signup-password'),
  btnShowSignup: $('btn-show-signup'),
  btnShowLogin: $('btn-show-login'),
  btnShowForgot: $('btn-show-forgot'),
  btnTogglePasswords: document.querySelectorAll('.btn-toggle-password'),
  forgotStep1: $('forgot-step-1'),
  forgotStep2: $('forgot-step-2'),
  btnResetPassword: $('btn-reset-password'),

  viewCapture: $('view-capture'),
  cameraFrame: $('camera-frame'),
  cameraIdle: $('camera-idle'),
  cameraFeed: $('camera-feed'),
  imagePreview: $('image-preview'),
  scanLine: $('scan-line'),
  processingOverlay: $('processing-overlay'),
  progressBar: $('progress-bar'),
  btnOpenCamera: $('btn-open-camera'),
  btnUploadImage: $('btn-upload-image'),
  btnCapturePhoto: $('btn-capture-photo'),
  btnDemoScan: $('btn-demo-scan'),
  fileInput: $('file-input'),
  captureCanvas: $('capture-canvas'),

  viewResults: $('view-results'),
  resultTimestamp: $('result-timestamp'),
  classificationBanner: $('classification-banner'),
  classificationIcon: $('classification-icon'),
  classificationLabel: $('classification-label'),
  classificationValue: $('classification-value'),
  confidenceValue: $('confidence-value'),
  resultImage: $('result-image'),
  qsDefectType: $('qs-defect-type'),
  qsSeverity: $('qs-severity'),
  qsConfidence: $('qs-confidence'),
  reason1: $('reason-1'),
  reason2: $('reason-2'),
  reason3: $('reason-3'),
  machineResponsible: $('machine-responsible'),
  correctiveSuggestion: $('corrective-suggestion'),
  btnLogErp: $('btn-log-erp'),
  btnGeneratePdf: $('btn-generate-pdf'),
  btnClear: $('btn-clear'),
  toastContainer: $('toast-container'),

  shiftLogsPanel: $('shift-logs-panel'),
  logsClose: $('logs-close'),
  sidebarBackdrop: $('sidebar-backdrop'),
  logsTableBody: $('logs-table-body'),
  logsEmptyRow: $('logs-empty-row'),
  analyticsTotal: $('analytics-total'),
  analyticsDefects: $('analytics-defects'),
  analyticsOk: $('analytics-ok'),
  analyticsRate: $('analytics-rate'),
  btnExportCsv: $('btn-export-csv'),
  btnClearLogs: $('btn-clear-logs'),

  erpModal: $('erp-modal'),
  erpModalClose: $('erp-modal-close'),
  erpCancel: $('erp-cancel'),
  erpSubmit: $('erp-submit'),
  erpNotes: $('erp-notes'),
};

/* ═══════════════════════════════════════════════════════════════
   1. NETWORK STATUS MONITOR
   ═══════════════════════════════════════════════════════════════ */
function updateNetworkStatus() {
  const online = navigator.onLine;
  DOM.statusDot.className = `status-dot status-dot--${online ? 'online' : 'offline'}`;
  DOM.statusLabel.textContent = online ? 'Online' : 'Offline';
  DOM.networkStatus.setAttribute('aria-label', `Network status: ${online ? 'Online' : 'Offline'}`);
  if (!online) showToast('warning', 'Offline Mode', 'Network unavailable. Results cached locally.', 5000);
}

function initNetworkStatusListener() {
  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
  updateNetworkStatus();
}

/* ═══════════════════════════════════════════════════════════════
   2. PROFILE DROPDOWN
   ═══════════════════════════════════════════════════════════════ */
function toggleProfileDropdown() {
  const isExpanded = DOM.profileTrigger.getAttribute('aria-expanded') === 'true';
  DOM.profileTrigger.setAttribute('aria-expanded', !isExpanded);
  DOM.profileDropdown.classList.toggle('hidden');
}

function closeProfileDropdown() {
  DOM.profileTrigger.setAttribute('aria-expanded', 'false');
  DOM.profileDropdown.classList.add('hidden');
}

function signOut() {
  closeProfileDropdown();
  removeAuthToken();
  appState.user.name = '';
  appState.user.email = '';

  $('app-layout').classList.add('hidden');
  DOM.headerRight.classList.add('hidden');
  DOM.loginLayout.classList.remove('hidden');
  setTimeout(() => DOM.loginLayout.classList.add('active'), 10);

  showLoginView();
  showToast('info', 'Signed Out', 'You have been securely logged out.');
}

function initProfileDropdownListeners() {
  if (!DOM.profileTrigger) return;

  DOM.profileTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleProfileDropdown();
  });

  document.addEventListener('click', (e) => {
    if (!DOM.profileContainer.contains(e.target)) closeProfileDropdown();
  });

  document.querySelectorAll('.btn-sign-out-trigger').forEach(btn => {
    btn.addEventListener('click', signOut);
  });
}

/* ═══════════════════════════════════════════════════════════════
   2.1 LOGIN CONTROLLER
   ═══════════════════════════════════════════════════════════════ */
async function handleLogin(e) {
  e.preventDefault();

  const email = DOM.loginId.value.trim();

  if (!email) {
    showToast('error', 'Missing Email', 'Please enter any email to continue.');
    return;
  }

  appState.user.name = email.split('@')[0] || 'Guest User';
  appState.user.email = email;
  DOM.profileName.textContent = appState.user.name;

  DOM.loginLayout.classList.remove('active');
  DOM.loginLayout.classList.add('hidden');
  $('app-layout').classList.remove('hidden');
  DOM.headerRight.classList.remove('hidden');

  showToast('success', 'Access Granted', `Welcome, ${appState.user.name}.`);
}

async function handleSignup(e) {
  e.preventDefault();

  const name = DOM.signupName.value.trim();
  const email = DOM.signupId.value.trim();
  const password = DOM.signupPassword.value.trim();

  if (!name || !email || !password) {
    showToast('error', 'Validation Error', 'Please fill in all fields.');
    return;
  }

  const btn = DOM.signupForm.querySelector('button[type="submit"]');
  const originalLabel = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span style="display:flex;align-items:center;gap:8px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin-ring 0.8s linear infinite;"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>Creating Account...</span>`;

  try {
    const response = await fetch(`${API_BASE_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        full_name: name,
        username: email,
        email: email,
        password: password
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Signup failed');
    }

    appState.user.name = name;
    appState.user.email = email;

    btn.disabled = false;
    btn.innerHTML = originalLabel;

    showToast('success', 'Account Created', `Registration successful for ${name}. You can now sign in.`);
    showLoginView();
  } catch (err) {
    console.error('Signup error:', err);
    btn.disabled = false;
    btn.innerHTML = originalLabel;
    showToast('error', 'Signup Failed', err.message || 'Please check your credentials and try again.');
  }
}

function handleForgotPassword(e) {
  e.preventDefault();

  const btn = DOM.forgotForm.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.innerHTML = `<span style="display:flex;align-items:center;gap:8px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin-ring 0.8s linear infinite;"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>Sending OTP...</span>`;

  setTimeout(() => {
    btn.disabled = false;
    btn.innerHTML = `Send OTP`;

    DOM.forgotStep1.classList.add('hidden');
    DOM.forgotStep2.classList.remove('hidden');
    showToast('info', 'OTP Sent', 'Check your email for the 6-digit reset code.');
  }, 1200);
}

function handleResetPassword() {
  const btn = DOM.btnResetPassword;
  btn.disabled = true;
  btn.innerHTML = `<span style="display:flex;align-items:center;gap:8px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin-ring 0.8s linear infinite;"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>Updating...</span>`;

  setTimeout(() => {
    btn.disabled = false;
    btn.innerHTML = `<span class="btn__label">Update Password</span>`;

    showToast('success', 'Password Updated', 'Your password has been reset successfully.');
    showLoginView();

    setTimeout(() => {
      DOM.forgotStep1.classList.remove('hidden');
      DOM.forgotStep2.classList.add('hidden');
    }, 500);
  }, 1500);
}

function showSignupView() {
  hideAllAuthViews();
  DOM.signupView.classList.remove('hidden');
  setTimeout(() => DOM.signupView.classList.add('active'), 10);
}

function showLoginView() {
  hideAllAuthViews();
  DOM.loginView.classList.remove('hidden');
  setTimeout(() => DOM.loginView.classList.add('active'), 10);
}

function showForgotView() {
  hideAllAuthViews();
  DOM.forgotView.classList.remove('hidden');
  setTimeout(() => DOM.forgotView.classList.add('active'), 10);
}

function hideAllAuthViews() {
  [DOM.loginView, DOM.signupView, DOM.forgotView].forEach(view => {
    view.classList.remove('active');
    view.classList.add('hidden');
  });
}

function togglePasswordVisibility(e) {
  const btn = e.currentTarget;
  const input = btn.parentElement.querySelector('input');
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';

  btn.innerHTML = isPassword
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
}

function initAuthListeners() {
  if (DOM.loginForm) DOM.loginForm.addEventListener('submit', handleLogin);
  if (DOM.signupForm) DOM.signupForm.addEventListener('submit', handleSignup);
  if (DOM.forgotForm) DOM.forgotForm.addEventListener('submit', handleForgotPassword);
  if (DOM.btnResetPassword) DOM.btnResetPassword.addEventListener('click', handleResetPassword);

  if (DOM.btnShowSignup) DOM.btnShowSignup.addEventListener('click', showSignupView);
  if (DOM.btnShowLogin) DOM.btnShowLogin.addEventListener('click', showLoginView);
  if (DOM.btnShowForgot) DOM.btnShowForgot.addEventListener('click', showForgotView);

  document.querySelectorAll('.btn-show-login-alt').forEach(btn => {
    btn.addEventListener('click', showLoginView);
  });

  if (DOM.btnTogglePasswords) {
    DOM.btnTogglePasswords.forEach(btn => btn.addEventListener('click', togglePasswordVisibility));
  }
}

/* ═══════════════════════════════════════════════════════════════
   3. SHIFT LOGS SIDEBAR
   ═══════════════════════════════════════════════════════════════ */
function openLogsPanel() {
  if (!DOM.shiftLogsPanel) return;
  DOM.shiftLogsPanel.setAttribute('aria-hidden', 'false');
  DOM.sidebarBackdrop.classList.remove('hidden');
  if (DOM.logsToggle) DOM.logsToggle.setAttribute('aria-expanded', 'true');
  if (DOM.logsClose) DOM.logsClose.focus();
  document.body.style.overflow = 'hidden';
}

function closeLogsPanel() {
  if (!DOM.shiftLogsPanel) return;
  DOM.shiftLogsPanel.setAttribute('aria-hidden', 'true');
  if (DOM.sidebarBackdrop) DOM.sidebarBackdrop.classList.add('hidden');
  if (DOM.logsToggle) DOM.logsToggle.setAttribute('aria-expanded', 'false');
  if (DOM.logsToggle) DOM.logsToggle.focus();
  document.body.style.overflow = '';
}

function initLogsPanelListeners() {
  if (DOM.logsToggle) {
    DOM.logsToggle.addEventListener('click', () => {
      const isOpen = DOM.shiftLogsPanel.getAttribute('aria-hidden') === 'false';
      isOpen ? closeLogsPanel() : openLogsPanel();
    });
  }

  if (DOM.logsClose) DOM.logsClose.addEventListener('click', closeLogsPanel);
  if (DOM.sidebarBackdrop) DOM.sidebarBackdrop.addEventListener('click', closeLogsPanel);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (DOM.shiftLogsPanel && DOM.shiftLogsPanel.getAttribute('aria-hidden') === 'false') closeLogsPanel();
    }
  });
}

/* ═══════════════════════════════════════════════════════════════
   4. CAMERA & IMAGE CAPTURE
   ═══════════════════════════════════════════════════════════════ */
function initCameraListeners() {
  if (!DOM.btnOpenCamera) return;

  DOM.btnOpenCamera.addEventListener('click', async () => {
    if (appState.isCameraActive) {
      stopCamera();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      appState.cameraStream = stream;
      appState.isCameraActive = true;

      DOM.cameraFeed.srcObject = stream;
      DOM.cameraFeed.classList.remove('hidden');
      DOM.cameraIdle.classList.add('hidden');
      DOM.imagePreview.classList.add('hidden');
      DOM.scanLine.classList.remove('hidden');

      DOM.btnOpenCamera.innerHTML = `
        <span class="btn__icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </span>
        <span class="btn__label">Stop Camera</span>`;
      DOM.btnCapturePhoto.classList.remove('hidden');
      DOM.btnUploadImage.classList.add('hidden');
      showToast('info', 'Camera Active', 'Point camera at fabric sample, then tap Capture.');
    } catch (err) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError') {
        showToast('error', 'Permission Denied', 'Camera access was blocked. Falling back to file upload.');
      } else if (err.name === 'NotFoundError') {
        showToast('error', 'No Camera Found', 'No camera device detected. Use file upload instead.');
      } else {
        showToast('error', 'Camera Error', err.message || 'Could not access camera device.');
      }
    }
  });

  if (DOM.btnCapturePhoto) {
    DOM.btnCapturePhoto.addEventListener('click', () => {
      const video = DOM.cameraFeed;
      const canvas = DOM.captureCanvas;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataURL = canvas.toDataURL('image/jpeg', 0.92);
      stopCamera();
      processImage(dataURL, 'camera');
    });
  }

  if (DOM.btnUploadImage) {
    DOM.btnUploadImage.addEventListener('click', () => {
      DOM.fileInput.click();
    });
  }

  if (DOM.fileInput) {
    DOM.fileInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        showToast('error', 'Invalid File', 'Please select a valid image file (JPEG, PNG, TIFF, etc.).');
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        showToast('error', 'File Too Large', 'Maximum image size is 20 MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => processImage(ev.target.result, 'upload');
      reader.readAsDataURL(file);
      e.target.value = '';
    });
  }
}

function stopCamera() {
  if (appState.cameraStream) {
    appState.cameraStream.getTracks().forEach(t => t.stop());
    appState.cameraStream = null;
  }
  appState.isCameraActive = false;
  DOM.cameraFeed.srcObject = null;
  DOM.cameraFeed.classList.add('hidden');
  DOM.scanLine.classList.add('hidden');
  DOM.btnCapturePhoto.classList.add('hidden');
  DOM.btnUploadImage.classList.remove('hidden');
  DOM.cameraIdle.classList.remove('hidden');
  DOM.btnOpenCamera.innerHTML = `
    <span class="btn__icon" aria-hidden="true">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
        <circle cx="12" cy="13" r="4"/>
      </svg>
    </span>
    <span class="btn__label">Open Device Camera</span>`;
}

/* ═══════════════════════════════════════════════════════════════
   5. REAL AI PROCESSING
   ═══════════════════════════════════════════════════════════════ */
function dataURLtoBlob(dataurl) {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], { type: mime });
}

function buildDemoResult() {
  return {
    key: 'hole',
    label: 'Defect Found: Hole',
    status: 'defect',
    severity: 'High',
    icon: DEFECT_DATABASE['hole'].icon,
    reason1: 'Broken needle hook or sharp metal fragment puncturing fabric.',
    reason2: 'Weak yarn snapping under excess tensile stress during knitting.',
    reason3: 'Improper fabric take-up tension pulling too tight.',
    machine: 'Knitting Machine / Circular Weft Knitter',
    suggestion: 'Inspect needle bed immediately, replace damaged hooks, and verify yarn feeder tension settings.',
    confidence: '94.2',
    detection_count: 1,
    detections: [
      {
        detection_id: 1,
        defect_type: 'hole',
        defect_key: 'hole',
        confidence: 94.2,
        bbox: {
          x1: 80,
          y1: 60,
          x2: 180,
          y2: 160,
          width: 100,
          height: 100
        },
        reason_1: 'Broken needle hook or sharp metal fragment puncturing fabric.',
        reason_2: 'Weak yarn snapping under excess tensile stress during knitting.',
        reason_3: 'Improper fabric take-up tension pulling too tight.',
        machine: 'Knitting Machine / Circular Weft Knitter',
        suggestion: 'Inspect needle bed immediately, replace damaged hooks, and verify yarn feeder tension settings.'
      }
    ],
    source: 'demo'
  };
}

async function processImage(imageDataURL, source) {
  if (appState.isProcessing) return;
  appState.isProcessing = true;
  appState.currentImage = imageDataURL;

  DOM.imagePreview.src = imageDataURL;
  DOM.imagePreview.classList.remove('hidden');
  DOM.cameraIdle.classList.add('hidden');
  DOM.processingOverlay.classList.remove('hidden');

  const modelNames = [
    'YOLOv8 Model Processing...',
    'Loading inference engine...',
    'Detecting fabric anomalies...',
    'Analyzing defect patterns...',
    'Cross-referencing datasets...',
    'Finalizing diagnostic report...',
  ];
  const modelNameEl = DOM.processingOverlay.querySelector('.processing-model-name');
  let labelIdx = 0;
  const labelInterval = setInterval(() => {
    labelIdx = (labelIdx + 1) % modelNames.length;
    modelNameEl.textContent = modelNames[labelIdx];
  }, 500);

  try {
    let blob;

    if (imageDataURL.startsWith('data:')) {
      blob = dataURLtoBlob(imageDataURL);
    } else {
      const response = await fetch(imageDataURL);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
      blob = await response.blob();
    }

    const formData = new FormData();
    formData.append('file', blob, 'capture.jpg');

    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend prediction failed: ${response.status} - ${errorText}`);
    }

    const apiResult = await response.json();
    console.log('predict response', apiResult);

    clearInterval(labelInterval);
    DOM.processingOverlay.classList.add('hidden');
    appState.isProcessing = false;

    const uiConfig = DEFECT_DATABASE[apiResult.defect_key] || DEFECT_DATABASE['hole'];

    const result = {
      key: apiResult.defect_key,
      label: apiResult.status === 'ok'
        ? 'Status: Defect Free'
        : `Defect Found: ${apiResult.defect_label}`,
      status: apiResult.status,
      severity: apiResult.severity,
      icon: uiConfig.icon,
      reason1: apiResult.reason_1,
      reason2: apiResult.reason_2,
      reason3: apiResult.reason_3,
      machine: apiResult.machine,
      suggestion: apiResult.suggestion,
      confidence: apiResult.confidence,
      detection_count: apiResult.detection_count,
      detections: apiResult.detections || [],
      source: source
    };

    appState.currentResult = result;
    console.log('final result object', result);
    console.log('calling showResults now');
    showResults(result, imageDataURL, apiResult.confidence);

  } catch (err) {
    console.error('Processing error:', err);
    clearInterval(labelInterval);
    DOM.processingOverlay.classList.add('hidden');
    appState.isProcessing = false;

    if (source === 'demo') {
      const demoResult = buildDemoResult();
      appState.currentResult = demoResult;
      showResults(demoResult, imageDataURL, demoResult.confidence);
      showToast('info', 'Demo Mode', 'Backend unavailable, showing demo result.', 5000);
      return;
    }

    showToast(
      'error',
      'Prediction Failed',
      err.message || 'Could not connect to the backend server.',
      8000
    );
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ═══════════════════════════════════════════════════════════════
   6. DISPLAY RESULTS
   ═══════════════════════════════════════════════════════════════ */

function drawBoundingBoxes(imageElement, detections) {
  // Create canvas overlay for bounding boxes
  let canvas = imageElement.nextElementSibling;
  if (!canvas || canvas.tagName !== 'CANVAS') {
    canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = imageElement.offsetTop + 'px';
    canvas.style.left = imageElement.offsetLeft + 'px';
    canvas.style.cursor = 'pointer';
    imageElement.parentElement.style.position = 'relative';
    imageElement.parentElement.insertBefore(canvas, imageElement.nextSibling);
  }

  canvas.width = imageElement.width;
  canvas.height = imageElement.height;
  
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];

  detections.forEach((detection, idx) => {
    const bbox = detection.bbox;
    const color = colors[idx % colors.length];
    
    // Draw rectangle
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(bbox.x1, bbox.y1, bbox.width, bbox.height);

    // Draw label background
    const label = `${detection.defect_type} ${detection.confidence}%`;
    ctx.font = 'bold 14px Arial';
    const textMetrics = ctx.measureText(label);
    const textWidth = textMetrics.width + 10;
    const textHeight = 24;

    ctx.fillStyle = color;
    ctx.fillRect(bbox.x1, bbox.y1 - textHeight, textWidth, textHeight);

    // Draw label text
    ctx.fillStyle = '#000000';
    ctx.fillText(label, bbox.x1 + 5, bbox.y1 - 8);
  });

  return canvas;
}

function showResults(result, imageURL, confidence) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  DOM.viewCapture.classList.remove('active');
  DOM.viewCapture.classList.add('hidden');
  DOM.viewResults.classList.add('active');
  DOM.viewResults.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  DOM.resultTimestamp.textContent = `Analysis completed at ${timeStr} — ${dateStr}`;

  DOM.classificationBanner.className = `classification-banner state--${result.status}`;
  DOM.classificationIcon.innerHTML = result.icon;
  DOM.classificationLabel.textContent = result.status === 'ok' ? 'Quality Status' : 'Defect Alert';
  DOM.classificationValue.textContent = result.label;
  DOM.confidenceValue.textContent = `${confidence}%`;

  DOM.resultImage.src = imageURL;

  const defectClass = (result.key === 'defect_free' || result.key === 'defect free')
    ? 'Clear'
    : String(result.key || 'Unknown').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  DOM.qsDefectType.textContent = defectClass;
  DOM.qsSeverity.textContent = result.severity;
  DOM.qsConfidence.textContent = `${confidence}%`;

  if (DOM.reason1) DOM.reason1.textContent = result.reason1;
  if (DOM.reason2) DOM.reason2.textContent = result.reason2;
  if (DOM.reason3) DOM.reason3.textContent = result.reason3;
  if (DOM.machineResponsible) DOM.machineResponsible.textContent = result.machine;
  if (DOM.correctiveSuggestion) DOM.correctiveSuggestion.textContent = result.suggestion;

  // Draw bounding boxes if detection data is available
  if (result.detections && result.detections.length > 0) {
    DOM.resultImage.onload = () => {
      drawBoundingBoxes(DOM.resultImage, result.detections);
    };
    if (DOM.resultImage.complete) {
      drawBoundingBoxes(DOM.resultImage, result.detections);
    }
  }

  addLogEntry(result, confidence, timeStr);

  if (result.status === 'defect') {
    const detectionInfo = result.detection_count ? ` (${result.detection_count} detection${result.detection_count > 1 ? 's' : ''})` : '';
    showToast('error', 'Defect Detected', `${result.label}${detectionInfo} — Confidence: ${confidence}%`, 6000);
  } else {
    showToast('success', 'Inspection Passed', `Fabric sample cleared. Confidence: ${confidence}%`, 5000);
  }
}

/* ═══════════════════════════════════════════════════════════════
   7. CLEAR / NEXT SCAN
   ═══════════════════════════════════════════════════════════════ */
function initClearButton() {
  if (!DOM.btnClear) return;

  DOM.btnClear.addEventListener('click', () => {
    appState.currentImage = null;
    appState.currentResult = null;

    DOM.imagePreview.src = '';
    DOM.imagePreview.classList.add('hidden');
    DOM.cameraIdle.classList.remove('hidden');

    // Remove bounding box canvas
    const canvas = DOM.resultImage?.nextElementSibling;
    if (canvas && canvas.tagName === 'CANVAS') {
      canvas.remove();
    }

    DOM.viewResults.classList.remove('active');
    DOM.viewResults.classList.add('hidden');
    DOM.viewCapture.classList.add('active');
    DOM.viewCapture.classList.remove('hidden');

    DOM.processingOverlay.classList.add('hidden');

    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('info', 'Workspace Cleared', 'Ready for the next fabric scan.');
  });
}

/* ═══════════════════════════════════════════════════════════════
   8. LOG ENTRIES & ANALYTICS
   ═══════════════════════════════════════════════════════════════ */
function addLogEntry(result, confidence, timeStr) {
  const defectClass = result.key === 'defect_free'
    ? 'Defect Free'
    : result.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  const entry = {
    id: Date.now(),
    time: timeStr,
    defectType: defectClass,
    machine: result.machine,
    status: result.status,
    confidence,
  };
  appState.logs.unshift(entry);

  appState.analytics.total++;
  if (result.status === 'defect') {
    appState.analytics.defects++;
  } else {
    appState.analytics.ok++;
  }

  updateAnalytics();
  renderLogsTable();

  if (DOM.logCountBadge) {
    DOM.logCountBadge.textContent = appState.logs.length;
    DOM.logCountBadge.setAttribute('aria-label', `${appState.logs.length} log entries`);
  }
}

function updateAnalytics() {
  const { total, defects, ok } = appState.analytics;
  DOM.analyticsTotal.textContent = total;
  DOM.analyticsDefects.textContent = defects;
  DOM.analyticsOk.textContent = ok;
  const rate = total > 0 ? ((defects / total) * 100).toFixed(1) : '0';
  DOM.analyticsRate.textContent = `${rate}%`;
}

function renderLogsTable() {
  const tbody = DOM.logsTableBody;

  if (DOM.logsEmptyRow && DOM.logsEmptyRow.parentElement) {
    DOM.logsEmptyRow.remove();
  }

  Array.from(tbody.querySelectorAll('.log-data-row')).forEach(r => r.remove());

  if (appState.logs.length === 0) {
    tbody.appendChild(DOM.logsEmptyRow);
    return;
  }

  appState.logs.slice(0, 50).forEach((entry) => {
    const tr = document.createElement('tr');
    tr.className = 'log-data-row';
    tr.innerHTML = `
      <td>${escapeHtml(entry.time)}</td>
      <td>${escapeHtml(entry.defectType)}</td>
      <td style="font-family: var(--ff-mono); font-size: var(--fs-xs); color: var(--clr-text-secondary);">${escapeHtml(entry.machine)}</td>
      <td style="font-family: var(--ff-mono); font-size: var(--fs-xs); color: var(--clr-accent);">${escapeHtml(entry.confidence)}%</td>
      <td>
        <span class="log-status-badge log-status-badge--${entry.status === 'defect' ? 'defect' : 'ok'}">
          ${entry.status === 'defect' ? 'Defect' : 'Clear'}
        </span>
      </td>`;
    tbody.appendChild(tr);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

/* ═══════════════════════════════════════════════════════════════
   9. CSV EXPORT & LOGS MANAGEMENT
   ═══════════════════════════════════════════════════════════════ */
function initLogsListeners() {
  if (DOM.btnExportCsv) {
    DOM.btnExportCsv.addEventListener('click', () => {
      if (appState.logs.length === 0) {
        showToast('warning', 'No Data', 'No scan logs to export yet.');
        return;
      }
      const headers = ['Time', 'Defect Type', 'Machine', 'Confidence (%)', 'Status'];
      const rows = appState.logs.map(e => [
        e.time,
        e.defectType,
        e.machine,
        e.confidence,
        e.status === 'defect' ? 'Defect Found' : 'Defect Free',
      ]);
      const csvContent = [headers, ...rows]
        .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fabricguard_shift_log_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('success', 'CSV Exported', `${appState.logs.length} records exported successfully.`);
    });
  }

  if (DOM.btnClearLogs) {
    DOM.btnClearLogs.addEventListener('click', () => {
      if (appState.logs.length === 0) {
        showToast('warning', 'Already Clear', 'No logs to clear.');
        return;
      }
      if (!confirm('Clear all shift logs? This action cannot be undone.')) return;
      appState.logs = [];
      appState.analytics = { total: 0, defects: 0, ok: 0 };
      updateAnalytics();
      renderLogsTable();
      if (DOM.logCountBadge) {
        DOM.logCountBadge.textContent = '0';
        DOM.logCountBadge.setAttribute('aria-label', '0 log entries');
      }
      showToast('info', 'Logs Cleared', 'All shift logs have been cleared.');
    });
  }
}


/* ═══════════════════════════════════════════════════════════════
   13. TOAST NOTIFICATION SYSTEM
   ═══════════════════════════════════════════════════════════════ */
const TOAST_ICONS = {
  success: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00e676" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
  error: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff3d5c" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  warning: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffab00" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  info: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e8821a" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
};

const toastClassMap = { success: 'success', error: 'error', warning: 'info', info: 'info' };

let toastQueue = [];

function showToast(type, title, message, duration = 4000) {
  const toast = document.createElement('div');
  const cssType = toastClassMap[type] || 'info';
  toast.className = `toast toast--${cssType}`;
  toast.setAttribute('role', 'alert');

  toast.innerHTML = `
    <div class="toast__icon">${TOAST_ICONS[type] || TOAST_ICONS.info}</div>
    <div class="toast__body">
      <div class="toast__title">${escapeHtml(title)}</div>
      <div class="toast__msg">${escapeHtml(message)}</div>
    </div>`;

  DOM.toastContainer.appendChild(toast);
  toastQueue.push(toast);

  while (toastQueue.length > 4) {
    const old = toastQueue.shift();
    old.remove();
  }

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    setTimeout(() => {
      toast.remove();
      toastQueue = toastQueue.filter(t => t !== toast);
    }, 320);
  }, duration);
}

/* ═══════════════════════════════════════════════════════════════
   14. DEMO PREFILL
   ═══════════════════════════════════════════════════════════════ */
function loadDemoLogs() {
  const demoEntries = [
    { time: '08:02:15', defectType: 'Hole', machine: 'Circular Weft Knitter', status: 'defect', confidence: '94.3' },
    { time: '08:17:44', defectType: 'Defect Free', machine: 'Rapier Loom', status: 'ok', confidence: '97.1' },
    { time: '08:35:09', defectType: 'Scratch', machine: 'Projectile Loom', status: 'defect', confidence: '88.7' },
    { time: '08:52:31', defectType: 'Defect Free', machine: 'Circular Weft Knitter', status: 'ok', confidence: '91.5' },
    { time: '09:11:00', defectType: 'Oil Stain', machine: 'Power Loom', status: 'defect', confidence: '85.2' },
  ];

  demoEntries.forEach(e => {
    appState.logs.push({ id: Date.now() + Math.random(), ...e });
    appState.analytics.total++;
    if (e.status === 'defect') appState.analytics.defects++;
    else appState.analytics.ok++;
  });

  updateAnalytics();
  renderLogsTable();
  if (DOM.logCountBadge) {
    DOM.logCountBadge.textContent = appState.logs.length;
    DOM.logCountBadge.setAttribute('aria-label', `${appState.logs.length} log entries`);
  }
}

/* ═══════════════════════════════════════════════════════════════
   15. DEMO QUICK-TEST BUTTON
   ═══════════════════════════════════════════════════════════════ */
function initDemoButton() {
  if (!DOM.btnDemoScan) return;

  DOM.btnDemoScan.addEventListener('click', () => {
    const imgUrl = DEMO_IMAGES[Math.floor(Math.random() * DEMO_IMAGES.length)];
    processImage(imgUrl, 'demo');
  });
}

/* ═══════════════════════════════════════════════════════════════
   16. SERVICE WORKER REGISTRATION
   ═══════════════════════════════════════════════════════════════ */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* Service worker optional — fail silently */
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════════════════ */
function init() {
  // Initialize all event listeners (must happen after DOMContentLoaded)
  initNetworkStatusListener();
  initAuthListeners();
  initProfileDropdownListeners();
  initLogsPanelListeners();
  initCameraListeners();
  initClearButton();
  initLogsListeners();
  initDemoButton();

  // Load demo data
  loadDemoLogs();

  setTimeout(() => {
    showToast('info', 'System Ready', 'EfficientNetB0 model loaded. Tap "Demo Scan" to try instantly.', 6000);
  }, 800);
}

document.addEventListener('DOMContentLoaded', init);
