import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import MeetingUpload from './pages/MeetingUpload';
import ActionsDashboard from './pages/ActionsDashboard';
import MeetingHistory from './pages/MeetingHistory';

function Sidebar() {
  const links = [
    { to: '/', icon: '⊕', label: 'New Meeting' },
    { to: '/actions', icon: '◈', label: 'Action Items' },
    { to: '/history', icon: '◷', label: 'History' },
  ];
  return (
    <aside style={{
      width: 220, background: '#111118', borderRight: '1px solid #2a2a35',
      display: 'flex', flexDirection: 'column', position: 'fixed',
      top: 0, left: 0, height: '100vh', zIndex: 100
    }}>
      <div style={{ padding: '24px 20px', borderBottom: '1px solid #2a2a35' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, color: '#f0f0f5' }}>
          Meeting<span style={{ color: '#7c6af7' }}>Mind</span>
        </div>
        <div style={{ fontSize: 11, color: '#5a5a70', marginTop: 2 }}>AI Meeting Tracker</div>
      </div>
      <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        {links.map(l => (
          <NavLink key={l.to} to={l.to} end={l.to === '/'} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
            borderRadius: 8, textDecoration: 'none', fontSize: 13, fontFamily: 'DM Mono, monospace',
            color: isActive ? '#a599ff' : '#9898aa',
            background: isActive ? 'rgba(124,106,247,0.12)' : 'transparent',
            border: `1px solid ${isActive ? 'rgba(124,106,247,0.3)' : 'transparent'}`,
            transition: 'all 0.15s'
          })}>
            <span style={{ width: 18, textAlign: 'center' }}>{l.icon}</span>
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>
      <div style={{ padding: '16px 20px', borderTop: '1px solid #2a2a35', fontSize: 11, color: '#5a5a70' }}>
        Powered by <span style={{ color: '#7c6af7' }}>Claude AI</span>
      </div>
    </aside>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <main style={{ marginLeft: 220, flex: 1, minHeight: '100vh', background: '#0a0a0f' }}>
          <Routes>
            <Route path="/" element={<MeetingUpload />} />
            <Route path="/actions" element={<ActionsDashboard />} />
            <Route path="/history" element={<MeetingHistory />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}