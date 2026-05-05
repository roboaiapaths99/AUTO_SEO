import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Zap,
  LayoutDashboard,
  Globe,
  Search,
  Target,
  FileText,
  Brain,
  Link2,
  BarChart3,
  ArrowLeftRight,
  BookOpen,
  FolderKanban,
  ShieldCheck,
  Users,
  FileSearch,
  Layers,
  Activity,
  Settings,
  LogOut,
  ChevronDown,
  User,
  X,
  History as HistoryIcon,
  GitBranch,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';

/**
 * AutoSEO AI Platform — Sidebar Navigation
 * ========================================
 * Premium collapsible sidebar with grouped navigation and user menu.
 */

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
}

const mainNav: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/projects', label: 'Projects', icon: FolderKanban },
];

const seoToolsNav: NavItem[] = [
  { path: '/domain-overview', label: 'Domain Overview', icon: Globe },
  { path: '/organic-rankings', label: 'Organic Rankings', icon: Activity },
  { path: '/keywords', label: 'Keyword Research', icon: Search },
  { path: '/keyword-gap', label: 'Keyword Gap', icon: Layers },
  { path: '/tracking', label: 'Position Tracking', icon: Target },
];

const contentNav: NavItem[] = [
  { path: '/content', label: 'Content Assistant', icon: FileText },
  { path: '/topic-research', label: 'Topic Research', icon: BookOpen },
  { path: '/ai-visibility', label: 'AI Visibility', icon: Brain },
];

const intelligenceNav: NavItem[] = [
  { path: '/aio', label: 'AI Hallucination Guard', icon: ShieldCheck },
  { path: '/time-machine', label: 'SEO Time Machine', icon: HistoryIcon },
];

const linkBuildingNav: NavItem[] = [
  { path: '/backlinks', label: 'Backlink Analytics', icon: Link2 },
  { path: '/backlink-gap', label: 'Backlink Gap', icon: ArrowLeftRight },
  { path: '/referring-domains', label: 'Referring Domains', icon: Users },
  { path: '/backlink-audit', label: 'Backlink Audit', icon: ShieldCheck },
];

const competitiveNav: NavItem[] = [
  { path: '/domain-compare', label: 'Domain Compare', icon: BarChart3 },
  { path: '/audit', label: 'Site Audit', icon: FileSearch },
  { path: '/link-graph', label: 'Link-Juice Simulator', icon: GitBranch },
  { path: '/ppc-bridge', label: 'PPC-to-SEO Bridge', icon: Users },
];

const NavSection: React.FC<{ title: string; items: NavItem[]; onNavClick: () => void }> = ({ title, items, onNavClick }) => (
  <div style={{ marginBottom: '8px' }}>
    <p style={{
      fontSize: '0.65rem',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      color: 'var(--text-muted)',
      padding: '8px 20px 4px',
    }}>
      {title}
    </p>
    {items.map((item) => (
      <NavLink
        key={item.path}
        to={item.path}
        end={item.path === '/'}
        onClick={onNavClick}
        className={({ isActive }) => isActive ? 'nav-active' : ''}
        style={({ isActive }) => ({
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 20px',
          fontSize: '0.875rem',
          fontWeight: isActive ? 600 : 500,
          color: isActive ? 'var(--primary)' : 'var(--text-main)',
          background: isActive ? 'var(--primary-soft)' : 'transparent',
          borderRadius: '8px',
          margin: '2px 12px',
          transition: 'all 0.15s ease',
        })}
      >
        <item.icon size={18} />
        <span>{item.label}</span>
      </NavLink>
    ))}
  </div>
);

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const closeMobileSidebar = () => {
    if (window.innerWidth <= 1024) {
      setSidebarOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={`sidebar ${sidebarOpen ? 'open' : ''}`}
        style={{
          width: 'var(--sidebar-width)',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 1000,
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* ── Logo ── */}
        <div style={{
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }} onClick={closeMobileSidebar}>
            <div className="premium-gradient" style={{
              width: '36px', height: '36px', borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={20} color="white" fill="white" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>AutoSEO</h2>
              <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>AI Platform</p>
            </div>
          </NavLink>
          {/* Close button for mobile */}
          <button
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(false)}
            style={{ padding: '6px', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Navigation ── */}
        <div style={{ flex: 1, paddingTop: '12px', overflowY: 'auto' }}>
          <NavSection title="Main" items={mainNav} onNavClick={closeMobileSidebar} />
          <NavSection title="SEO Tools" items={seoToolsNav} onNavClick={closeMobileSidebar} />
          <NavSection title="AI Intelligence" items={contentNav} onNavClick={closeMobileSidebar} />
          <NavSection title="Link Building" items={linkBuildingNav} onNavClick={closeMobileSidebar} />
          <NavSection title="Competitive Intel" items={competitiveNav} onNavClick={closeMobileSidebar} />
        </div>

        {/* ── User Section ── */}
        <div
          ref={menuRef}
          style={{
            padding: '12px',
            borderTop: '1px solid var(--border)',
            flexShrink: 0,
            position: 'relative',
          }}
        >
          {/* User menu dropdown */}
          {userMenuOpen && (
            <div className="dropdown-menu" style={{ bottom: 'calc(100% + 4px)', top: 'auto', left: '8px', right: '8px' }}>
              <button className="dropdown-item" onClick={() => { navigate('/settings'); closeMobileSidebar(); setUserMenuOpen(false); }}>
                <Settings size={16} /> Settings
              </button>
              <button className="dropdown-item" onClick={() => { navigate('/settings'); closeMobileSidebar(); setUserMenuOpen(false); }}>
                <User size={16} /> Profile
              </button>
              <div className="dropdown-divider" />
              <button className="dropdown-item" onClick={handleLogout} style={{ color: 'var(--danger)' }}>
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          )}

          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              padding: '10px 12px',
              borderRadius: '10px',
              background: userMenuOpen ? 'var(--primary-soft)' : 'transparent',
              transition: 'background 0.15s ease',
            }}
          >
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--primary) 0%, #8b5cf6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0,
            }}>
              {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
              <p style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.full_name || 'User'}
              </p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email || 'user@example.com'}
              </p>
            </div>
            <ChevronDown size={16} color="var(--text-muted)" style={{ flexShrink: 0, transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
