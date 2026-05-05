import React, { useState, useEffect } from 'react';
import { Link2, Globe, TrendingUp, ShieldCheck, Filter, Loader2, X, ExternalLink, Search, Download, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import MetricCard from '../components/ui/MetricCard';
import ExportButton from '../components/ui/ExportButton';
import EmptyState from '../components/ui/EmptyState';
import { useProjectStore } from '../store/projectStore';
import { seoService } from '../services/seoService';
import { toast } from '../store/uiStore';

/**
 * AutoSEO AI Platform — Backlink Intelligence
 * ==========================================
 * Deep analysis of the link profile, authority, and anchor distribution.
 */
const BacklinksPage: React.FC = () => {
  const activeDomain = useProjectStore((state) => state.activeDomain);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState('all'); 
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchBacklinks = async () => {
      if (!activeDomain) {
        setLoading(false);
        return;
      }
      setLoading(true);
      toast.info('Analyzing Links', `Crawling backlink profile for ${activeDomain}...`);
      try {
        const data = await seoService.getBacklinkProfile(activeDomain);
        setProfile(data);
        toast.success('Analysis Ready', `Found ${data.total_backlinks || 0} links for this domain.`);
      } catch (error) {
        toast.error('Crawl Error', 'Could not retrieve backlink data.');
      } finally {
        setLoading(false);
      }
    };
    fetchBacklinks();
  }, [activeDomain]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <div className="premium-gradient animate-pulse" style={{ width: '80px', height: '80px', borderRadius: '24px', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <Link2 size={40} className="animate-bounce" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Mapping Backlink Network...</h2>
        <p style={{ color: 'var(--text-muted)' }}>Calculating authority scores and link quality</p>
      </div>
    );
  }

  if (!activeDomain) {
    return (
      <EmptyState
        icon={Link2}
        title="Link Profile Analysis"
        description="Connect a domain to start mapping your backlink network and authority footprint."
        action={<button className="btn btn-primary" onClick={() => window.location.href='/projects'}>Go to Projects</button>}
      />
    );
  }

  const allBacklinks = profile?.backlinks || [];
  const filteredBacklinks = allBacklinks.filter((b: any) => {
    const matchesSearch = b.source_url.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (b.anchor_text && b.anchor_text.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === 'all' || 
                       (filterType === 'dofollow' ? b.type !== 'nofollow' : b.type === 'nofollow');
    return matchesSearch && matchesType;
  });

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 'var(--space-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '8px' }}>
            Link <span className="text-gradient">Intelligence</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
            Full profile analysis for <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{activeDomain}</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <ExportButton
            data={filteredBacklinks}
            filename={`backlinks_${activeDomain}`}
            columns={[
              { key: 'source_url', label: 'Source URL' },
              { key: 'target_url', label: 'Target URL' },
              { key: 'anchor_text', label: 'Anchor Text' },
              { key: 'domain_authority', label: 'Authority' },
              { key: 'type', label: 'Type' },
            ]}
          />
          <button
            className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowFilters(!showFilters)}
            style={{ borderRadius: '12px' }}
          >
            {showFilters ? <X size={18} /> : <Filter size={18} />}
            <span style={{ marginLeft: '8px' }}>Filters</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
        <MetricCard title="Total Backlinks" value={(profile?.total_backlinks || 0).toLocaleString()} icon={Link2} trend="up" change={5.2} />
        <MetricCard title="Ref. Domains" value={(profile?.referring_domains || 0).toLocaleString()} icon={Globe} trend="up" change={2.1} />
        <MetricCard title="Trust Flow" value={profile?.trust_score || 45} icon={ShieldCheck} trend="up" change={1} />
        <MetricCard title="Dofollow %" value={`${profile?.total_backlinks ? Math.floor((profile.dofollow_count / profile.total_backlinks) * 100) : 0}%`} icon={TrendingUp} />
      </div>

      {showFilters && (
        <div className="card glass animate-slide-down" style={{ marginBottom: 'var(--space-lg)', padding: '20px' }}>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
               <p style={{ fontWeight: 800, marginBottom: '12px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Link Type</p>
               <div style={{ display: 'flex', gap: '8px' }}>
                {['all', 'dofollow', 'nofollow'].map(type => (
                  <button
                    key={type}
                    className={`btn ${filterType === type ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilterType(type)}
                    style={{ textTransform: 'capitalize', fontSize: '0.8rem', padding: '6px 16px', borderRadius: '100px' }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1 }}>
               <p style={{ fontWeight: 800, marginBottom: '12px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Search Profile</p>
               <div style={{ position: 'relative' }}>
                 <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                 <input 
                  className="input-field" 
                  placeholder="Search source URL or anchor text..." 
                  style={{ paddingLeft: '36px', height: '40px', fontSize: '0.9rem' }}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                 />
               </div>
            </div>
          </div>
        </div>
      )}

      <div className="card glass" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Backlink Inventory</h3>
           <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Showing {filteredBacklinks.length} results</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.01)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                <th style={{ padding: '16px 24px' }}>Source Authority</th>
                <th style={{ padding: '16px 24px' }}>Link Information</th>
                <th style={{ padding: '16px 24px' }}>Anchor Text</th>
                <th style={{ padding: '16px 24px' }}>Status</th>
                <th style={{ padding: '16px 24px' }}>Seen</th>
              </tr>
            </thead>
            <tbody>
              {filteredBacklinks.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '60px' }}>
                    <EmptyState icon={Search} title="No matching links" description="Try adjusting your filters or search query." />
                  </td>
                </tr>
              ) : (
                filteredBacklinks.map((b: any, i: number) => (
                  <tr key={i} className="table-row-hover" style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                         <div style={{ 
                           width: '40px', height: '40px', borderRadius: '10px', 
                           background: (b.domain_authority || 0) > 50 ? 'var(--primary-soft)' : 'var(--bg-main)',
                           display: 'flex', alignItems: 'center', justifyContent: 'center',
                           fontWeight: 800, color: (b.domain_authority || 0) > 50 ? 'var(--primary)' : 'var(--text-muted)'
                         }}>
                           {b.domain_authority || b.rank || '??'}
                         </div>
                         <div>
                            <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Authority</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{ (b.domain_authority || 0) > 80 ? 'Elite' : (b.domain_authority || 0) > 40 ? 'High' : 'Neutral'}</div>
                         </div>
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <a href={b.source_url} target="_blank" rel="noreferrer" style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {new URL(b.source_url).hostname} <ExternalLink size={12} className="text-muted" />
                        </a>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                           to {b.target_url}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ padding: '4px 12px', borderRadius: '8px', background: 'var(--bg-main)', display: 'inline-block', fontSize: '0.8rem', fontWeight: 600 }}>
                        {b.anchor_text || '(image link)'}
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase',
                        background: b.type === 'nofollow' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: b.type === 'nofollow' ? 'var(--danger)' : 'var(--success)',
                        display: 'inline-flex', alignItems: 'center', gap: '4px'
                      }}>
                        {b.type === 'nofollow' ? <AlertCircle size={10} /> : <CheckCircle2 size={10} />}
                        {b.type || 'dofollow'}
                      </span>
                    </td>
                    <td style={{ padding: '20px 24px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      {b.first_seen ? new Date(b.first_seen).toLocaleDateString() : 'Active'}
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

export default BacklinksPage;
