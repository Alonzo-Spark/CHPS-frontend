import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Users, TrendingUp, DollarSign, BarChart2, Download, UserPlus, AlertCircle, Edit2, Trash2 } from 'lucide-react'
import api from '../services/api'
import './AdminDashboard.css'

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className={`adm-stat adm-stat--${color}`}>
      <div className="adm-stat-body">
        <span className="adm-stat-lbl">{label}</span>
        <span className="adm-stat-val">{value}</span>
        {sub && <span className="adm-stat-sub">{sub}</span>}
      </div>
      <div className="adm-stat-icon"><Icon size={20} /></div>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    'ON TRACK': 'badge--green',
    'PENDING':  'badge--orange',
    'CRITICAL': 'badge--red',
  }
  const s = status?.toUpperCase()
  return <span className={`adm-badge ${map[s] || 'badge--grey'}`}>{status}</span>
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [staffList, setStaffList] = useState([])
  const [globalAudit, setGlobalAudit] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.getStaffList(), api.getGlobalAudit()])
      .then(([s, g]) => { setStaffList(s); setGlobalAudit(g) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="adm-page">
      {/* Header */}
      <div className="adm-header">
        <div>
          <h1 className="adm-title">Admin Dashboard</h1>
          <p className="adm-sub">Manage staff assignments and global audit performance.</p>
        </div>
        <div className="adm-header-actions">
          <button className="adm-btn adm-btn--outline"><Download size={15} /> Export Reports</button>
          <button className="adm-btn adm-btn--primary"><UserPlus size={15} /> Add Staff Member</button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="adm-stats">
        <StatCard icon={Users}      label="ACTIVE STAFF"    value="—" sub="Data from API" color="blue"   />
        <StatCard icon={BarChart2}  label="ASSIGNED USERS"  value="—" sub="Data from API" color="indigo" />
        <StatCard icon={DollarSign} label="TOTAL PENALTIES" value="—" sub="Data from API" color="red"    />
        <StatCard icon={TrendingUp} label="RESOLUTION RATE" value="—" sub="Data from API" color="green"  />
      </div>

      {/* Staff management table */}
      <div className="adm-card">
        <div className="adm-card-header">
          <h2 className="adm-card-title">Staff Management &amp; Workload</h2>
        </div>

        {loading ? (
          <div className="adm-empty"><p>Loading…</p></div>
        ) : staffList.length === 0 ? (
          <div className="adm-empty">
            <AlertCircle size={32} />
            <p>No staff data available.</p>
            <span>Connect your backend to populate this table.</span>
          </div>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>STAFF NAME</th>
                <th>ASSIGNED USERS</th>
                <th>PENALTIES TRACKED</th>
                <th>COMPLETION STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map(s => (
                <tr key={s.id}>
                  <td>
                    <div className="adm-name-cell">
                      <div className="adm-avatar">{s.initials}</div>
                      <span>{s.name}</span>
                    </div>
                  </td>
                  <td>{s.assignedUsers}</td>
                  <td>{s.penaltiesTracked}</td>
                  <td><StatusBadge status={s.completionStatus} /></td>
                  <td>
                    <div className="adm-actions">
                      <button className="adm-icon-btn adm-icon-btn--edit"><Edit2 size={14} /></button>
                      <button className="adm-icon-btn adm-icon-btn--del"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Global Audit Overview */}
      <div className="adm-bottom">
        <div className="adm-card adm-card--flex1">
          <div className="adm-card-header">
            <div>
              <h2 className="adm-card-title">Global Audit Overview</h2>
              <p className="adm-card-sub">REAL-TIME PENALTY TRACKING ACROSS ALL SEGMENTS</p>
            </div>
          </div>
          {loading ? (
            <div className="adm-empty"><p>Loading…</p></div>
          ) : globalAudit.length === 0 ? (
            <div className="adm-empty">
              <AlertCircle size={28} />
              <p>No audit data available.</p>
            </div>
          ) : (
            <table className="adm-table">
              <thead>
                <tr>
                  <th>PENALTY TYPE</th><th>USER ID</th>
                  <th>DUE DATE</th><th>ASSIGNED STAFF</th>
                </tr>
              </thead>
              <tbody>
                {globalAudit.map((g, i) => (
                  <tr key={i}>
                    <td>{g.penaltyType}</td>
                    <td>{g.userId}</td>
                    <td className={g.overdue ? 'adm-overdue' : ''}>{g.dueDate}</td>
                    <td>{g.assignedStaff}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Quick insights */}
        <div className="adm-insights">
          <h3 className="adm-insights-title">Quick Insights</h3>
          <div className="adm-empty adm-empty--sm">
            <AlertCircle size={24} />
            <p>No insights yet.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
