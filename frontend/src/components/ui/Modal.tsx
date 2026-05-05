import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

/**
 * AutoSEO AI Platform — Modal Component
 * =====================================
 * Reusable modal with backdrop, close button, and escape-key support.
 */

interface ModalProps {
  name: string;
  title: string;
  children: React.ReactNode;
  width?: string;
}

const Modal: React.FC<ModalProps> = ({ name, title, children, width = '500px' }) => {
  const { activeModal, closeModal } = useUIStore();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    if (activeModal === name) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [activeModal, name, closeModal]);

  if (activeModal !== name) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-md)',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={closeModal}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
        }}
      />
      {/* Content */}
      <div
        className="card animate-fade-in"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: width,
          maxHeight: '85vh',
          overflow: 'auto',
          zIndex: 1,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{title}</h3>
          <button onClick={closeModal} style={{ padding: '6px', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
