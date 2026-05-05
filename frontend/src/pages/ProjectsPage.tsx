import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Globe, Search, ArrowUpRight, Loader2, Info } from 'lucide-react';
import api from '../services/api';
import { useProjectStore } from '../store/projectStore';

/**
 * AutoSEO AI Platform — Projects Page
 * ===================================
 * Lists all user projects with quick status overview.
 */

interface Project {
  _id: string;
  name: string;
  domain: string;
  created_at: string;
}

const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setProject = useProjectStore((state) => state.setProject);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.get('/projects/');
        setProjects(response.data);
      } catch (err: any) {
        setError('Failed to load projects. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleSelectProject = (project: Project) => {
    setProject(project);
    navigate('/');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Loader2 className="animate-spin" size={32} color="var(--primary)" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
        <div>
          <h1 style={{ fontSize: '2rem' }}>Your Projects</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage domains and track SEO performance</p>
        </div>
        <Link to="/projects/add" className="btn btn-primary">
          <Plus size={20} />
          New Project
        </Link>
      </div>

      {error && (
        <div style={{ padding: 'var(--space-md)', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-xl)' }}>
          {error}
        </div>
      )}

      {projects.length === 0 && !error ? (
        <div className="card glass" style={{ textAlign: 'center', padding: 'var(--space-xl) * 2', borderStyle: 'dashed' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'var(--primary-soft)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--space-lg)',
            color: 'var(--primary)'
          }}>
            <Globe size={32} />
          </div>
          <h2 style={{ marginBottom: 'var(--space-sm)' }}>No Projects Yet</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto var(--space-xl)' }}>
            Start by adding your first domain to track keywords, analyze backlinks, and get AI visibility insights.
          </p>
          <Link to="/projects/add" className="btn btn-primary">
            Add Your First Domain
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-lg)' }}>
          {projects.map((project) => (
            <div key={project._id} className="card glass" onClick={() => handleSelectProject(project)} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'var(--primary-soft)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)'
                }}>
                  <Globe size={22} />
                </div>
                <ArrowUpRight size={20} color="var(--text-muted)" />
              </div>
              <h3 style={{ marginBottom: '4px' }}>{project.name}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Globe size={14} /> {project.domain}
              </p>
              
              <div style={{ display: 'flex', gap: 'var(--space-md)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--border)' }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Keywords</span>
                  <p style={{ fontWeight: 700 }}>0</p>
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Rank Change</span>
                  <p style={{ fontWeight: 700, color: 'var(--text-muted)' }}>—</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
