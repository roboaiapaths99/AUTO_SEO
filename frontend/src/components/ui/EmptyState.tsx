import React from 'react';
import type { LucideIcon } from 'lucide-react';

/**
 * AutoSEO AI Platform — Empty State Component
 * ===========================================
 * Beautiful empty state with icon, message, and optional CTA.
 */

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="card glass" style={{ textAlign: 'center', padding: '64px 32px' }}>
      <div style={{
        width: '80px',
        height: '80px',
        background: 'var(--primary-soft)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px',
        color: 'var(--primary)',
      }}>
        <Icon size={36} />
      </div>
      <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>{title}</h3>
      <p style={{
        color: 'var(--text-muted)',
        maxWidth: '420px',
        margin: '0 auto 24px',
        lineHeight: 1.6,
        fontSize: '0.95rem',
      }}>
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
