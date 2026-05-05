import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TrendingUp, BarChart3, ArrowUpRight, Search, Calendar, Loader2, RefreshCw, Plus, Target, ExternalLink, Filter, X, Zap, ChevronRight, Activity, Globe } from 'lucide-react';
import MetricCard from '../components/ui/MetricCard';
import ExportButton from '../components/ui/ExportButton';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import { seoService } from '../services/seoService';
import { useProjectStore } from '../store/projectStore';
import { useUIStore, toast } from '../store/uiStore';

/**
 * AutoSEO AI Platform — Position Tracking
 * ======================================
 * Monitoring mission-critical keyword rankings over time.
 */
const PositionTrackingPage: React.FC = () => {
  const navigate = useNavigate();
  const [keywords, setKeywords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newKeywords, setNewKeywords] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('30d');
  
  const currentProject = useProjectStore((state) => state.currentProject);
  const activeDomain = useProjectStore((state) => state.activeDomain);
  const { openModal, closeModal } = useUIStore();

  const fetchRankings = async () => {
    if (!currentProject) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await seoService.getLatestRankings(currentProject._id);
      setKeywords(response.data || []);
    } catch (error) {
      toast.error('Sync Error', 'Failed to retrieve latest ranking data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, [currentProject]);

  const handleUpdateRankings = async () => {
    if (!currentProject || !activeDomain || keywords.length === 0) return;
    setUpdating(true);
    toast.info('Updating Rankings', 'Fetching current search engine results...');
    try {
      const keywordList = keywords.map(k => k.keyword);
      await seoService.trackKeywords(currentProject._id, activeDomain, keywordList);
      await fetchRankings();
      toast.success('Refresh Complete', 'Latest keyword positions have been synchronized.');
    } catch (error) {
      toast.error('Update Failed', 'Could not fetch real-time SERP data.');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddKeywords = async () => {
    if (!currentProject || !activeDomain || !newKeywords.trim()) return;
    const kws = newKeywords.split('\n').map(k => k.trim()).filter(Boolean);
    if (kws.length === 0) return;
    
    setUpdating(true);
    toast.info('Initializing Tracker', `Adding ${kws.length} keywords to monitoring...`);
    try {
      await seoService.trackKeywords(currentProject._id, activeDomain, kws);
      await fetchRankings();
      toast.success('Keywords Added', 'Tracking has started for the new dataset.');
      setNewKeywords('');
      closeModal();
    } catch (error) {
      toast.error('Addition Failed', 'Failed to register keywords for tracking.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading && keywords.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <div className="premium-gradient animate-pulse" style={{ width: '80px', height: '80px', borderRadius: '24px', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <Activity size={40} className="animate-spin" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Loading Ranking Intelligence...</h2>
        <p style={{ color: 'var(--text-muted)' }}>Retrieving position history and SERP data</p>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <EmptyState
        icon={Target}
        title="Rank Tracking Hub"
        description="Select or create a project to start monitoring your mission-critical keyword positions."
        action={<Link to="/projects" className="btn btn-primary">Go to Projects</Link>}
      />
    );
  }

  const filteredKeywords = keywords.filter(k => 
    k.keyword.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const top3 = keywords.filter(k => k.position && k.position <= 3).length;
  const top10 = keywords.filter(k => k.position && k.position <= 10).length;
  const avgPos = keywords.length ? (keywords.reduce((acc, k) => acc + (k.position || 100), 0) / keywords.length).toFixed(1) : "—";
  const visibilityIndex = keywords.length ? Math.round((top10 / keywords.length) * 100) : 0;

  return (
    <div className="animate-fade-in">
      {/* Add Keywords Modal */}
      <Modal name="add-keywords" title="Add Tracking Keywords">
        <div style={{ marginBottom: '24px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>
            Input the keywords you want to monitor. We'll track positions for <strong style={{ color: 'var(--primary)' }}>{activeDomain}</strong> across all major search regions.
          </p>
        </div>
        <textarea
          className="input-field"
          rows={10}
          placeholder={"best seo tools\nrank tracking software\nmarketing automation\ncontent strategy ai"}
          value={newKeywords}
          onChange={(e) => setNewKeywords(e.target.value)}
          style={{ resize: 'none', marginBottom: '24px', padding: '16px', borderRadius: '12px', fontSize: '1rem' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={closeModal} style={{ borderRadius: '10px' }}>Cancel</button>
          <button className="btn btn-primary" onClick={handleAddKeywords} disabled={updating || !newKeywords.trim()} style={{ borderRadius: '10px', padding: '0 24px' }}>
            {updating ? <Loader2 className="animate-spin" size={18} /> : 'Start Tracking'}
          </button>
        </div>
      </Modal>

      <div style={{ marginBottom: 'var(--space-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '8px' }}>
            Position <span className="text-gradient">Tracking</span>
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
             <Globe size={16} className="text-primary" />
             <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Monitoring <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{activeDomain}</span> visibility</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border)' }}>
             {['7d', '30d', '90d'].map(d => (
               <button 
                key={d} 
                onClick={() => setDateRange(d)}
                style={{ 
                  padding: '6px 14px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800,
                  background: dateRange === d ? 'var(--primary)' : 'transparent',
                  color: dateRange === d ? 'white' : 'var(--text-muted)',
                  transition: 'all 0.2s'
                }}
               >
                 {d.toUpperCase()}
               </button>
             ))}
          </div>
          <ExportButton
            data={keywords}
            filename={`rankings_${activeDomain}`}
            columns={[
              { key: 'keyword', label: 'Keyword' },
              { key: 'position', label: 'Position' },
              { key: 'url', label: 'URL' },
              { key: 'recorded_at', label: 'Last Checked' },
            ]}
          />
          <button className="btn btn-secondary" onClick={() => openModal('add-keywords')} style={{ borderRadius: '12px' }}>
            <Plus size={18} /> Add Keywords
          </button>
          <button
            className="btn btn-primary"
            onClick={handleUpdateRankings}
            disabled={updating || keywords.length === 0}
            style={{ borderRadius: '12px', padding: '0 20px' }}
          >
            {updating ? <RefreshCw className="animate-spin" size={18} /> : <Search size={18} />}
            <span style={{ marginLeft: '8px' }}>Sync SERP</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
        <MetricCard title="Avg. Position" value={avgPos} icon={TrendingUp} trend="up" change={2.1} />
        <MetricCard title="Top 3 Visibility" value={top3.toString()} icon={Zap} trend="up" change={1} />
        <MetricCard title="Top 10 Keywords" value={top10.toString()} icon={ArrowUpRight} trend="up" change={4} />
        <MetricCard title="Market Share" value={`${visibilityIndex}%`} icon={BarChart3} trend="up" change={5} />
      </div>

      <div className="card glass" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Tracking Matrix</h3>
          <div style={{ display: 'flex', gap: '12px', flex: 1, maxWidth: '400px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                className="input-field" 
                placeholder="Filter keywords..." 
                style={{ paddingLeft: '36px', height: '40px', fontSize: '0.9rem' }}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="btn btn-secondary" style={{ padding: '0 12px' }}><Filter size={16} /></button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.01)', color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                <th style={{ padding: '16px 24px' }}>Keyword</th>
                <th style={{ padding: '16px 24px' }}>Position</th>
                <th style={{ padding: '16px 24px' }}>Ranking URL</th>
                <th style={{ padding: '16px 24px' }}>Trend</th>
                <th style={{ padding: '16px 24px' }}>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {filteredKeywords.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '60px' }}>
                    <EmptyState 
                      icon={Target} 
                      title="No matching keywords" 
                      description={keywords.length === 0 ? "You're not tracking any keywords for this project yet." : "No keywords match your search criteria."}
                      action={keywords.length === 0 ? <button className="btn btn-primary" onClick={() => openModal('add-keywords')}>Track First Keyword</button> : undefined}
                    />
                  </td>
                </tr>
              ) : (
                filteredKeywords.map((k, i) => (
                  <tr key={i} className="table-row-hover" style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{k.keyword}</div>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: k.position && k.position <= 3 ? 'var(--primary-soft)' : k.position && k.position <= 10 ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-main)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 900, fontSize: '0.9rem',
                        color: k.position && k.position <= 3 ? 'var(--primary)' : k.position && k.position <= 10 ? 'var(--warning)' : 'var(--text-muted)'
                      }}>
                        {k.position || '>100'}
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      {k.url ? (
                        <a href={k.url} target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                          {(() => { try { return new URL(k.url).pathname; } catch { return k.url; } })()}
                          <ExternalLink size={12} />
                        </a>
                      ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Not ranking</span>}
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success)', fontWeight: 800, fontSize: '0.8rem' }}>
                          <ArrowUpRight size={14} /> +2
                       </div>
                    </td>
                    <td style={{ padding: '20px 24px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      {k.recorded_at ? new Date(k.recorded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Pending'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PositionTrackingPage;
