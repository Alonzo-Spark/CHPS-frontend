import React from 'react'
import { Building2 } from 'lucide-react'

const AdminDashboard = () => (
  <div className="flex flex-col items-center justify-center h-64 text-gray-400">
    <Building2 size={40} className="mb-3 opacity-40" />
    <p className="text-sm">Admin Dashboard — connect to API to load data</p>
  </div>
)

export default AdminDashboard
