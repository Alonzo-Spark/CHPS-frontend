import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';

// Pages
import LoginPage      from './pages/LoginPage';
import SignupPage     from './pages/SignupPage';
import AdminDashboard from './pages/AdminDashboard';
import StaffDashboard from './pages/StaffDashboard';
import NoticesPage    from './pages/NoticesPage';   // → EProceedings
import TasksPage      from './pages/TasksPage';
import DocumentsPage  from './pages/DocumentsPage';
import SettingsPage   from './pages/SettingsPage';
import EProceedings   from './pages/EProceedings';

// Guard: redirect to login if not authenticated
function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

// Dashboard route: admin → AdminDashboard, staff → StaffDashboard
function DashboardRoute() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return (
    <Layout>
      {user.type === 'admin' ? <AdminDashboard /> : <StaffDashboard />}
    </Layout>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Root → login or dashboard */}
      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />

      {/* PAGE 1: Login */}
      <Route path="/login"  element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />

      {/* PAGE 2: Register */}
      <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <SignupPage />} />

      {/* PAGE 3 (staff) / PAGE 4 (admin): Dashboard – auto-selects by user.type */}
      <Route path="/dashboard" element={<DashboardRoute />} />

      {/* PAGE 5: e-Proceedings – accessible via Notices OR Tasks in sidebar */}
      <Route path="/notices"   element={<RequireAuth><EProceedings /></RequireAuth>} />
      <Route path="/tasks"     element={<RequireAuth><TasksPage /></RequireAuth>} />
      <Route path="/e-proceedings" element={<RequireAuth><EProceedings /></RequireAuth>} />

      {/* Other pages */}
      <Route path="/documents" element={<RequireAuth><DocumentsPage /></RequireAuth>} />
      <Route path="/settings"  element={<RequireAuth><SettingsPage /></RequireAuth>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
