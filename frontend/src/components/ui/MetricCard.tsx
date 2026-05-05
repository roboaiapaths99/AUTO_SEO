import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string | number;
  icon: LucideIcon;
  trend?: 'up' | 'down';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon: Icon, trend }) => {
  const renderChange = () => {
    if (change === undefined) return null;
    const isNumeric = typeof change === 'number' || (!isNaN(parseFloat(String(change))) && isFinite(Number(String(change).replace('%', ''))));
    const displayValue = isNumeric && typeof change === 'number' ? `${trend === 'up' ? '+' : ''}${change}%` : change;
    
    return (
      <div style={{ 
        fontSize: '0.75rem', 
        fontWeight: 600, 
        color: trend === 'up' ? 'var(--success)' : 'var(--danger)',
        padding: '2px 8px',
        borderRadius: '100px',
        background: trend === 'up' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'
      }}>
        {displayValue}
      </div>
    );
  };

  return (
    <div className="card glass animate-fade-in" style={{ padding: 'var(--space-md)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-sm)' }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          borderRadius: 'var(--radius-md)', 
          background: 'var(--primary-soft)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'var(--primary)'
        }}>
          <Icon size={20} />
        </div>
        {renderChange()}
      </div>
      <div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{title}</p>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{value}</h3>
      </div>
    </div>
  );
};

export default MetricCard;
