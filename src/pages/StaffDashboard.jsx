import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, ChevronLeft, ChevronRight, MoreVertical, TrendingUp, Rocket } from 'lucide-react';
import './StaffDashboard.css';

const ASSIGNMENTS = [
  { init:'AS', name:'Alpha Solutions Ltd.', color:'#6366f1', penalty:'Late Tax Filing',   amount:'$4,250.00',  issue:'Oct 12, 2023', due:'Nov 12, 2023', status:'urgent'   },
  { init:'JM', name:'Jameson Miller',       color:'#f59e0b', penalty:'VAT Discrepancy',   amount:'$1,120.00',  issue:'Oct 15, 2023', due:'Nov 15, 2023', status:'pending'  },
  { init:'BC', name:'Beacon Corp Inc.',     color:'#22c55e', penalty:'Audit Discrepancy', amount:'$12,800.00', issue:'Sep 28, 2023', due:'Oct 28, 2023', status:'settled'  },
  { init:'RE', name:'Redwood Estates',      color:'#3b82f6', penalty:'Interest Penalty',  amount:'$845.50',    issue:'Oct 20, 2023', due:'Nov 20, 2023', status:'reviewed' },
];

export default function StaffDashboard() {
  const [modal, setModal] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="staff fade-in">
      {/* KPI row */}
      <div className="staff-kpi-row">
        <div className="staff-kpi">
          <div className="sk-lbl">TOTAL ASSIGNED</div>
          <div className="sk-val">124 <span className="sk-green"><TrendingUp size={12}/> +12%</span></div>
          <div className="sk-bar blue-bar"/>
        </div>
        <div className="staff-kpi">
          <div className="sk-lbl">PENDING TASKS</div>
          <div className="sk-val red-val">18 <span className="sk-red">Due today</span></div>
          <div className="sk-bar red-bar"/>
        </div>
        <div className="staff-kpi">
          <div className="sk-lbl">RECENTLY UPDATED</div>
          <div className="sk-val">42 <span className="sk-blue">Last 24h</span></div>
          <div className="sk-bar blue-bar"/>
        </div>
      </div>

      {/* My Assignments */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">My Assignments</div>
            <div className="card-subtitle">Managing notification workflow and compliance deadlines</div>
          </div>
          <div className="card-actions">
            <div className="tb-search-mini">
              <input placeholder="Search assignments…" />
            </div>
            <button className="btn btn-outline"><Filter size={13}/> Filter</button>
            <button className="btn btn-primary" onClick={()=>setModal(true)}><Plus size={13}/> New Notice</button>
          </div>
        </div>

        <table className="data-table">
          <thead><tr>
            <th>USER/CLIENT NAME</th><th>PENALTY TYPE</th><th>AMOUNT DUE</th>
            <th>ISSUE DATE</th><th>DUE DATE</th><th>STATUS</th><th></th>
          </tr></thead>
          <tbody>
            {ASSIGNMENTS.map(a => (
              <tr key={a.name}>
                <td><div className="dt-name-cell">
                  <div className="avatar" style={{background:a.color}}>{a.init}</div>{a.name}
                </div></td>
                <td>{a.penalty}</td>
                <td className="mono" style={{fontWeight:500}}>{a.amount}</td>
                <td className="txt-muted">{a.issue}</td>
                <td className="txt-muted">{a.due}</td>
                <td><span className={`badge badge-${a.status}`}>{a.status.toUpperCase()}</span></td>
                <td><button className="icon-btn"><MoreVertical size={14}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="table-footer">
          <span>Showing 4 of 124 assignments</span>
          <div className="pg-btns">
            <button className="pg-btn"><ChevronLeft size={14}/></button>
            <button className="pg-btn"><ChevronRight size={14}/></button>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="staff-bottom">
        {/* Audit Readiness */}
        <div className="card" style={{padding:'22px 24px'}}>
          <div className="card-title" style={{marginBottom:8}}>Audit Readiness Report</div>
          <p className="ar-text">
            Our automated scanning system has detected 3 new potential discrepancies in the Q3 compliance filings.
            Review these early to avoid escalating penalties.
          </p>
          <button className="btn btn-navy" style={{marginTop:14}}>Launch Audit Assistant</button>
        </div>

        {/* Notice Velocity */}
        <div className="nv-panel">
          <div className="nv-hdr">
            <span>Notice Velocity</span>
            <TrendingUp size={15} style={{color:'#4ade80'}}/>
          </div>
          <p className="nv-desc">Current processing speed is 14% higher than last quarter. System performance remains optimal.</p>
          <div className="nv-metric">
            <div className="nv-metric-row"><span>PROCESSING</span><span>88%</span></div>
            <div className="nv-bar"><div className="nv-bar-fill" style={{width:'88%'}}/></div>
          </div>
          <div className="nv-sync"><Rocket size={11}/> NEXT SYNC</div>
        </div>
      </div>

      {/* New Notice Modal */}
      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <h3>Create New Notice</h3>
            <div className="form-group"><label>Client Name</label><input className="form-input" placeholder="e.g. Omega Tech Ltd."/></div>
            <div className="form-group"><label>Penalty Type</label>
              <select className="form-input">
                <option>Late Tax Filing</option><option>VAT Discrepancy</option>
                <option>TDS Default</option><option>Interest Penalty</option>
              </select>
            </div>
            <div className="form-group"><label>Amount Due</label><input className="form-input" placeholder="e.g. $2,500.00"/></div>
            <div className="form-group"><label>Due Date</label><input className="form-input" type="date"/></div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={()=>setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={()=>setModal(false)}>Create Notice</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
