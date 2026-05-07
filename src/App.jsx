import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Layout from './components/Layout';

// Pages
import LoginPage        from './pages/LoginPage';
import SignupPage       from './pages/SignupPage';
import VerifyEmailPage  from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage  from './pages/ResetPasswordPage';
import AdminDashboard   from './pages/AdminDashboard';
import StaffDashboard   from './pages/StaffDashboard';
import NoticesPage      from './pages/NoticesPage';
import TasksPage        from './pages/TasksPage';
import DocumentsPage    from './pages/DocumentsPage';
import SettingsPage     from './pages/SettingsPage';
import EProceedings     from './pages/EProceedings';

// ── Loading spinner shown while token is being validated on mount ──────────────
function AuthLoadingScreen() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#f8fafc', flexDirection: 'column', gap: 16,
    }}>
      <div style={{
        width: 40, height: 40, border: '3px solid #e2e8f0',
        borderTopColor: '#2563eb', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <span style={{ fontSize: 13, color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>
        Verifying session…
      </span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Protected route: requires auth + optional role ────────────────────────────
function ProtectedRoute({ children, requiredRole }) {
  const { user, authLoading } = useAuth();
  if (authLoading) return <AuthLoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) {
    // Wrong role → send to their own dashboard
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/staff/dashboard'} replace />;
  }
  return <Layout>{children}</Layout>;
}

// ── Public route: redirects authenticated users to their dashboard ─────────────
function PublicRoute({ children }) {
  const { user, authLoading } = useAuth();
  if (authLoading) return <AuthLoadingScreen />;
  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/staff/dashboard'} replace />;
  }
  return children;
}

// ── Root redirect ─────────────────────────────────────────────────────────────
function RootRedirect() {
  const { user, authLoading } = useAuth();
  if (authLoading) return <AuthLoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/staff/dashboard'} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Root */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public auth pages */}
      <Route path="/login"          element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/signup"         element={<PublicRoute><SignupPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/reset-password"  element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
      <Route path="/verify-email"    element={<VerifyEmailPage />} />

      {/* Admin-only routes */}
      <Route path="/admin/dashboard"
        element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />

      {/* Staff-only routes */}
      <Route path="/staff/dashboard"
        element={<ProtectedRoute requiredRole="staff"><StaffDashboard /></ProtectedRoute>} />

      {/* Legacy /dashboard → proper redirect */}
      <Route path="/dashboard" element={<RootRedirect />} />

      {/* Shared protected routes */}
      <Route path="/notices"
        element={<ProtectedRoute><EProceedings /></ProtectedRoute>} />
      <Route path="/e-proceedings"
        element={<ProtectedRoute><EProceedings /></ProtectedRoute>} />
      <Route path="/tasks"
        element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
      <Route path="/documents"
        element={<ProtectedRoute><DocumentsPage /></ProtectedRoute>} />
      <Route path="/settings"
        element={<ProtectedRoute requiredRole="admin"><SettingsPage /></ProtectedRoute>} />

      {/* Catch-all */}
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
