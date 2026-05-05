import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useUIStore, type Toast as ToastType } from '../../store/uiStore';

/**
 * AutoSEO AI Platform — Toast Notification System
 * ===============================================
 * Slide-in notifications with auto-dismiss and manual close.
 */

const iconMap = {
  success: <CheckCircle2 size={20} />,
  error: <XCircle size={20} />,
  warning: <AlertTriangle size={20} />,
  info: <Info size={20} />,
};

const colorMap = {
  success: { bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981', color: '#10b981' },
  error: { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', color: '#ef4444' },
  warning: { bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', color: '#f59e0b' },
  info: { bg: 'rgba(59, 130, 246, 0.15)', border: '#3b82f6', color: '#3b82f6' },
};

const ToastItem: React.FC<{ toast: ToastType }> = ({ toast }) => {
  const removeToast = useUIStore((state) => state.removeToast);
  const colors = colorMap[toast.type];

  return (
    <div
      className="animate-slide-in-right"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '14px 16px',
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 'var(--radius-md)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        maxWidth: '400px',
        width: '100%',
        animation: 'slideInRight 0.3s ease forwards',
      }}
    >
      <div style={{ color: colors.color, flexShrink: 0, marginTop: '2px' }}>
        {iconMap[toast.type]}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: toast.message ? '2px' : 0 }}>
          {toast.title}
        </p>
        {toast.message && (
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        style={{ color: 'var(--text-muted)', flexShrink: 0, padding: '2px' }}
      >
        <X size={16} />
      </button>
    </div>
  );
};

export const Toaster: React.FC = () => {
  const toasts = useUIStore((state) => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <div key={t.id} style={{ pointerEvents: 'auto' }}>
          <ToastItem toast={t} />
        </div>
      ))}
    </div>
  );
};

export default Toaster;
