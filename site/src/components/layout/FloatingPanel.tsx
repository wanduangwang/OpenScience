'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale } from '@/lib/i18n/locale-context';
import { locales, localeNames } from '@/lib/i18n/dictionary';
import { ChatPanel } from '@/components/chat/ChatPanel';

/**
 * FloatingPanel
 *
 * A floating control panel fixed at the bottom-right corner of the page.
 * - Collapsed: small pill showing current language code
 * - Expanded: language options + AI Chat entry
 *
 * Visually identical to the MyST version (guide/shared-footer-*.md).
 * On Next.js pages, language switching uses React context (no page reload).
 */
export function FloatingPanel() {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleChatClick = () => {
    setOpen(false);
    setChatOpen(true);
  };

  return (
    <>
      {/* Chat overlay panel */}
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />

      <div
        ref={panelRef}
        className="os-float-panel"
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 9999,
          fontFamily: 'system-ui, sans-serif',
          fontSize: '0.875rem',
        }}
      >
        {/* Expanded panel */}
        <div
          className="os-float-body"
          style={{
            opacity: open ? 1 : 0,
            visibility: open ? 'visible' : 'hidden',
            transform: open ? 'translateY(0) scale(1)' : 'translateY(6px) scale(0.96)',
            transition: 'opacity 0.15s ease, visibility 0.15s ease, transform 0.15s ease',
            transformOrigin: 'bottom right',
            marginBottom: '0.625rem',
          }}
        >
          <div
            className="os-float-card"
            style={{
              minWidth: '9rem',
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '0.75rem',
              padding: '0.375rem',
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            }}
          >
            {/* Language items */}
            {locales.map((l) => (
              <button
                key={l}
                onClick={() => { setLocale(l); setOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: l === locale ? '#f3f4f6' : 'transparent',
                  color: l === locale ? '#111827' : '#374151',
                  fontWeight: l === locale ? 600 : 400,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  textAlign: 'left' as const,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => { if (l !== locale) e.currentTarget.style.background = '#f3f4f6'; }}
                onMouseLeave={(e) => { if (l !== locale) e.currentTarget.style.background = 'transparent'; }}
              >
                {localeNames[l]}
                {l === locale && (
                  <span style={{ opacity: 0.5, fontSize: '0.75rem' }}>&#x2713;</span>
                )}
              </button>
            ))}
            {/* Divider */}
            <div style={{ height: '1px', background: '#e5e7eb', margin: '0.25rem 0.5rem' }} />
            {/* AI Chat entry */}
            <button
              onClick={handleChatClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: 'transparent',
                color: '#374151',
                fontSize: '0.875rem',
                cursor: 'pointer',
                textAlign: 'left' as const,
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{ width: '1rem', height: '1rem', color: '#2563eb', flexShrink: 0 }}
              >
                <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 0 0-1.032-.211 50.89 50.89 0 0 0-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 0 0 2.433 3.984L7.28 21.53A.75.75 0 0 1 6 21v-4.03a48.527 48.527 0 0 1-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979Z" />
                <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.782a.75.75 0 0 0 1.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0 0 15.75 7.5Z" />
              </svg>
              {t('chat.title')}
            </button>
            {/* One remaining reserved slot */}
            <div
              style={{
                height: '1.75rem',
                margin: '0.25rem 0.5rem',
                borderRadius: '0.375rem',
                border: '1px dashed #d1d5db',
                opacity: 0.35,
              }}
              title="Reserved for future features"
            />
          </div>
        </div>

        {/* Trigger pill */}
        <div
          className="os-float-trigger"
          onClick={() => setOpen(!open)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.5rem 0.875rem',
            borderRadius: '9999px',
            border: '1px solid rgba(255,255,255,0.3)',
            background: 'rgba(1,50,67,0.92)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            color: 'white',
            fontWeight: 500,
            lineHeight: 1,
            cursor: 'pointer',
            userSelect: 'none',
            transition: 'box-shadow 0.15s, background 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.25)';
            e.currentTarget.style.background = 'rgba(1,50,67,0.96)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
            e.currentTarget.style.background = 'rgba(1,50,67,0.92)';
          }}
        >
          <span style={{ fontWeight: 500 }}>{localeNames[locale]}</span>
          <span
            style={{
              opacity: 0.6,
              fontSize: '0.65rem',
              lineHeight: 1,
              transform: open ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s',
            }}
          >
            &#x25B4;
          </span>
        </div>
      </div>
    </>
  );
}
