import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Bell, CheckSquare, FileText, AlertCircle, Calendar } from 'lucide-react'
import api from '../services/api'
import './StaffDashboard.css'

function StatCard({ icon: Icon, label, value, color, onClick }) {
  return (
    <div className={`stat-card stat--${color}`} onClick={onClick}>
      <div className="stat-icon"><Icon size={22} /></div>
      <div className="stat-body">
        <span className="stat-val">{value}</span>
        <span className="stat-lbl">{label}</span>
      </div>
    </div>
  )
}

export default function StaffDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats] = useState({ notices: 0, pending: 0, tasks: 0, documents: 0 })

  const today = new Date().toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <div className="sd-page">
      {/* Header */}
      <div className="sd-header">
        <div>
          <h1 className="sd-title">Dashboard</h1>
          <p className="sd-sub">Welcome back, {user?.name}</p>
        </div>
        <div className="sd-date"><Calendar size={14} /><span>{today}</span></div>
      </div>

      {/* Stat cards */}
      <div className="sd-stats">
        <StatCard icon={Bell}        label="Total Notices"   value={stats.notices}   color="blue"   onClick={() => navigate('/staff/notices')} />
        <StatCard icon={AlertCircle} label="Pending Actions" value={stats.pending}   color="orange" onClick={() => navigate('/staff/tasks')}   />
        <StatCard icon={CheckSquare} label="Tasks Today"     value={stats.tasks}     color="green"  onClick={() => navigate('/staff/tasks')}   />
        <StatCard icon={FileText}    label="Documents"       value={stats.documents} color="purple" onClick={() => navigate('/staff/documents')} />
      </div>

      {/* Recent activity */}
      <div className="sd-card">
        <div className="sd-card-header">
          <h2 className="sd-card-title">Recent Activity</h2>
        </div>
        <div className="sd-empty">
          <AlertCircle size={30} />
          <p>No recent activity to display.</p>
          <span>Activity will appear here once data is connected.</span>
        </div>
      </div>
    </div>
  )
}
