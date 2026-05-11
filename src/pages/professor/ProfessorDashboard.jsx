import React from 'react'
import { GraduationCap } from 'lucide-react'

const ProfessorDashboard = () => (
  <div className="flex flex-col items-center justify-center h-64 text-gray-400">
    <GraduationCap size={40} className="mb-3 opacity-40" />
    <p className="text-sm">Professor Dashboard — connect to API to load data</p>
  </div>
)

export default ProfessorDashboard
