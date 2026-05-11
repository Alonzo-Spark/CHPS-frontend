import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import ProtectedRoute from './routes/ProtectedRoute'
import DashboardLayout from './layouts/DashboardLayout'

// Auth pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import PasswordSetupPage from './pages/auth/PasswordSetupPage'

// Staff pages
import StaffDashboard from './pages/staff/StaffDashboard'
import NoticesActionPage from './pages/staff/NoticesActionPage'
import NoticeOrdersPage from './pages/staff/NoticeOrdersPage'
import TasksPage from './pages/staff/TasksPage'

// Admin / Professor
import AdminDashboard from './pages/admin/AdminDashboard'
import ProfessorDashboard from './pages/professor/ProfessorDashboard'

const STAFF_ROLES = ['staff', 'professional']

const App = () => (
  <AuthProvider>
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/password-setup" element={<PasswordSetupPage />} />

          {/* Staff */}
          <Route path="/staff" element={
            <ProtectedRoute allowedRoles={STAFF_ROLES}><DashboardLayout /></ProtectedRoute>
          }>
            <Route path="dashboard"           element={<StaffDashboard />} />
            <Route path="notices"             element={<NoticesActionPage />} />
            <Route path="notice-orders/:id"   element={<NoticeOrdersPage />} />
            <Route path="tasks"               element={<TasksPage />} />
            <Route path="documents"           element={<div style={{padding:'24px',color:'#64748b'}}>Documents — connect to API</div>} />
          </Route>

          {/* Admin */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}><DashboardLayout /></ProtectedRoute>
          }>
            <Route path="dashboard" element={<AdminDashboard />} />
          </Route>

          {/* Professor */}
          <Route path="/professor" element={
            <ProtectedRoute allowedRoles={['professor']}><DashboardLayout /></ProtectedRoute>
          }>
            <Route path="dashboard" element={<ProfessorDashboard />} />
          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  </AuthProvider>
)

export default App
