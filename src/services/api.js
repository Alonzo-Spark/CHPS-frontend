// ─── GLOBAL CONFIG ───────────────────────────────────────────────────────────
const BASE_URL = "http://localhost:5000";

export const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
});

// ─── AUTH STORAGE HELPERS ─────────────────────────────────────────────────────
export function saveAuthTokens({ token, refreshToken, user }) {
  if (token) localStorage.setItem("token", token);
  if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
  if (user) {
    localStorage.setItem("role", user.role);
    localStorage.setItem("user", JSON.stringify(user));
  }
}

export function clearAuthTokens() {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("role");
  localStorage.removeItem("user");
}

// ─── TOKEN REFRESH ────────────────────────────────────────────────────────────
let isRefreshing = false;
let refreshSubscribers = [];

function onTokenRefreshed(newToken) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

async function attemptTokenRefresh() {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) {
    clearAuthTokens();
    window.location.href = "/login";
    throw new Error("No refresh token available.");
  }

  if (isRefreshing) {
    return new Promise((resolve) => {
      refreshSubscribers.push((token) => resolve(token));
    });
  }

  isRefreshing = true;
  try {
    const res = await fetch(`${BASE_URL}/api/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    const data = await res.json();
    if (!data.success || !data.token) {
      clearAuthTokens();
      window.location.href = "/login";
      throw new Error("Session expired. Please log in again.");
    }
    localStorage.setItem("token", data.token);
    onTokenRefreshed(data.token);
    return data.token;
  } finally {
    isRefreshing = false;
  }
}

// ─── CORE REQUEST FUNCTION ────────────────────────────────────────────────────
export async function apiRequest(endpoint, opts = {}) {
  const url = `${BASE_URL}${endpoint}`;

  // For multipart (file upload), don't set Content-Type — browser does it
  const isFormData = opts.body instanceof FormData;
  const headers = isFormData
    ? { Authorization: `Bearer ${localStorage.getItem("token")}` }
    : { ...getHeaders(), ...(opts.headers || {}) };

  const res = await fetch(url, { ...opts, headers });

  if (res.status === 401) {
    try {
      await attemptTokenRefresh();
      // Retry with the new token
      const retryHeaders = isFormData
        ? { Authorization: `Bearer ${localStorage.getItem("token")}` }
        : { ...getHeaders(), ...(opts.headers || {}) };
      return fetch(url, { ...opts, headers: retryHeaders });
    } catch {
      throw new Error("Session expired. Please log in again.");
    }
  }

  return res;
}

// Convenience: apiRequest + parse JSON
export async function apiFetch(endpoint, opts = {}) {
  const res = await apiRequest(endpoint, opts);
  const data = await res.json().catch(() => ({ success: false, message: "Invalid response from server." }));
  return data;
}

// ─── BLOB DOWNLOAD HELPER ─────────────────────────────────────────────────────
export async function downloadBlob(endpoint, fileName) {
  const res = await apiRequest(endpoint);
  if (!res.ok) throw new Error("Download failed.");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 1 — AUTH
// ═══════════════════════════════════════════════════════════════════════════════
export const auth = {
  register: (payload) =>
    apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  login: (email, password) =>
    apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    apiFetch("/api/auth/logout", { method: "POST" }).catch(() => null),

  forgotPassword: (email) =>
    apiFetch("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token, newPassword, confirmPassword) =>
    apiFetch("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword, confirmPassword }),
    }),

  verifyEmail: (token) =>
    apiFetch("/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),

  me: () => apiFetch("/api/auth/me"),

  getRole: () => apiFetch("/api/auth/role"),

  getPermissions: () => apiFetch("/api/auth/permissions"),

  checkAccess: () => apiFetch("/api/auth/check-access"),
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 4 — DASHBOARD (Admin)
// ═══════════════════════════════════════════════════════════════════════════════
export const dashboard = {
  getSummary: () => apiFetch("/api/dashboard"),

  getStatistics: (from, to) => {
    const qs = new URLSearchParams({ ...(from && { from }), ...(to && { to }) });
    return apiFetch(`/api/dashboard/statistics?${qs}`);
  },

  getAnalytics: (from, to) => {
    const qs = new URLSearchParams({ ...(from && { from }), ...(to && { to }) });
    return apiFetch(`/api/dashboard/analytics?${qs}`);
  },

  getCharts: (type = "monthly", year = new Date().getFullYear()) =>
    apiFetch(`/api/dashboard/charts?type=${type}&year=${year}`),

  getRecentActivity: () => apiFetch("/api/dashboard/recent-activity"),
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 4b — ADMIN
// ═══════════════════════════════════════════════════════════════════════════════
export const admin = {
  getAnalytics: (from, to) => {
    const qs = new URLSearchParams({ ...(from && { from }), ...(to && { to }) });
    return apiFetch(`/api/admin/analytics?${qs}`);
  },

  getUsers: (page = 1, limit = 10, role = "", status = "") => {
    const qs = new URLSearchParams({ page, limit, ...(role && { role }), ...(status && { status }) });
    return apiFetch(`/api/admin/users?${qs}`);
  },

  getSystemMonitoring: () => apiFetch("/api/admin/system-monitoring"),

  getLogs: (page = 1, limit = 20, type = "") => {
    const qs = new URLSearchParams({ page, limit, ...(type && { type }) });
    return apiFetch(`/api/admin/logs?${qs}`);
  },

  triggerAutomation: (jobType, user_pan) =>
    apiFetch("/api/admin/automation/trigger", {
      method: "POST",
      body: JSON.stringify({ jobType, user_pan }),
    }),

  manualAssign: (payload) =>
    apiFetch("/api/admin/manual-assign", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 5 — NOTICES (Staff)
// ═══════════════════════════════════════════════════════════════════════════════
export const notices = {
  getStaffNotices: () => apiFetch("/api/staff/notices"),

  getAll: (params = {}) => {
    const qs = new URLSearchParams(params);
    return apiFetch(`/api/notices?${qs}`);
  },

  downloadPdf: (noticeId, fileName) =>
    downloadBlob(`/api/notices/download/${noticeId}`, fileName || `notice_${noticeId}.pdf`),

  updateStatus: (notice_id, status) =>
    apiFetch("/api/notices/status", {
      method: "PATCH",
      body: JSON.stringify({ notice_id, status }),
    }),
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 6 — USER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════
export const users = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params);
    return apiFetch(`/api/users?${qs}`);
  },

  getById: (id) => apiFetch(`/api/users/${id}`),

  create: (payload) =>
    apiFetch("/api/users", { method: "POST", body: JSON.stringify(payload) }),

  update: (id, payload) =>
    apiFetch(`/api/users/${id}`, { method: "PUT", body: JSON.stringify(payload) }),

  delete: (id) => apiFetch(`/api/users/${id}`, { method: "DELETE" }),

  updateStatus: (id, status) =>
    apiFetch(`/api/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  updateRole: (id, role) =>
    apiFetch(`/api/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),

  getProfile: () => apiFetch("/api/users/profile"),

  updateProfile: (payload) =>
    apiFetch("/api/users/profile", { method: "PUT", body: JSON.stringify(payload) }),
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 7 — NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════
export const notifications = {
  getAlerts: (page = 1, limit = 10) =>
    apiFetch(`/api/notifications/alerts?page=${page}&limit=${limit}`),

  markRead: (notificationId) =>
    apiFetch("/api/notifications/status", {
      method: "POST",
      body: JSON.stringify({ notificationId, status: "read" }),
    }),

  getHistory: (page = 1, limit = 20) =>
    apiFetch(`/api/notifications/history?page=${page}&limit=${limit}`),

  getSchedulerStatus: () => apiFetch("/api/notifications/scheduler"),
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 8 — AUTOMATION
// ═══════════════════════════════════════════════════════════════════════════════
export const automation = {
  getStatus: () => apiFetch("/api/automation/status"),

  getResults: (params = {}) => {
    const qs = new URLSearchParams(params);
    return apiFetch(`/api/automation/results?${qs}`);
  },

  trigger: (user_pan) =>
    apiFetch("/api/automation/trigger", {
      method: "POST",
      body: JSON.stringify({ user_pan }),
    }),

  getJob: (jobId) => apiFetch(`/api/automation/jobs/${jobId}`),

  getJobHistory: (params = {}) => {
    const qs = new URLSearchParams(params);
    return apiFetch(`/api/automation/jobs/history?${qs}`);
  },

  getFailedJobs: () => apiFetch("/api/automation/jobs/failed"),

  retryJob: (jobId, retryReason = "Manual retry requested") =>
    apiFetch(`/api/automation/jobs/retry/${jobId}`, {
      method: "POST",
      body: JSON.stringify({ retryReason }),
    }),

  getJobLogs: (jobId) => apiFetch(`/api/automation/jobs/logs/${jobId}`),

  getHealth: () => apiFetch("/api/automation/health"),
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 9 — SEARCH
// ═══════════════════════════════════════════════════════════════════════════════
export const search = {
  basic: (query, page = 1, limit = 10) =>
    apiFetch(`/api/search?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`),

  advanced: (params = {}) => {
    const qs = new URLSearchParams(params);
    return apiFetch(`/api/search/advanced?${qs}`);
  },

  suggestions: (query) =>
    apiFetch(`/api/search/suggestions?query=${encodeURIComponent(query)}`),
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 10 — FILE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════
export const files = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params);
    return apiFetch(`/api/files?${qs}`);
  },

  getById: (fileId) => apiFetch(`/api/files/${fileId}`),

  upload: (formData) =>
    apiRequest("/api/documents/upload", { method: "POST", body: formData }).then((r) => r.json()),

  download: (fileId, fileName) =>
    downloadBlob(`/api/files/download/${fileId}`, fileName || `file_${fileId}`),

  delete: (fileId) => apiFetch(`/api/files/${fileId}`, { method: "DELETE" }),

  getProcessingStatus: (fileId) =>
    apiFetch(`/api/files/processing-status/${fileId}`),
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 11 — REPORTS
// ═══════════════════════════════════════════════════════════════════════════════
export const reports = {
  getAll: (type = "") => apiFetch(`/api/reports${type ? `?type=${type}` : ""}`),

  generate: (payload) =>
    apiFetch("/api/reports/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getStatus: (reportId) => apiFetch(`/api/reports/status/${reportId}`),

  downloadCsv: (reportId) =>
    downloadBlob(`/api/reports/export/csv/${reportId}`, `report_${reportId}.csv`),

  downloadPdf: (reportId) =>
    downloadBlob(`/api/reports/export/pdf/${reportId}`, `report_${reportId}.pdf`),
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 12 — SYSTEM HEALTH
// ═══════════════════════════════════════════════════════════════════════════════
export const system = {
  getStartupSummary: () => apiFetch("/api/system/startup-summary"),
  getServerStatus: () => apiFetch("/api/system/server-status"),
  getDatabaseStatus: () => apiFetch("/api/system/database-status"),
};

export const scheduler = {
  getStatus: () => apiFetch("/api/scheduler/status"),
  getSummary: () => apiFetch("/api/scheduler/summary"),
  getHistory: () => apiFetch("/api/scheduler/history"),
  trigger: (payload) =>
    apiFetch("/api/scheduler/trigger", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 13 — LOGS
// ═══════════════════════════════════════════════════════════════════════════════
export const logs = {
  getRequests: (params = {}) => {
    const qs = new URLSearchParams(params);
    return apiFetch(`/api/logs/requests?${qs}`);
  },
  getErrors: (params = {}) => {
    const qs = new URLSearchParams(params);
    return apiFetch(`/api/logs/errors?${qs}`);
  },
  getAutomation: (params = {}) => {
    const qs = new URLSearchParams(params);
    return apiFetch(`/api/logs/automation?${qs}`);
  },
  getSecurity: (params = {}) => {
    const qs = new URLSearchParams(params);
    return apiFetch(`/api/logs/security?${qs}`);
  },
  getAudit: (params = {}) => {
    const qs = new URLSearchParams(params);
    return apiFetch(`/api/logs/audit?${qs}`);
  },
  getSystemSummary: () => apiFetch("/api/logs/system-summary"),
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 14 — WEBSOCKET
// ═══════════════════════════════════════════════════════════════════════════════
export function createWebSocket(onMessage, onOpen) {
  const token = localStorage.getItem("token");
  if (!token) return null;

  const ws = new WebSocket(`ws://localhost:5000/ws?token=${token}`);

  ws.onopen = () => {
    if (onOpen) onOpen();
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (onMessage) onMessage(data);
    } catch {
      // ignore malformed messages
    }
  };

  ws.onclose = () => {
    setTimeout(() => createWebSocket(onMessage, onOpen), 3000);
  };

  ws.onerror = () => {
    ws.close();
  };

  return ws;
}
