import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CheckSquare, ArrowRight } from 'lucide-react'
import './StubPage.css'

export default function Tasks() {
  const navigate = useNavigate()
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')
  const ePath = isAdmin ? '/admin/tasks/eproceedings' : '/staff/tasks'

  return (
    <div className="stub-page">
      <div className="stub-icon"><CheckSquare size={36} /></div>
      <h2>Tasks</h2>
      <p>Select a task type to proceed.</p>
      <button className="stub-btn" onClick={() => navigate(ePath)}>
        <CheckSquare size={16} /> e-Proceedings <ArrowRight size={16} />
      </button>
    </div>
  )
}
