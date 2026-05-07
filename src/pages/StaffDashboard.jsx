import { useState, useEffect, useCallback } from 'react';
import {
  Filter, ChevronLeft, ChevronRight, MoreVertical,
  TrendingUp, Rocket, RefreshCw, AlertCircle, Loader2,
  Download, Upload, CheckCircle, XCircle,
} from 'lucide-react';
import { notices as noticesApi, dashboard, files as filesApi, automation } from '../services/api';

const AVATAR_COLORS = ['#6366f1','#f59e0b','#22c55e','#3b82f6','#ec4899','#14b8a6','#f97316','#8b5cf6'];
function colorFor(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function initials(n = '') { return n.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase(); }

const STATUS_MAP = {
  open:{ bg:'#eff6ff', color:'#2563eb' }, new:{ bg:'#f0fdf4', color:'#16a34a' },
  assigned:{ bg:'#fefce8', color:'#ca8a04' }, viewed:{ bg:'#eff6ff', color:'#2563eb' },
  document_uploaded:{ bg:'#f3e8ff', color:'#7c3aed' }, submitted:{ bg:'#fff7ed', color:'#ea580c' },
  completed:{ bg:'#f0fdf4', color:'#16a34a' }, pending:{ bg:'#fffbeb', color:'#d97706' },
  urgent:{ bg:'#fef2f2', color:'#dc2626' },
};
function StatusBadge({ status }) {
  const k = (status||'pending').toLowerCase().replace(/ /g,'_');
  const s = STATUS_MAP[k] || { bg:'#f3f4f6', color:'#6b7280' };
  return <span style={{...s,padding:'3px 10px',borderRadius:99,fontSize:10,fontWeight:700,letterSpacing:'.06em',display:'inline-block'}}>{(status||'UNKNOWN').toUpperCase()}</span>;
}

function UploadModal({ notice, onClose, onUploaded }) {
  const [file,setFile] = useState(null);
  const [desc,setDesc] = useState('Response document');
  const [loading,setLoading] = useState(false);
  const [err,setErr] = useState('');
  async function go() {
    if(!file){setErr('Please select a file.');return;}
    setLoading(true);setErr('');
    const fd = new FormData();
    fd.append('notice_id', notice.id);
    fd.append('file', file);
    fd.append('fileType', file.name.split('.').pop());
    fd.append('description', desc);
    try {
      const data = await filesApi.upload(fd);
      if(!data.success){setErr(data.message||'Upload failed.');return;}
      onUploaded?.(); onClose();
    } catch { setErr('Network error.'); } finally { setLoading(false); }
  }
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}} onClick={onClose}>
      <div style={{background:'#fff',borderRadius:12,padding:28,width:400,maxWidth:'90vw',boxShadow:'0 20px 60px rgba(0,0,0,.25)'}} onClick={e=>e.stopPropagation()}>
        <h3 style={{fontSize:17,fontWeight:700,marginBottom:4}}>Upload Response Document</h3>
        <p style={{fontSize:12,color:'#64748b',marginBottom:16}}>For: <strong>{notice.assessee_name||notice.name_of_assessee}</strong></p>
        {err && <p style={{color:'#dc2626',fontSize:12,marginBottom:10}}>{err}</p>}
        <div style={{marginBottom:12}}>
          <label style={{fontSize:11,fontWeight:600,color:'#64748b',display:'block',marginBottom:5}}>SELECT FILE</label>
          <input type="file" accept=".pdf,.doc,.docx,.xlsx" onChange={e=>setFile(e.target.files[0])} style={{width:'100%',fontSize:13}}/>
        </div>
        <div style={{marginBottom:12}}>
          <label style={{fontSize:11,fontWeight:600,color:'#64748b',display:'block',marginBottom:5}}>DESCRIPTION</label>
          <input style={{width:'100%',padding:'8px 12px',border:'1.5px solid #e2e8f0',borderRadius:8,fontSize:13,boxSizing:'border-box'}} value={desc} onChange={e=>setDesc(e.target.value)}/>
        </div>
        <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:16}}>
          <button onClick={onClose} disabled={loading} style={{padding:'8px 16px',border:'1.5px solid #e2e8f0',borderRadius:8,fontSize:13,fontWeight:600,color:'#64748b',background:'#fff',cursor:'pointer'}}>Cancel</button>
          <button onClick={go} disabled={loading} style={{padding:'8px 16px',border:'none',borderRadius:8,fontSize:13,fontWeight:600,color:'#fff',background:'#2563eb',cursor:'pointer',display:'flex',alignItems:'center',gap:5}}>
            {loading?<><Loader2 size={13} style={{animation:'spin .8s linear infinite'}}/> Uploading…</>:<><Upload size={13}/> Upload</>}
          </button>
        </div>
      </div>
    </div>
  );
}

const S = {
  staff:{display:'flex',flexDirection:'column',gap:20,maxWidth:1200},
  kpiRow:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16},
  kpiCard:{background:'#fff',border:'1px solid var(--gray-200)',borderRadius:'var(--r-md)',padding:'18px 20px 14px',boxShadow:'var(--shadow-sm)'},
  card:{background:'#fff',border:'1px solid var(--gray-200)',borderRadius:'var(--r-md)',boxShadow:'var(--shadow-sm)',overflow:'hidden'},
  th:{padding:'10px 16px',textAlign:'left',fontSize:10,fontWeight:700,letterSpacing:'.08em',color:'var(--gray-400)',borderBottom:'1px solid var(--gray-100)',background:'var(--gray-50)'},
  td:{padding:'13px 16px',borderBottom:'1px solid var(--gray-100)',color:'var(--gray-700)'},
  stateBox:{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'48px 24px',color:'var(--gray-400)',gap:10},
  tableFooter:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 20px',fontSize:12,color:'var(--gray-400)',borderTop:'1px solid var(--gray-100)'},
  pgBtn:{width:28,height:28,border:'1px solid var(--gray-200)',borderRadius:6,background:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--gray-500)'},
  bottom:{display:'grid',gridTemplateColumns:'1fr 240px',gap:16},
  nvPanel:{background:'var(--navy)',borderRadius:'var(--r-md)',padding:20},
};

export default function StaffDashboard() {
  const [showUpload,setShowUpload] = useState(null);
  const [search,setSearch]         = useState('');
  const [page,setPage]             = useState(1);
  const [toast,setToast]           = useState(null);
  const [kpi,setKpi]               = useState(null);
  const [notices,setNotices]       = useState([]);
  const [total,setTotal]           = useState(0);
  const [noticeLoading,setNL]      = useState(true);
  const [noticeError,setNE]        = useState('');
  const [autoStatus,setAutoStatus] = useState(null);
  const [autoLoading,setAL]        = useState(true);
  const PAGE_SIZE = 10;
  const totalPages = Math.ceil(total/PAGE_SIZE)||1;

  function showToast(msg,isErr=false){ setToast({msg,isErr}); setTimeout(()=>setToast(null),3500); }

  const fetchKpi = useCallback(async()=>{
    try{ const d=await dashboard.getSummary(); if(d.success) setKpi(d.dashboard); }catch{}
  },[]);

  const fetchNotices = useCallback(async(p=1,q='')=>{
    setNL(true);setNE('');
    try{
      let data = await noticesApi.getStaffNotices();
      if(Array.isArray(data)){ setNotices(data); setTotal(data.length); }
      else {
        const fb = await noticesApi.getAll({page:p,limit:PAGE_SIZE,...(q?{search:q}:{})});
        const list = fb.data||fb.notices||[];
        setNotices(list); setTotal(fb.totalRecords||fb.total||list.length);
      }
    }catch(e){ setNE('Failed to load notices. '+(e.message||'')); }
    finally{ setNL(false); }
  },[]);

  const fetchAuto = useCallback(async()=>{
    setAL(true);
    try{ const d=await automation.getStatus(); if(d.automation) setAutoStatus(d.automation); }catch{}
    finally{ setAL(false); }
  },[]);

  useEffect(()=>{ fetchKpi(); fetchNotices(1,''); fetchAuto(); },[fetchKpi,fetchNotices,fetchAuto]);

  async function handleDownload(n){
    try{
      await noticesApi.downloadPdf(n.id, n.pdf_file_name||`notice_${n.id}.pdf`);
      await noticesApi.updateStatus(n.id,'VIEWED');
      fetchNotices(page,search);
    }catch(e){ showToast('Download failed: '+e.message,true); }
  }

  function handleSearch(v){ setSearch(v);setPage(1);fetchNotices(1,v); }
  function handlePage(np){ setPage(np);fetchNotices(np,search); }

  const kpiCards = [
    {label:'TOTAL NOTICES',value:kpi?.totalRecords??'—',sub:'All records',color:'#2563eb'},
    {label:'NEW NOTICES',value:kpi?.newNotices??'—',sub:'This period',color:'#dc2626'},
    {label:'ACTIVE USERS',value:kpi?.activeUsers??'—',sub:'In system',color:'#2563eb'},
  ];

  return (
    <div style={S.staff}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {toast&&<div style={{position:'fixed',top:20,right:20,zIndex:9999,background:toast.isErr?'#fef2f2':'#f0fdf4',border:`1px solid ${toast.isErr?'#fecaca':'#bbf7d0'}`,color:toast.isErr?'#dc2626':'#166534',borderRadius:10,padding:'12px 18px',fontSize:13,fontWeight:500,boxShadow:'0 4px 20px rgba(0,0,0,.12)',display:'flex',alignItems:'center',gap:8}}>
        {toast.isErr?<XCircle size={14}/>:<CheckCircle size={14}/>}{toast.msg}
      </div>}

      {/* KPI Row */}
      <div style={S.kpiRow}>
        {kpiCards.map((k,i)=>(
          <div key={i} style={S.kpiCard}>
            <div style={{fontSize:10,fontWeight:600,letterSpacing:'.1em',color:'var(--gray-400)',marginBottom:6}}>{k.label}</div>
            <div style={{fontSize:27,fontWeight:700,color:'var(--gray-800)',marginBottom:8}}>{k.value}</div>
            <div style={{fontSize:11,color:k.color,fontWeight:500}}>{k.sub}</div>
            <div style={{height:3,borderRadius:99,background:k.color,width:'55%',marginTop:8,opacity:.3}}/>
          </div>
        ))}
      </div>

      {/* Notices Table */}
      <div style={S.card}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',padding:'20px 24px 16px',gap:12,flexWrap:'wrap'}}>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:'var(--gray-800)',marginBottom:3}}>My Assignments</div>
            <div style={{fontSize:12,color:'var(--gray-400)'}}>Notices assigned to you</div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <input style={{padding:'7px 12px',border:'1.5px solid var(--gray-200)',borderRadius:99,fontSize:12,outline:'none',width:160}} placeholder="Search notices…" value={search} onChange={e=>handleSearch(e.target.value)}/>
            <button style={{display:'flex',alignItems:'center',gap:5,padding:'7px 14px',border:'1.5px solid var(--gray-200)',borderRadius:8,fontSize:12,fontWeight:600,color:'var(--gray-600)',background:'#fff',cursor:'pointer'}}><Filter size={13}/> Filter</button>
            <button style={{display:'flex',alignItems:'center',gap:5,padding:'7px 14px',border:'1.5px solid var(--gray-200)',borderRadius:8,fontSize:12,fontWeight:600,color:'var(--gray-600)',background:'#fff',cursor:'pointer'}} onClick={()=>fetchNotices(page,search)}><RefreshCw size={13}/></button>
          </div>
        </div>

        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead><tr>{['ASSESSEE NAME','PAN','NOTICE TYPE','ISSUE DATE','DUE DATE','STATUS','ACTIONS'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {noticeLoading?(
              <tr><td colSpan={7} style={S.td}><div style={S.stateBox}><Loader2 size={20} style={{animation:'spin 1s linear infinite'}}/><span style={{fontSize:13,color:'var(--gray-400)'}}>Loading notices…</span></div></td></tr>
            ):noticeError?(
              <tr><td colSpan={7} style={S.td}><div style={S.stateBox}><AlertCircle size={20} color="var(--red)"/><span style={{fontSize:13,color:'var(--gray-400)'}}>{noticeError}</span><button style={{display:'flex',alignItems:'center',gap:5,padding:'6px 14px',border:'1.5px solid var(--gray-200)',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer'}} onClick={()=>fetchNotices(page,search)}><RefreshCw size={12}/> Retry</button></div></td></tr>
            ):notices.length===0?(
              <tr><td colSpan={7} style={S.td}><div style={S.stateBox}><span style={{fontSize:13,color:'var(--gray-400)'}}>No notices found.</span></div></td></tr>
            ):notices.map(n=>{
              const name=n.assessee_name||n.name_of_assessee||'—';
              return (
                <tr key={n.id}>
                  <td style={S.td}><div style={{display:'flex',alignItems:'center',gap:10,fontWeight:500}}><div style={{width:32,height:32,borderRadius:8,background:colorFor(name),display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#fff'}}>{initials(name)}</div>{name}</div></td>
                  <td style={{...S.td,fontFamily:'monospace',fontWeight:500}}>{n.pan_number||n.user_pan||'—'}</td>
                  <td style={S.td}>{n.notice_type||n.notice_us||'—'}</td>
                  <td style={{...S.td,fontSize:12,color:'var(--gray-400)'}}>{n.issue_date||n.issued_on||'—'}</td>
                  <td style={{...S.td,fontSize:12,color:'var(--gray-400)'}}>{n.response_due_date||'—'}</td>
                  <td style={S.td}><StatusBadge status={n.notice_status||n.status}/></td>
                  <td style={S.td}><div style={{display:'flex',gap:4}}>
                    <button title="Download PDF" onClick={()=>handleDownload(n)} style={{background:'none',border:'none',cursor:'pointer',color:'#2563eb',padding:4,borderRadius:4}}><Download size={14}/></button>
                    <button title="Upload Response" onClick={()=>setShowUpload(n)} style={{background:'none',border:'none',cursor:'pointer',color:'#7c3aed',padding:4,borderRadius:4}}><Upload size={14}/></button>
                    <button style={{background:'none',border:'none',cursor:'pointer',color:'var(--gray-400)',padding:4,borderRadius:4}}><MoreVertical size={14}/></button>
                  </div></td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={S.tableFooter}>
          <span>Showing {notices.length} of {total} notices</span>
          <div style={{display:'flex',gap:4}}>
            <button style={S.pgBtn} onClick={()=>handlePage(page-1)} disabled={page<=1}><ChevronLeft size={14}/></button>
            <span style={{padding:'0 8px',lineHeight:'28px',fontSize:12}}>{page}/{totalPages}</span>
            <button style={S.pgBtn} onClick={()=>handlePage(page+1)} disabled={page>=totalPages}><ChevronRight size={14}/></button>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div style={S.bottom}>
        <div style={{...S.card,padding:'22px 24px'}}>
          <div style={{fontSize:15,fontWeight:700,color:'var(--gray-800)',marginBottom:8}}>Automation Status</div>
          <p style={{fontSize:13,color:'var(--gray-600)',lineHeight:1.6}}>
            {autoLoading?'Loading…':autoStatus?`Status: ${autoStatus.status}. Last run: ${autoStatus.lastRun||'N/A'}. Processed: ${autoStatus.totalProcessed??0}. Failed: ${autoStatus.failedJobs??0}.`:'No automation data available.'}
          </p>
          <button onClick={fetchAuto} style={{padding:'9px 18px',border:'none',borderRadius:8,fontSize:12,fontWeight:600,color:'#fff',background:'var(--navy)',cursor:'pointer',marginTop:14,display:'flex',alignItems:'center',gap:5}}><RefreshCw size={12}/> Refresh</button>
        </div>
        <div style={S.nvPanel}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}><span style={{fontSize:13,fontWeight:600,color:'#fff'}}>Notice Velocity</span><TrendingUp size={15} style={{color:'#4ade80'}}/></div>
          <p style={{fontSize:11,color:'rgba(255,255,255,.5)',lineHeight:1.5,marginBottom:16}}>{autoLoading?'Loading…':autoStatus?`${autoStatus.newNotices??0} new notices. ${autoStatus.failedJobs??0} failed.`:'Connect backend.'}</p>
          <div style={{marginBottom:8}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:10,fontWeight:600,color:'rgba(255,255,255,.55)',marginBottom:5}}><span>PROCESSED</span><span>{autoStatus?.totalProcessed??0}</span></div>
            <div style={{height:5,background:'rgba(255,255,255,.15)',borderRadius:99,overflow:'hidden'}}><div style={{height:'100%',background:'#3b82f6',borderRadius:99,width:`${autoStatus?Math.min(100,Math.round((autoStatus.totalProcessed/Math.max(autoStatus.totalProcessed+(autoStatus.failedJobs||0),1))*100)):0}%`}}/></div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:5,fontSize:10,color:'rgba(255,255,255,.35)',marginTop:12}}><Rocket size={11}/> STATUS: {autoLoading?'…':(autoStatus?.status||'unknown').toUpperCase()}</div>
        </div>
      </div>

      {showUpload&&<UploadModal notice={showUpload} onClose={()=>setShowUpload(null)} onUploaded={()=>{showToast('Document uploaded successfully.');fetchNotices(page,search);}}/>}
    </div>
  );
}