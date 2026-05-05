import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, Menu, ChevronDown, Settings, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useProjectStore } from '../../store/projectStore';
import { useUIStore } from '../../store/uiStore';

/**
 * AutoSEO AI Platform — Header
 * ===========================
 * Top bar with mobile menu, search, project selector, and user dropdown.
 */
const Header: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);

  const { currentProject, setProject, projects, fetchProjects } = useProjectStore();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Close user menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const projectId = e.target.value;
    const selected = projects.find(p => p._id === projectId);
    if (selected) {
      setProject(selected);
      navigate('/');
    }
  };

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      if (query.includes('.') && query.length > 3) {
        navigate(`/domain-overview?q=${encodeURIComponent(query)}`);
      } else {
        navigate(`/keywords?q=${encodeURIComponent(query)}`);
      }
      setQuery('');
    }
  };

  const handleLogout = () => {
    setUserMenuOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <header className="glass" style={{
      height: '70px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 var(--space-xl)',
      position: 'sticky',
      top: 0,
      zIndex: 900,
      borderBottom: '1px solid var(--border)'
    }}>
      {/* Left side: mobile menu + search + project selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, maxWidth: '500px' }}>
        {/* Mobile menu button */}
        <button
          className="mobile-menu-btn"
          onClick={toggleSidebar}
          style={{ padding: '8px', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)' }}
          aria-label="Toggle menu"
        >
          <Menu size={22} />
        </button>

        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{
            position: 'absolute', left: '12px', top: '50%',
            transform: 'translateY(-50%)', color: 'var(--text-muted)'
          }} />
          <input
            type="text"
            placeholder="Search domain or keyword..."
            className="input-field"
            style={{ paddingLeft: '40px' }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>

        <select
          className="input-field"
          style={{ width: '160px', padding: '8px 12px', fontSize: '0.8125rem', height: '42px', flexShrink: 0 }}
          value={currentProject?._id || ''}
          onChange={handleProjectChange}
        >
          <option value="" disabled>Select Project</option>
          {projects.map(p => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Right side: notifications + user */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        <button
          style={{ padding: '8px', borderRadius: '50%', position: 'relative', border: '1px solid var(--border)' }}
          title="Notifications"
        >
          <Bell size={20} />
          <span style={{
            position: 'absolute', top: '4px', right: '4px',
            width: '8px', height: '8px', borderRadius: '50%',
            background: 'var(--danger)', border: '2px solid var(--bg-card)',
          }} />
        </button>

        {/* User dropdown */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
              padding: '4px 8px', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              background: userMenuOpen ? 'var(--primary-soft)' : 'transparent',
            }}
          >
            <div className="premium-gradient" style={{
              width: '32px', height: '32px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '0.75rem', fontWeight: 700
            }}>
              {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user?.full_name || 'User'}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user?.plan || 'Free'} Plan</span>
            </div>
            <ChevronDown size={16} color="var(--text-muted)" style={{ transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {userMenuOpen && (
            <div className="dropdown-menu">
              <button className="dropdown-item" onClick={() => { navigate('/settings'); setUserMenuOpen(false); }}>
                <User size={16} /> Profile
              </button>
              <button className="dropdown-item" onClick={() => { navigate('/settings'); setUserMenuOpen(false); }}>
                <Settings size={16} /> Settings
              </button>
              <div className="dropdown-divider" />
              <button className="dropdown-item" onClick={handleLogout} style={{ color: 'var(--danger)' }}>
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
