import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Layout, ChevronRight, Loader2, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { useProjectStore } from '../store/projectStore';
import { toast } from '../store/uiStore';

/**
 * AutoSEO AI Platform — Add Project Page
 * =====================================
 * Step-by-step form to create a new SEO project.
 */

const AddProjectPage: React.FC = () => {
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { fetchProjects, setCurrentProject, setActiveDomain } = useProjectStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Clean domain
    let cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

    try {
      const response = await api.post('/projects/', {
        name,
        domain: cleanDomain,
        description
      });
      
      const newProject = response.data;
      
      // Update global state immediately
      setCurrentProject(newProject);
      setActiveDomain(newProject.domain);
      
      // Refresh list in background
      fetchProjects();
      
      toast.success('Project created!', `Now tracking ${cleanDomain}`);
      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to create project. Please check the domain format.';
      setError(msg);
      toast.error('Project creation failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <button 
        onClick={() => navigate('/projects')}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: 'var(--space-xl)', fontSize: '0.875rem', fontWeight: 600 }}
      >
        <ArrowLeft size={18} /> Back to Projects
      </button>

      <div className="card glass">
        <h2 style={{ marginBottom: '4px', fontSize: '1.5rem' }}>Create New Project</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-xl)', fontSize: '0.875rem' }}>
          Set up your domain to start monitoring rankings and visibility.
        </p>

        {error && (
          <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-lg)', fontSize: '0.875rem', border: '1px solid var(--danger)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Project Name</label>
            <div style={{ position: 'relative' }}>
              <Layout size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="input-field" 
                placeholder="My Business Website" 
                style={{ paddingLeft: '40px' }}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Domain URL</label>
            <div style={{ position: 'relative' }}>
              <Globe size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="input-field" 
                placeholder="example.com" 
                style={{ paddingLeft: '40px' }}
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                required
              />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Enter domain without http/https (e.g., example.com)</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Description (Optional)</label>
            <textarea 
              className="input-field" 
              placeholder="Brief description of this project..." 
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ resize: 'none' }}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: 'var(--space-md)' }}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
              <>Create Project <ChevronRight size={18} /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddProjectPage;
