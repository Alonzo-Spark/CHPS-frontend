import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './routes/ProtectedRoute'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import PasswordSetupPage from './pages/auth/PasswordSetupPage'
import StaffDashboard from './pages/staff/StaffDashboard'
import StaffNotices from './pages/staff/StaffNotices'
import NoticeOrders from './pages/staff/NoticeOrders'
import Proceeding from './pages/staff/Proceeding'
import Clients from './pages/staff/Clients'
import CreateClient from './pages/staff/CreateClient'
import AdminDashboard from './pages/admin/AdminDashboard'
import ProfessorDashboard from './pages/professor/ProfessorDashboard'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/password-setup" element={<PasswordSetupPage />} />

      <Route path="/staff/dashboard" element={<ProtectedRoute allowedRoles={['staff']}><StaffDashboard /></ProtectedRoute>} />
      <Route path="/staff/notices" element={<ProtectedRoute allowedRoles={['staff']}><StaffNotices /></ProtectedRoute>} />
      <Route path="/staff/notice-orders/:id" element={<ProtectedRoute allowedRoles={['staff']}><NoticeOrders /></ProtectedRoute>} />
      <Route path="/staff/proceeding/:id" element={<ProtectedRoute allowedRoles={['staff']}><Proceeding /></ProtectedRoute>} />
      <Route path="/staff/clients" element={<ProtectedRoute allowedRoles={['staff']}><Clients /></ProtectedRoute>} />
      <Route path="/staff/create-client" element={<ProtectedRoute allowedRoles={['staff']}><CreateClient /></ProtectedRoute>} />

      <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/professor/dashboard" element={<ProtectedRoute allowedRoles={['professor']}><ProfessorDashboard /></ProtectedRoute>} />
    </Routes>
  )
}
