import React from 'react';
import { Download } from 'lucide-react';
import { toast } from '../../store/uiStore';

/**
 * AutoSEO AI Platform — Export Button
 * ===================================
 * Downloads data as a CSV file.
 */

interface ExportButtonProps {
  data: any[];
  filename: string;
  columns?: { key: string; label: string }[];
  label?: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({ data, filename, columns, label = 'Export CSV' }) => {
  const handleExport = () => {
    if (!data || data.length === 0) {
      toast.warning('No data to export', 'Try loading some data first.');
      return;
    }

    try {
      const headers = columns
        ? columns.map(c => c.label)
        : Object.keys(data[0]);
      
      const keys = columns
        ? columns.map(c => c.key)
        : Object.keys(data[0]);

      const csvContent = [
        headers.join(','),
        ...data.map(row =>
          keys.map(key => {
            const val = row[key] ?? '';
            // Escape commas and quotes
            const str = String(val).replace(/"/g, '""');
            return str.includes(',') || str.includes('"') || str.includes('\n')
              ? `"${str}"`
              : str;
          }).join(',')
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Export complete', `Downloaded ${data.length} rows as CSV.`);
    } catch (err) {
      toast.error('Export failed', 'Could not generate the CSV file.');
    }
  };

  return (
    <button
      className="btn btn-secondary"
      onClick={handleExport}
      style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}
    >
      <Download size={16} /> {label}
    </button>
  );
};

export default ExportButton;
