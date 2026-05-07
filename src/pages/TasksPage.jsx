import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CheckCircle2, Circle, Clock, ArrowRight } from 'lucide-react';
import './Tasks.css';

const INIT_TASKS = [
  { id:1, title:'Review e-Proceedings for Q3 compliance filings', priority:'high', due:'Oct 28, 2023', done:false, tag:'e-Proceedings', isEP:true },
  { id:2, title:'Follow up with Alpha Solutions Ltd. on Late Tax Filing notice', priority:'high', due:'Nov 12, 2023', done:false, tag:'Follow-up', isEP:false },
  { id:3, title:'Generate monthly penalty summary report', priority:'medium', due:'Oct 31, 2023', done:false, tag:'Reporting', isEP:false },
  { id:4, title:'Update Jameson Miller VAT Discrepancy records', priority:'medium', due:'Nov 5, 2023', done:true, tag:'Records', isEP:false },
  { id:5, title:'Verify Beacon Corp settlement documentation', priority:'low', due:'Nov 1, 2023', done:true, tag:'Verification', isEP:false },
  { id:6, title:'Open e-Proceedings dashboard for issue letter review', priority:'high', due:'Oct 25, 2023', done:false, tag:'e-Proceedings', isEP:true },
];

const P_COLORS = { high:'var(--red)', medium:'var(--yellow)', low:'var(--green)' };

export default function TasksPage() {
  const [tasks, setTasks] = useState(INIT_TASKS);
  const [newTask, setNew] = useState('');
  const navigate = useNavigate();

  const toggle  = id => setTasks(p => p.map(t => t.id===id ? {...t,done:!t.done} : t));
  const addTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    setTasks(p => [...p, { id:Date.now(), title:newTask, priority:'medium', due:'TBD', done:false, tag:'General', isEP:false }]);
    setNew('');
  };

  const pending = tasks.filter(t => !t.done);
  const done    = tasks.filter(t => t.done);

  return (
    <div className="tasks-page fade-in">
      <div className="tasks-header">
        <div>
          <h1 className="tasks-title">Tasks</h1>
          <p className="tasks-sub">{pending.length} pending · {done.length} completed</p>
        </div>
      </div>

      {/* Quick launch banner */}
      <div className="ep-launch-banner" onClick={() => navigate('/notices')}>
        <div className="ep-launch-left">
          <div className="ep-launch-dot"/>
          <div>
            <div className="ep-launch-title">e-Proceedings Dashboard</div>
            <div className="ep-launch-desc">5 items require your action · 2 for your information</div>
          </div>
        </div>
        <button className="btn btn-primary">Open e-Proceedings <ArrowRight size={14}/></button>
      </div>

      <form onSubmit={addTask} className="task-add">
        <input className="form-input" placeholder="Add a new task…" value={newTask} onChange={e=>setNew(e.target.value)}/>
        <button type="submit" className="btn btn-primary"><Plus size={14}/> Add</button>
      </form>

      <div className="task-section">
        <div className="task-sec-title">Pending <span className="task-sec-count">{pending.length}</span></div>
        {pending.map(t => (
          <div key={t.id} className="task-item" onClick={() => t.isEP ? navigate('/notices') : toggle(t.id)}>
            <Circle size={18} className="task-check pending-c"/>
            <div className="task-info">
              <div className="task-name">{t.title}</div>
              <div className="task-meta">
                <span className="task-tag" style={t.isEP ? {background:'var(--blue-light)',color:'var(--blue-primary)'} : {}}>{t.tag}</span>
                <span className="task-due"><Clock size={11}/> {t.due}</span>
              </div>
            </div>
            <div className="task-priority" style={{background:P_COLORS[t.priority]+'22',color:P_COLORS[t.priority]}}>{t.priority}</div>
            {t.isEP && <ArrowRight size={14} style={{color:'var(--blue-primary)',flexShrink:0}}/>}
          </div>
        ))}
      </div>

      {done.length > 0 && (
        <div className="task-section">
          <div className="task-sec-title">Completed <span className="task-sec-count">{done.length}</span></div>
          {done.map(t => (
            <div key={t.id} className="task-item done" onClick={() => toggle(t.id)}>
              <CheckCircle2 size={18} className="task-check done-c"/>
              <div className="task-info">
                <div className="task-name">{t.title}</div>
                <div className="task-meta"><span className="task-tag">{t.tag}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
