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
import RegistrationSuccessPage from './pages/auth/RegistrationSuccessPage'

// Staff pages
import StaffDashboard from './pages/staff/StaffDashboard'
import NoticesActionPage from './pages/staff/NoticesActionPage'
import NoticeOrdersPage from './pages/staff/NoticeOrdersPage'
import AssignmentDetailsPage from './pages/staff/AssignmentDetailsPage'
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
          <Route path="/set-password" element={<PasswordSetupPage />} />
          <Route path="/verify-email" element={<PasswordSetupPage />} />
          <Route path="/registration-success" element={<RegistrationSuccessPage />} />

          {/* Dashboards */}
          <Route path="/staff" element={<DashboardLayout />}>
            <Route path="dashboard" element={<StaffDashboard />} />
            <Route path="notices" element={<NoticesActionPage />} />
            <Route path="notice-orders/:id" element={<NoticeOrdersPage />} />
            <Route path="assignments/:id" element={<AssignmentDetailsPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="documents" element={<div style={{ padding: '24px', color: '#64748b' }}>Documents — connect to API</div>} />
          </Route>

          <Route path="/professional" element={<ProtectedRoute allowedRoles={STAFF_ROLES}><DashboardLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<StaffDashboard />} />
          </Route>

          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<AdminDashboard />} />
          </Route>

          <Route path="/professor" element={<ProtectedRoute allowedRoles={['professor']}><DashboardLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<ProfessorDashboard />} />
          </Route>

          <Route path="/staff-dashboard" element={<ProtectedRoute allowedRoles={STAFF_ROLES}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<StaffDashboard />} />
          </Route>

          <Route path="/professional-dashboard" element={<ProtectedRoute allowedRoles={STAFF_ROLES}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<StaffDashboard />} />
          </Route>

          <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
          </Route>

          <Route path="/professor-dashboard" element={<ProtectedRoute allowedRoles={['professor']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<ProfessorDashboard />} />
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
