import { FileText, Download, Eye, Plus } from 'lucide-react';

const DOCS = [
  { name:'Q3 Compliance Report 2023', type:'PDF', size:'2.4 MB', updated:'Oct 22, 2023', color:'#ef4444' },
  { name:'Alpha Solutions – Notice N-2023-0041', type:'PDF', size:'340 KB', updated:'Oct 12, 2023', color:'#ef4444' },
  { name:'Penalty Tracker – October 2023', type:'XLSX', size:'1.1 MB', updated:'Oct 20, 2023', color:'#16a34a' },
  { name:'Staff Assignment Matrix Q3', type:'DOCX', size:'520 KB', updated:'Sep 30, 2023', color:'#1d4ed8' },
  { name:'Beacon Corp Settlement Agreement', type:'PDF', size:'1.8 MB', updated:'Oct 28, 2023', color:'#ef4444' },
  { name:'VAT Discrepancy Analysis – Oct', type:'XLSX', size:'870 KB', updated:'Oct 15, 2023', color:'#16a34a' },
];

export default function DocumentsPage() {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:18,maxWidth:900}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:700,color:'var(--gray-800)'}}>Documents</h1>
          <p style={{fontSize:13,color:'var(--gray-500)',marginTop:3}}>Manage reports, notices, and compliance files</p>
        </div>
        <button className="btn btn-primary"><Plus size={14}/> Upload Document</button>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {DOCS.map(d => (
          <div key={d.name} style={{background:'#fff',border:'1px solid var(--gray-200)',borderRadius:'var(--r-md)',padding:'14px 18px',display:'flex',alignItems:'center',gap:14,boxShadow:'var(--shadow-sm)',transition:'box-shadow .15s'}}>
            <div style={{width:44,height:44,borderRadius:'var(--r-md)',background:d.color+'18',color:d.color,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <FileText size={22}/>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:'13.5px',fontWeight:500,color:'var(--gray-800)',marginBottom:5}}>{d.name}</div>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:4,background:d.color+'18',color:d.color}}>{d.type}</span>
                <span style={{fontSize:11,color:'var(--gray-400)'}}>{d.size}</span>
                <span style={{fontSize:11,color:'var(--gray-400)'}}>{d.updated}</span>
              </div>
            </div>
            <div style={{display:'flex',gap:4}}>
              <button className="icon-btn" title="Preview"><Eye size={14}/></button>
              <button className="icon-btn" title="Download"><Download size={14}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
