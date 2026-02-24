import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { meetingsAPI, actionsAPI } from '../services/api';

function MeetingCard({ m, actions, highlight, expanded, onToggle }) {
  const sentColor = { Productive: 'var(--green)', Neutral: 'var(--text2)', Challenging: 'var(--red)' };
  const isOverdue = a => a.due_date && new Date(a.due_date) < new Date() && a.status !== 'Done';

  return (
    <div className="card" style={{ marginBottom: 14, borderColor: highlight ? 'rgba(124,106,247,0.5)' : undefined, boxShadow: highlight ? '0 0 20px rgba(124,106,247,0.12)' : undefined, transition: 'all 0.3s' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }} onClick={onToggle}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontFamily: 'Syne,sans-serif', fontSize: 16, fontWeight: 700 }}>{m.title}</span>
            <span className="badge" style={{ background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)' }}>{m.meeting_type}</span>
            {m.meeting_sentiment && <span className="badge" style={{ background: 'transparent', color: sentColor[m.meeting_sentiment], border: `1px solid ${sentColor[m.meeting_sentiment]}40` }}>{m.meeting_sentiment}</span>}
            {m.status === 'pending' && <span className="badge b-medium">Not Processed</span>}
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text3)', flexWrap: 'wrap' }}>
            <span>📅 {new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            {m.participants?.length > 0 && <span>👥 {m.participants.join(', ')}</span>}
            <span>✓ {actions.length} action{actions.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <span style={{ color: 'var(--text3)', fontSize: 16 }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && m.status !== 'pending' && (
        <div style={{ marginTop: 18 }}>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 0 18px' }} />
          {m.ai_summary && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>AI Summary</div>
              <p style={{ fontFamily: 'Instrument Serif, serif', fontStyle: 'italic', fontSize: 15, color: 'var(--text2)', lineHeight: 1.7, borderLeft: '3px solid var(--accent)', paddingLeft: 14 }}>{m.ai_summary}</p>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
            {m.key_decisions?.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Key Decisions</div>
                {m.key_decisions.map((d, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <span style={{ color: 'var(--accent)', flexShrink: 0 }}>◈</span>
                    <span style={{ fontSize: 13, color: 'var(--text2)' }}>{d}</span>
                  </div>
                ))}
              </div>
            )}
            {m.topics_discussed?.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Topics</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {m.topics_discussed.map((t, i) => <span key={i} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 100, padding: '3px 10px', fontSize: 11, color: 'var(--text2)' }}>{t}</span>)}
                </div>
              </div>
            )}
          </div>
          {actions.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Action Items</div>
              {actions.map(a => (
                <div key={a._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 13px', background: 'var(--bg3)', borderRadius: 8, marginBottom: 6 }}>
                  <span style={{ color: a.status === 'Done' ? 'var(--green)' : 'var(--text3)' }}>{a.status === 'Done' ? '✓' : '○'}</span>
                  <span style={{ flex: 1, fontSize: 13, textDecoration: a.status === 'Done' ? 'line-through' : 'none', color: a.status === 'Done' ? 'var(--text3)' : 'var(--text)' }}>{a.title}</span>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>👤 {a.owner}</span>
                  {a.due_date && <span style={{ fontSize: 11, color: isOverdue(a) ? 'var(--red)' : 'var(--text3)' }}>📅 {a.due_date}</span>}
                  <span className={`badge b-${a.priority?.toLowerCase()}`}>{a.priority}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MeetingHistory() {
  const [sp] = useSearchParams();
  const highlight = sp.get('h');
  const [meetings, setMeetings] = useState([]);
  const [allActions, setAllActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(highlight);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [mr, ar] = await Promise.all([meetingsAPI.getAll(search), actionsAPI.getAll()]);
        setMeetings(mr.data.data);
        setAllActions(ar.data.data);
        if (highlight) setExpanded(highlight);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [search, highlight]);

  return (
    <div className="fade">
      <div className="ph"><h2>Meeting History</h2><p>Browse all past meetings and their AI-generated summaries</p></div>
      <div className="pb">
        <div style={{ marginBottom: 20, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }}>⌕</span>
          <input style={{ paddingLeft: 36 }} placeholder="Search meetings, summaries, transcripts..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {!loading && <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14 }}>{meetings.length} meeting{meetings.length !== 1 ? 's' : ''}</div>}

        {loading ? [1,2,3].map(i => <div key={i} className="skel" style={{ height: 90, marginBottom: 14 }} />)
          : meetings.length === 0 ? (
            <div className="empty"><div className="ei">◷</div><h3>No meetings yet</h3><p>Upload your first meeting to get started</p></div>
          ) : meetings.map(m => (
            <MeetingCard key={m._id} m={m} actions={allActions.filter(a => a.meeting_id === m._id)}
              highlight={m._id === highlight} expanded={expanded === m._id}
              onToggle={() => setExpanded(expanded === m._id ? null : m._id)} />
          ))
        }
      </div>
    </div>
  );
}