import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import StaffLayout from './components/StaffLayout'
import AdminLayout from './components/AdminLayout'
import StaffDashboard from './pages/StaffDashboard'
import AdminDashboard from './pages/AdminDashboard'
import Notices from './pages/Notices'
import Tasks from './pages/Tasks'
import Documents from './pages/Documents'
import EProceedings from './pages/EProceedings'

function RequireAuth({ children, role }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role)
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/staff/dashboard'} replace />
  return children
}

function RootRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/staff/dashboard'} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/signup"   element={<RegisterPage />} />

          {/* ── Staff ── */}
          <Route path="/staff" element={<RequireAuth role="staff"><StaffLayout /></RequireAuth>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<StaffDashboard />} />
            <Route path="notices"   element={<Notices />} />
            <Route path="tasks"     element={<EProceedings />} />
            <Route path="documents" element={<Documents />} />
          </Route>

          {/* ── Admin ── */}
          <Route path="/admin" element={<RequireAuth role="admin"><AdminLayout /></RequireAuth>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="notices"   element={<Notices />} />
            <Route path="tasks"     element={<EProceedings />} />
            <Route path="documents" element={<Documents />} />
          </Route>

          {/* Legacy / dashboard redirect */}
          <Route path="/dashboard" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
