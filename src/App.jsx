import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './routes/ProtectedRoute'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import PasswordSetupPage from './pages/auth/PasswordSetupPage'
import AdminActionPage from './pages/auth/AdminActionPage'
import StaffDashboard from './pages/staff/StaffDashboard'
import StaffNotices from './pages/staff/StaffNotices'
import NoticeOrders from './pages/staff/NoticeOrders'
import Proceeding from './pages/staff/Proceeding'
import EProceedings from './pages/staff/EProceedings'
import Clients from './pages/staff/Clients'
import CreateClient from './pages/staff/CreateClient'
import ClientProceedings from './pages/staff/ClientProceedings'
import AdminDashboard from './pages/admin/AdminDashboard'
import { useEffect } from 'react'
import { healthService } from './services'
import ProfessorDashboard from './pages/professor/ProfessorDashboard'
import ProfessionalDashboard from './pages/professional/ProfessionalDashboard'

export default function App() {
  useEffect(() => {
    healthService.checkHealth()
      .then(() => console.log('API is healthy'))
      .catch(err => console.error('API Health check failed', err))
  }, [])

  return (

    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/password-setup" element={<PasswordSetupPage />} />
      <Route path="/complete-registration" element={<PasswordSetupPage />} />
      <Route path="/approve-registration" element={<AdminActionPage action="approve" />} />
      <Route path="/approve-registration/:token" element={<AdminActionPage action="approve" />} />
      <Route path="/reject-registration" element={<AdminActionPage action="reject" />} />
      <Route path="/reject-registration/:token" element={<AdminActionPage action="reject" />} />

      <Route path="/staff/dashboard" element={<ProtectedRoute allowedRoles={['staff']}><StaffDashboard /></ProtectedRoute>} />
      <Route path="/staff/notices" element={<ProtectedRoute allowedRoles={['staff', 'professional', 'admin']}><StaffNotices /></ProtectedRoute>} />
      <Route path="/proceedings" element={<ProtectedRoute allowedRoles={['staff', 'professional', 'admin']}><StaffNotices /></ProtectedRoute>} />
      <Route path="/staff/notice-orders/:id" element={<ProtectedRoute allowedRoles={['staff', 'professional', 'admin']}><NoticeOrders /></ProtectedRoute>} />
      <Route path="/staff/proceeding/:id" element={<ProtectedRoute allowedRoles={['staff']}><Proceeding /></ProtectedRoute>} />
      <Route path="/staff/clients" element={<ProtectedRoute allowedRoles={['staff']}><Clients /></ProtectedRoute>} />
      <Route path="/staff/clients/:notice_id/proceedings" element={<ProtectedRoute allowedRoles={['staff']}><ClientProceedings /></ProtectedRoute>} />
      <Route path="/staff/create-client" element={<ProtectedRoute allowedRoles={['staff']}><CreateClient /></ProtectedRoute>} />

      <Route path="/e-proceedings" element={<ProtectedRoute allowedRoles={['staff']}><EProceedings /></ProtectedRoute>} />

      <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/professor/dashboard" element={<ProtectedRoute allowedRoles={['professor']}><ProfessorDashboard /></ProtectedRoute>} />
      <Route path="/professional-dashboard" element={<ProtectedRoute allowedRoles={['professional']}><ProfessionalDashboard /></ProtectedRoute>} />
    </Routes>
  )
}
