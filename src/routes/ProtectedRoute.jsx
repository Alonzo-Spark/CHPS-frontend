import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/common/LoadingSpinner'

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth()

  if (loading) return <LoadingSpinner fullScreen />

  if (!user) return <Navigate to="/login" replace />

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const role = user.role.toLowerCase()
    const roleMap = { admin: '/admin/dashboard', professor: '/professor/dashboard', staff: '/staff/dashboard', professional: '/professional/dashboard' }
    return <Navigate to={roleMap[role] || '/login'} replace />
  }

  return children
}

export default ProtectedRoute
