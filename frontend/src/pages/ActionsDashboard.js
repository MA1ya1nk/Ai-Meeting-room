import React, { useState, useEffect, useCallback } from 'react';
import { actionsAPI } from '../services/api';

function Toast({ msg, type, onClose }) {
  React.useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="toast" style={{ borderColor: type === 'error' ? 'rgba(248,113,113,0.4)' : 'rgba(52,211,153,0.4)' }}>
      <span style={{ color: type === 'error' ? 'var(--red)' : 'var(--green)', fontWeight: 700 }}>{type === 'error' ? '✕' : '✓'}</span>
      <span style={{ fontSize: 13, flex: 1 }}>{msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 18 }}>×</button>
    </div>
  );
}

function PBadge({ p }) {
  const m = { High: 'b-high', Medium: 'b-medium', Low: 'b-low' };
  return <span className={`badge ${m[p] || 'b-pending'}`}>{p}</span>;
}
function SBadge({ s }) {
  const m = { Pending: 'b-pending', 'In Progress': 'b-inprogress', Done: 'b-done' };
  return <span className={`badge ${m[s] || 'b-pending'}`}>{s}</span>;
}

function ActionRow({ action, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState({ owner: action.owner, due_date: action.due_date, priority: action.priority, status: action.status });
  const [saving, setSaving] = useState(false);
  const isOverdue = action.due_date && new Date(action.due_date) < new Date() && action.status !== 'Done';

  const save = async () => { setSaving(true); await onUpdate(action._id, f); setSaving(false); setEditing(false); };
  const toggleDone = () => onUpdate(action._id, { status: action.status === 'Done' ? 'Pending' : 'Done' });

  return (
    <div className="card" style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <button onClick={toggleDone} style={{
          width: 22, height: 22, borderRadius: 6, border: `2px solid ${action.status === 'Done' ? 'var(--green)' : 'var(--border2)'}`,
          background: action.status === 'Done' ? 'rgba(52,211,153,0.1)' : 'transparent',
          cursor: 'pointer', flexShrink: 0, marginTop: 3, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--green)', fontSize: 12, transition: 'all 0.15s'
        }}>{action.status === 'Done' ? '✓' : ''}</button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
            <span style={{
              fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700,
              color: action.status === 'Done' ? 'var(--text3)' : 'var(--text)',
              textDecoration: action.status === 'Done' ? 'line-through' : 'none'
            }}>{action.title}</span>
            <PBadge p={action.priority} />
            <SBadge s={action.status} />
            {isOverdue && <span className="badge b-overdue">Overdue</span>}
          </div>
          {action.description && <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8, lineHeight: 1.5 }}>{action.description}</p>}

          {editing ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div><label style={{ fontSize: 10 }}>Owner</label>
                <input style={{ padding: '7px 10px', fontSize: 12 }} value={f.owner} onChange={e => setF(x => ({ ...x, owner: e.target.value }))} /></div>
              <div><label style={{ fontSize: 10 }}>Due Date</label>
                <input type="date" style={{ padding: '7px 10px', fontSize: 12 }} value={f.due_date} onChange={e => setF(x => ({ ...x, due_date: e.target.value }))} /></div>
              <div><label style={{ fontSize: 10 }}>Status</label>
                <select style={{ padding: '7px 10px', fontSize: 12 }} value={f.status} onChange={e => setF(x => ({ ...x, status: e.target.value }))}>
                  {['Pending', 'In Progress', 'Done'].map(s => <option key={s}>{s}</option>)}
                </select></div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text3)' }}>
              <span>👤 {action.owner || 'Unassigned'}</span>
              {action.due_date && <span style={{ color: isOverdue ? 'var(--red)' : 'var(--text3)' }}>📅 {action.due_date}</span>}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {editing ? (
            <>
              <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 12 }} onClick={save} disabled={saving}>{saving ? '...' : 'Save'}</button>
              <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => setEditing(false)}>Cancel</button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => setEditing(true)}>Edit</button>
              <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => onDelete(action._id)}>×</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ActionsDashboard() {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [filters, setFilters] = useState({ owner: '', priority: '', status: '' });
  const notify = (msg, type = 'success') => setToast({ msg, type });
  const setF = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await actionsAPI.getAll(filters); setActions(r.data.data); }
    catch (e) { notify(e.message, 'error'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const handleUpdate = async (id, data) => {
    try { await actionsAPI.update(id, data); await load(); notify('Updated'); }
    catch (e) { notify(e.message, 'error'); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this action item?')) return;
    try { await actionsAPI.delete(id); setActions(a => a.filter(x => x._id !== id)); notify('Deleted'); }
    catch (e) { notify(e.message, 'error'); }
  };

  const total = actions.length;
  const done = actions.filter(a => a.status === 'Done').length;
  const high = actions.filter(a => a.priority === 'High' && a.status !== 'Done').length;
  const overdue = actions.filter(a => a.due_date && new Date(a.due_date) < new Date() && a.status !== 'Done').length;
  const owners = [...new Set(actions.map(a => a.owner).filter(Boolean))];

  return (
    <div className="fade">
      <div className="ph"><h2>Action Items</h2><p>Track and manage all tasks extracted from meetings</p></div>
      <div className="pb">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 22 }}>
          {[[total,'Total Items',null],[done,'Completed','var(--green)'],[high,'High Priority','var(--red)'],[overdue,'Overdue','var(--yellow)']].map(([v,l,c]) => (
            <div key={l} className="stat"><div className="stat-v" style={{ color: c }}>{v}</div><div className="stat-l">{l}</div></div>
          ))}
        </div>

        <div className="card" style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 150 }}>
              <label>Owner</label>
              <select value={filters.owner} onChange={e => setF('owner', e.target.value)}>
                <option value="">All Owners</option>
                {owners.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 130 }}>
              <label>Priority</label>
              <select value={filters.priority} onChange={e => setF('priority', e.target.value)}>
                {['','High','Medium','Low'].map(p => <option key={p} value={p}>{p || 'All'}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 130 }}>
              <label>Status</label>
              <select value={filters.status} onChange={e => setF('status', e.target.value)}>
                {['','Pending','In Progress','Done'].map(s => <option key={s} value={s}>{s || 'All'}</option>)}
              </select>
            </div>
            <button className="btn btn-ghost" style={{ border: '1px solid var(--border)', height: 38 }} onClick={() => setFilters({ owner:'', priority:'', status:'' })}>Reset</button>
          </div>
        </div>

        {loading ? [1,2,3].map(i => <div key={i} className="skel" style={{ height: 80, marginBottom: 10 }} />)
          : actions.length === 0 ? (
            <div className="empty"><div className="ei">◈</div><h3>No action items</h3><p>Process a meeting to extract tasks automatically</p></div>
          ) : actions.map(a => <ActionRow key={a._id} action={a} onUpdate={handleUpdate} onDelete={handleDelete} />)
        }
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}