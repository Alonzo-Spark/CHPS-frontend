import { useState, useEffect, useCallback } from 'react';
import { FileText, Download, Eye, Plus, Trash2, Loader2, AlertCircle, RefreshCw, Upload } from 'lucide-react';
import { files as filesApi } from '../services/api';

const TYPE_COLORS = { pdf:'#ef4444', xlsx:'#16a34a', docx:'#1d4ed8', doc:'#1d4ed8', csv:'#0891b2' };

function getColor(name = '') {
  const ext = name.split('.').pop().toLowerCase();
  return TYPE_COLORS[ext] || '#6b7280';
}

export default function DocumentsPage() {
  const [fileList, setFileList]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [uploading, setUploading]     = useState(false);
  const [uploadErr, setUploadErr]     = useState('');
  const [toast, setToast]             = useState(null);

  function showToast(msg, isErr = false) {
    setToast({ msg, isErr });
    setTimeout(() => setToast(null), 3000);
  }

  const fetchFiles = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await filesApi.getAll({ page: 1, limit: 20 });
      const list = data.data || data.files || (Array.isArray(data) ? data : []);
      setFileList(list);
    } catch (e) {
      setError('Failed to load files. ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setUploadErr('');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('fileType', file.name.split('.').pop());
    fd.append('description', file.name);
    try {
      const data = await filesApi.upload(fd);
      if (!data.success) { setUploadErr(data.message || 'Upload failed.'); return; }
      showToast('File uploaded successfully.');
      fetchFiles();
    } catch { setUploadErr('Network error uploading file.'); }
    finally { setUploading(false); e.target.value = ''; }
  }

  async function handleDownload(f) {
    try {
      await filesApi.download(f.fileId || f.id, f.fileName || f.file_name || `file_${f.id}`);
    } catch (e) {
      showToast('Download failed: ' + e.message, true);
    }
  }

  async function handleDelete(f) {
    if (!window.confirm(`Delete "${f.fileName || f.file_name}"?`)) return;
    try {
      const data = await filesApi.delete(f.fileId || f.id);
      if (data.success) { showToast('File deleted.'); fetchFiles(); }
      else showToast(data.message || 'Delete failed.', true);
    } catch { showToast('Network error.', true); }
  }

  const fmtSize = (bytes) => {
    if (!bytes) return '—';
    if (typeof bytes === 'string') return bytes;
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const fmtDate = (d) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }); }
    catch { return d; }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18, maxWidth:900 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position:'fixed', top:20, right:20, zIndex:9999,
          background: toast.isErr ? '#fef2f2' : '#f0fdf4',
          border:`1px solid ${toast.isErr?'#fecaca':'#bbf7d0'}`,
          color: toast.isErr ? '#dc2626' : '#166534',
          borderRadius:10, padding:'12px 18px', fontSize:13, fontWeight:500,
          boxShadow:'0 4px 20px rgba(0,0,0,.12)',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:'var(--gray-800)' }}>Documents</h1>
          <p style={{ fontSize:13, color:'var(--gray-500)', marginTop:3 }}>Manage reports, notices, and compliance files</p>
        </div>
        <label style={{
          display:'flex', alignItems:'center', gap:6,
          padding:'8px 16px', background:'var(--blue-primary)', color:'#fff',
          borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer',
          opacity: uploading ? 0.7 : 1,
        }}>
          {uploading
            ? <><Loader2 size={14} style={{animation:'spin .8s linear infinite'}}/> Uploading…</>
            : <><Upload size={14}/> Upload Document</>
          }
          <input type="file" style={{ display:'none' }} onChange={handleUpload} disabled={uploading}
            accept=".pdf,.doc,.docx,.xlsx,.csv" />
        </label>
      </div>

      {/* Upload error */}
      {uploadErr && (
        <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#dc2626', display:'flex', alignItems:'center', gap:6 }}>
          <AlertCircle size={14}/> {uploadErr}
        </div>
      )}

      {/* File list */}
      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, padding:'48px 24px', color:'#94a3b8' }}>
          <Loader2 size={24} style={{ animation:'spin 0.8s linear infinite' }}/>
          <span style={{ fontSize:13 }}>Loading files…</span>
        </div>
      ) : error ? (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, padding:'48px 24px', color:'#dc2626' }}>
          <AlertCircle size={22}/>
          <span style={{ fontSize:13 }}>{error}</span>
          <button onClick={fetchFiles} style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 16px', border:'1.5px solid #fecaca', borderRadius:8, fontSize:12, fontWeight:600, color:'#dc2626', background:'#fef2f2', cursor:'pointer' }}>
            <RefreshCw size={12}/> Retry
          </button>
        </div>
      ) : fileList.length === 0 ? (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, padding:'48px 24px', color:'#94a3b8' }}>
          <FileText size={32} color="#cbd5e1"/>
          <span style={{ fontSize:13 }}>No documents found. Upload your first file above.</span>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {fileList.map((f, i) => {
            const name = f.fileName || f.file_name || f.name || `File ${i + 1}`;
            const ext  = name.split('.').pop().toUpperCase();
            const color = getColor(name);
            return (
              <div key={f.fileId || f.id || i} style={{
                background:'#fff', border:'1px solid var(--gray-200)', borderRadius:'var(--r-md)',
                padding:'14px 18px', display:'flex', alignItems:'center', gap:14,
                boxShadow:'var(--shadow-sm)', transition:'box-shadow .15s',
              }}>
                <div style={{ width:44, height:44, borderRadius:'var(--r-md)', background:color+'18', color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <FileText size={22}/>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'13.5px', fontWeight:500, color:'var(--gray-800)', marginBottom:5 }}>{name}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:4, background:color+'18', color }}>{ext}</span>
                    <span style={{ fontSize:11, color:'var(--gray-400)' }}>{fmtSize(f.fileSize || f.file_size || f.size)}</span>
                    <span style={{ fontSize:11, color:'var(--gray-400)' }}>{fmtDate(f.uploadedAt || f.created_at || f.updated_at)}</span>
                    {f.status && <span style={{ fontSize:10, fontWeight:600, color:'#16a34a' }}>{f.status}</span>}
                  </div>
                </div>
                <div style={{ display:'flex', gap:4 }}>
                  <button className="icon-btn" title="Preview"><Eye size={14}/></button>
                  <button className="icon-btn" title="Download" onClick={() => handleDownload(f)}><Download size={14}/></button>
                  <button className="icon-btn" title="Delete" style={{ color:'#dc2626' }} onClick={() => handleDelete(f)}><Trash2 size={14}/></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
