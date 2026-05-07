import { useState } from 'react';
import {
  Download, UserPlus, TrendingUp, Users, DollarSign,
  ChevronLeft, ChevronRight, Pencil, Trash2,
  Filter, MoreVertical, Bell, CheckCircle
} from 'lucide-react';
import './AdminDashboard.css';

const STAFF = [
  { init:'RJ', name:'Rahul Jaiswal',  color:'#3b82f6', users:142, penalties:'$240,500.00', status:'on-track',  label:'ON TRACK'    },
  { init:'AM', name:'Ananya Mishra',  color:'#f59e0b', users:88,  penalties:'$112,000.00', status:'pending',   label:'PENDING (4)' },
  { init:'VK', name:'Vikram Khanna',  color:'#ef4444', users:215, penalties:'$890,200.00', status:'critical',  label:'CRITICAL'    },
];

const AUDIT = [
  { dot:'#ef4444', type:'Sec 271(1)(c)', pan:'PAN-****82J', due:'12 Oct 2023', staff:'Rahul Jaiswal',  urgent:true  },
  { dot:'#f59e0b', type:'Late Filing 234A', pan:'PAN-****11K', due:'20 Oct 2023', staff:'Ananya Mishra', urgent:false },
  { dot:'#3b82f6', type:'TDS Default',     pan:'PAN-****90L', due:'25 Oct 2023', staff:'Vikram Khanna', urgent:false },
];

export default function AdminDashboard() {
  const [modal, setModal] = useState(false);

  return (
    <div className="adm fade-in">
      {/* Header */}
      <div className="adm-header">
        <div>
          <h1 className="adm-title"><span>Admin</span> Dashboard</h1>
          <p className="adm-sub">Manage staff assignments and global audit performance.</p>
        </div>
        <div className="adm-actions">
          <button className="btn btn-outline"><Download size={14}/> Export Reports</button>
          <button className="btn btn-primary" onClick={()=>setModal(true)}><UserPlus size={14}/> Add Staff Member</button>
        </div>
      </div>

      {/* KPI row */}
      <div className="kpi-row">
        <div className="kpi-card">
          <div className="kpi-lbl">ACTIVE STAFF</div>
          <div className="kpi-val">24</div>
          <div className="kpi-tag green"><TrendingUp size={11}/> +2 this month</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-lbl">ASSIGNED USERS</div>
          <div className="kpi-val">1,482</div>
          <div className="kpi-tag blue"><Users size={11}/> 98% Coverage</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-lbl">TOTAL PENALTIES</div>
          <div className="kpi-val">$4.2M</div>
          <div className="kpi-tag red"><DollarSign size={11}/> High Risk</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-lbl">RESOLUTION RATE</div>
          <div className="kpi-val">82.4%</div>
          <div className="kpi-bar"><div className="kpi-bar-fill" style={{width:'82.4%'}}/></div>
        </div>
      </div>

      {/* Two-column section */}
      <div className="adm-mid">
        {/* Staff table */}
        <div className="card" style={{flex:'1 1 0', minWidth:0}}>
          <div className="card-header">
            <div>
              <div className="card-title">Staff Management &amp; Workload</div>
            </div>
            <div className="card-actions">
              <button className="icon-btn"><Filter size={14}/></button>
              <button className="icon-btn"><MoreVertical size={14}/></button>
            </div>
          </div>
          <table className="data-table">
            <thead><tr>
              <th>STAFF NAME</th><th>ASSIGNED USERS</th><th>PENALTIES TRACKED</th>
              <th>COMPLETION STATUS</th><th>ACTIONS</th>
            </tr></thead>
            <tbody>
              {STAFF.map(s => (
                <tr key={s.name}>
                  <td><div className="dt-name-cell">
                    <div className="avatar" style={{background:s.color}}>{s.init}</div>{s.name}
                  </div></td>
                  <td>{s.users} Users</td>
                  <td className="mono">{s.penalties}</td>
                  <td><span className={`badge badge-${s.status==='on-track'?'on-track':s.status==='pending'?'pending':'critical'}`}>{s.label}</span></td>
                  <td><div style={{display:'flex',gap:4}}>
                    <button className="icon-btn ib-blue"><Pencil size={13}/></button>
                    <button className="icon-btn ib-red"><Trash2 size={13}/></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="table-footer">
            <span>Showing 3 of 24 staff members</span>
            <div className="pg-btns">
              <button className="pg-btn"><ChevronLeft size={14}/></button>
              <button className="pg-btn"><ChevronRight size={14}/></button>
            </div>
          </div>
        </div>

        {/* Quick Insights */}
        <div className="insights-panel">
          <div className="ip-title">Quick Insights</div>
          <div className="ip-item">
            <div className="ip-icon orange"><Bell size={13}/></div>
            <div>
              <div className="ip-item-title">Penalty Deadline Alert</div>
              <div className="ip-item-body">12 High-value penalties are expiring in the next 48 hours.</div>
            </div>
          </div>
          <div className="ip-item">
            <div className="ip-icon green"><CheckCircle size={13}/></div>
            <div>
              <div className="ip-item-title">Assignment Complete</div>
              <div className="ip-item-body">All new audit notices from Q3 have been assigned to staff.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Audit Overview */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Global Audit Overview</div>
            <div className="card-subtitle">REAL-TIME PENALTY TRACKING ACROSS ALL SEGMENTS</div>
          </div>
        </div>
        <table className="data-table">
          <thead><tr>
            <th>PENALTY TYPE</th><th>USER ID</th><th>DUE DATE</th><th>ASSIGNED STAFF</th>
          </tr></thead>
          <tbody>
            {AUDIT.map(a => (
              <tr key={a.type}>
                <td><div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{width:8,height:8,borderRadius:'50%',background:a.dot,display:'inline-block',flexShrink:0}}/>
                  {a.type}
                </div></td>
                <td className="mono">{a.pan}</td>
                <td className={a.urgent ? 'txt-red' : 'txt-muted'}>{a.due}</td>
                <td>{a.staff}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Staff Modal */}
      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <h3>Add Staff Member</h3>
            <div className="form-group"><label>Full Name</label><input className="form-input" placeholder="e.g. Priya Sharma"/></div>
            <div className="form-group"><label>Email</label><input className="form-input" type="email" placeholder="priya@audit.gov"/></div>
            <div className="form-group"><label>Role</label>
              <select className="form-input"><option>Staff Administrator</option><option>Senior Auditor</option><option>Compliance Officer</option></select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={()=>setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={()=>setModal(false)}>Add Member</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
