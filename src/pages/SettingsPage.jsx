import { useState } from 'react';
import { Save } from 'lucide-react';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const save = () => { setSaved(true); setTimeout(()=>setSaved(false),2000); };
  return (
    <div style={{display:'flex',flexDirection:'column',gap:20,maxWidth:600}}>
      <div>
        <h1 style={{fontSize:22,fontWeight:700,color:'var(--gray-800)'}}>Settings</h1>
        <p style={{fontSize:13,color:'var(--gray-500)',marginTop:3}}>Configure portal settings and preferences</p>
      </div>
      <div className="card" style={{padding:28}}>
        <div className="card-title" style={{marginBottom:20}}>System Configuration</div>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div className="form-group"><label>Portal Name</label><input className="form-input" defaultValue="Audit Notification Manager"/></div>
          <div className="form-group"><label>Admin Email</label><input className="form-input" type="email" defaultValue="admin@audit.gov"/></div>
          <div className="form-group"><label>Notification Frequency</label>
            <select className="form-input"><option>Real-time</option><option>Every 6 hours</option><option>Daily digest</option></select>
          </div>
          <div className="form-group"><label>Version</label><input className="form-input" defaultValue="v4.2.1-stable" disabled/></div>
          <button className="btn btn-primary" style={{width:'fit-content'}} onClick={save}>
            <Save size={14}/> {saved ? 'Saved ✓' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
