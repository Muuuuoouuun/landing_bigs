import React, { useState } from 'react';

const GlobalNav = ({ onOpenModal }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav className="global-nav">
        <div className="container">
          <div className="nav-brand">
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #0b3d2b 0%, #165e45 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M7 12L10 15L17 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span>ClassIn <span style={{ fontWeight: '600', opacity: 0.6, fontSize: '0.9em' }}>Enterprise</span></span>
          </div>

          <div className="nav-links">

            <button onClick={onOpenModal} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600', fontSize: '0.9375rem', color: 'var(--color-primary)', padding: 0 }}>자료 받아보기</button>
          </div>

          <div className="nav-cta-group">
            <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>데모 시연</button>
            <button className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}>도입 문의</button>
          </div>

          <button
            className="nav-hamburger"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="메뉴 열기"
          >
            {menuOpen
              ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            }
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="nav-mobile-menu">

          <button onClick={() => { onOpenModal(); setMenuOpen(false); }} className="nav-mobile-material-btn">자료 받아보기</button>
          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.25rem' }}>
            <button className="btn btn-secondary" style={{ flex: 1 }}>데모 시연</button>
            <button className="btn btn-primary" style={{ flex: 1 }}>도입 문의</button>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalNav;
