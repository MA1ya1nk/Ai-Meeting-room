import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { meetingsAPI } from '../services/api';

const TYPES = ['Standup', 'Planning', 'Review', 'Retrospective', 'Kickoff', 'General'];

const SAMPLE = `Sprint Planning — Q2 Week 3

Alice: We have a critical auth bug — users are getting randomly logged out.
Bob: I can fix that. Should take about 3 hours. I'll do it today, high priority.
Alice: Perfect. Carol, can you finish the dashboard UI mockups by Wednesday?
Carol: Yes, I'll have them done by Wednesday noon and share in Figma.
David: I'll review Carol's mockups by Thursday EOD and leave comments in Figma.
Alice: Also David, please send beta invite emails by Thursday so users can confirm for Friday testing.
David: Got it. I'll also update the onboarding docs since signup flow changed — I'll finish that by next Friday.
Bob: One more thing — we need to migrate old DB records to the new schema. Estimated 3 days of work.
Alice: Start Monday. That's high priority, it blocks the Q2 release.

DECISIONS:
- Q2 release target confirmed for end of next week
- Daily standups at 9 AM starting Monday`;

function Toast({ msg, type, onClose }) {
  React.useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`toast`} style={{ borderColor: type === 'error' ? 'rgba(248,113,113,0.4)' : 'rgba(52,211,153,0.4)' }}>
      <span style={{ color: type === 'error' ? 'var(--red)' : 'var(--green)', fontWeight: 700, fontSize: 16 }}>
        {type === 'error' ? '✕' : '✓'}
      </span>
      <span style={{ fontSize: 13, flex: 1 }}>{msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 18 }}>×</button>
    </div>
  );
}

export default function MeetingUpload() {
  const nav = useNavigate();
  const fileRef = useRef();
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stepMsg, setStepMsg] = useState('');
  const [form, setForm] = useState({ title: '', transcript: '', meeting_type: 'General', participants: '' });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const notify = (msg, type = 'success') => setToast({ msg, type });

  const handleFile = e => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 500000) { notify('File too large (max 500KB)', 'error'); return; }
    const r = new FileReader();
    r.onload = ev => set('transcript', ev.target.result);
    r.readAsText(f);
  };

  const submit = async () => {
    if (!form.transcript.trim()) { notify('Transcript is required', 'error'); return; }
    setLoading(true);
    try {
      setStepMsg('Saving meeting...');
      const participants = form.participants.split(',').map(p => p.trim()).filter(Boolean);
      const res = await meetingsAPI.create({ ...form, participants });
      const id = res.data.data.meeting_id;

      setStepMsg('Claude is analyzing your meeting...');
      const proc = await meetingsAPI.process(id);
      if (!proc.data.ai_success) notify(`Demo mode: ${proc.data.error_message}`, 'error');
      else notify('Meeting analyzed successfully!');

      setTimeout(() => nav(`/history?h=${id}`), 1000);
    } catch (err) {
      notify(err.message, 'error');
      setStepMsg('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade">
      <div className="ph">
        <h2>New Meeting</h2>
        <p>Paste your notes or upload a transcript — Claude extracts everything automatically</p>
      </div>
      <div className="pb">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
          <div className="card">
            <div style={{ marginBottom: 18 }}>
              <label>Meeting Title (optional)</label>
              <input placeholder="e.g. Q2 Sprint Planning" value={form.title} onChange={e => set('title', e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
              <div>
                <label>Meeting Type</label>
                <select value={form.meeting_type} onChange={e => set('meeting_type', e.target.value)}>
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label>Participants (comma-separated)</label>
                <input placeholder="Alice, Bob, Carol" value={form.participants} onChange={e => set('participants', e.target.value)} />
              </div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label>Meeting Notes / Transcript</label>
              <textarea style={{ minHeight: 260, fontSize: 13 }}
                placeholder="Paste your meeting transcript here..."
                value={form.transcript}
                onChange={e => set('transcript', e.target.value)}
              />
            </div>
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 15px', background: 'rgba(124,106,247,0.1)', border: '1px solid rgba(124,106,247,0.3)', borderRadius: 8, marginBottom: 14 }}>
                <div style={{ width: 16, height: 16, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} className="spin" />
                <span style={{ color: 'var(--accent2)', fontSize: 13 }}>{stepMsg}</span>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" onClick={submit} disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
                {loading ? 'Processing...' : '⚡ Analyze with Claude'}
              </button>
              <button className="btn btn-secondary" onClick={() => setForm({ title: '', transcript: '', meeting_type: 'General', participants: '' })} disabled={loading}>Clear</button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card">
              <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 14, marginBottom: 10 }}>📁 Upload .txt File</div>
              <input type="file" accept=".txt,.md" style={{ display: 'none' }} ref={fileRef} onChange={handleFile} />
              <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => fileRef.current?.click()}>Choose File</button>
            </div>
            <div className="card">
              <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 14, marginBottom: 14 }}>🤖 What Claude Extracts</div>
              {[['◎','Meeting Summary'],['◈','Key Decisions'],['✓','Action Items + Owners'],['⚑','Priority Levels'],['◷','Due Dates']].map(([i,l]) => (
                <div key={l} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <span style={{ color: 'var(--accent)', width: 18 }}>{i}</span>
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>{l}</span>
                </div>
              ))}
            </div>
            <div className="card">
              <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 14, marginBottom: 10 }}>💡 Try a Sample</div>
              <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', border: '1px solid var(--border)' }}
                onClick={() => setForm({ title: 'Q2 Sprint Planning', meeting_type: 'Planning', participants: 'Alice, Bob, Carol, David', transcript: SAMPLE })}>
                Load Sample Transcript
              </button>
            </div>
          </div>
        </div>
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}