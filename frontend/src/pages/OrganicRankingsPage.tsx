import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, Target, Filter, Download, ExternalLink, ArrowUpRight, ArrowDownRight, Loader2, Info, Globe, BarChart2, Zap } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { seoService } from '../services/seoService';
import integrationService from '../services/integrationService';
import { toast } from '../store/uiStore';
import MetricCard from '../components/ui/MetricCard';
import ExportButton from '../components/ui/ExportButton';
import EmptyState from '../components/ui/EmptyState';

/**
 * AutoSEO AI Platform — Organic Rankings
 * =====================================
 * Deep dive into keyword positions, search volume, and traffic share.
 */
const OrganicRankingsPage: React.FC = () => {
  const activeDomain = useProjectStore((state) => state.activeDomain);
  const currentProject = useProjectStore((state) => state.currentProject);
  const activeProjectId = currentProject?._id;
  const [domainInput, setDomainInput] = useState(activeDomain || '');
  const [loading, setLoading] = useState(false);
  const [rankings, setRankings] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSimulated, setIsSimulated] = useState(false);

  const fetchRankings = async (targetDomain: string) => {
    if (!targetDomain) return;
    
    // Normalize domain
    const cleanDomain = targetDomain.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0];
    const isOwnDomain = cleanDomain.toLowerCase() === (activeDomain || '').toLowerCase();
    
    setLoading(true);
    setRankings([]);
    setIsSimulated(false);
    toast.info('Analyzing Rankings', `Fetching keyword visibility for ${cleanDomain}...`);
    
    try {
      let gscData: any = null;
      let usedGSC = false;
      
      if (isOwnDomain && activeProjectId) {
        try {
          const integrations = await integrationService.getIntegrations(activeProjectId);
          const hasGSC = integrations.some((i: any) => i.type === 'google_search_console' && i.status !== 'error');
          
          if (hasGSC) {
             gscData = await integrationService.getGSCPerformance(activeProjectId);
             if (gscData && gscData.success) {
               usedGSC = true;
             }
          }
        } catch (e) {
          console.error("Failed to fetch GSC integration status", e);
        }
      }

      if (usedGSC) {
        const normalizedRankings = (gscData.top_keywords || []).map((k: any) => ({
          keyword: k.keyword,
          pos: k.position,
          volume: k.impressions,
          traffic: k.clicks,
          difficulty: null,
          change: 0
        }));
        
        setRankings(normalizedRankings);
        setIsSimulated(false);
        setStats({
          totalKeywords: normalizedRankings.length || 0,
          estTraffic: gscData.total_clicks || 0,
          trafficCost: 0,
          top3: normalizedRankings.filter((k: any) => k.pos <= 3).length
        });
        toast.success('Live GSC Data Fetched', `Displaying real performance from Search Console.`);
      } else {
        const data = await seoService.getDomainOverview(cleanDomain);
        
        setRankings(data.top_keywords || []);
        setIsSimulated(data.data_source === 'dummy' || data.simulated === true);
        
        setStats({
          totalKeywords: data.organic_keywords || 0,
          estTraffic: data.organic_traffic || 0,
          trafficCost: data.traffic_cost || (data.organic_traffic ? Math.round(data.organic_traffic * 1.2) : 0),
          top3: (data.top_keywords || []).filter((k: any) => k.pos <= 3).length
        });
        toast.success('Analysis Complete', `Found ${data.top_keywords?.length || 0} top ranking keywords.`);
      }
    } catch (err: any) {
      toast.error('Analysis Failed', 'Could not retrieve ranking data for this domain.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeDomain && !rankings.length && !loading) {
      setDomainInput(activeDomain);
      fetchRankings(activeDomain);
    }
  }, [activeDomain]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRankings(domainInput);
  };

  const handleConnectGSC = () => {
    window.location.href = '/settings'; // Or trigger GSC flow directly if we had the service method ready
  };

  const filteredRankings = rankings.filter(k => 
    k.keyword.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isOwnDomain = domainInput.toLowerCase().includes(activeDomain?.toLowerCase() || '---');

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 'var(--space-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '8px' }}>
            Organic <span className="text-gradient">Rankings</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
            Analyze search performance and keyword positions for <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{domainInput || activeDomain}</span>.
          </p>
        </div>
        {rankings.length > 0 && (
          <ExportButton 
            data={rankings} 
            filename={`organic_rankings_${domainInput}`}
            columns={[
              { key: 'keyword', label: 'Keyword' },
              { key: 'pos', label: 'Position' },
              { key: 'volume', label: 'Volume' },
              { key: 'difficulty', label: 'Difficulty' },
              { key: 'traffic', label: 'Traffic' }
            ]}
          />
        )}
      </div>

      {isSimulated && (
        <div className="card glass-premium" style={{ marginBottom: 'var(--space-xl)', padding: '24px', border: '1px solid rgba(255, 184, 0, 0.3)', background: 'linear-gradient(to right, rgba(255, 184, 0, 0.05), transparent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255, 184, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)' }}>
              <Info size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--warning)', marginBottom: '4px' }}>Simulated Data Mode</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                You are viewing estimated metrics based on public search signals. For real-time, accurate performance data from your own site, connect Google Search Console.
              </p>
            </div>
            {isOwnDomain && (
              <button onClick={handleConnectGSC} className="btn btn-primary" style={{ background: 'var(--warning)', color: '#000', border: 'none' }}>
                <Zap size={16} /> Connect Search Console
              </button>
            )}
          </div>
        </div>
      )}

      <div className="card glass" style={{ marginBottom: 'var(--space-xl)', padding: '16px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 'var(--space-md)' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Globe size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Analyze another domain (e.g. competitor.com)" 
              style={{ paddingLeft: '48px', height: '48px', fontSize: '1.05rem' }}
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              disabled={loading}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading || !domainInput} style={{ padding: '0 32px' }}>
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Analyze Rankings'}
          </button>
        </form>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div className="premium-gradient animate-pulse" style={{ width: '80px', height: '80px', borderRadius: '24px', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <TrendingUp size={40} className="animate-bounce" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Scanning Search Engine Results...</h2>
          <p style={{ color: 'var(--text-muted)' }}>Retrieving positions for thousands of keywords</p>
        </div>
      ) : rankings.length > 0 ? (
        <div className="animate-slide-up">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
            <MetricCard title="Total Keywords" value={stats?.totalKeywords?.toLocaleString()} icon={Search} trend="up" change={5} />
            <MetricCard title="Est. Traffic" value={stats?.estTraffic?.toLocaleString()} icon={BarChart2} trend="up" change={12} />
            <MetricCard title="Traffic Value" value={`$${stats?.trafficCost?.toLocaleString()}`} icon={Target} trend="up" change={8} />
            <MetricCard title="Top 3 Positions" value={stats?.top3?.toString()} icon={ArrowUpRight} trend="up" change={2} />
          </div>

          <div className="card glass" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Keyword Performance Matrix</h3>
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
                <button className="btn btn-secondary" style={{ padding: '0 16px' }}><Filter size={16} /></button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.01)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '16px 24px' }}>Keyword</th>
                    <th style={{ padding: '16px 24px' }}>Position</th>
                    <th style={{ padding: '16px 24px' }}>Search Volume</th>
                    <th style={{ padding: '16px 24px' }}>Difficulty</th>
                    <th style={{ padding: '16px 24px' }}>Traffic Share</th>
                    <th style={{ padding: '16px 24px' }}>Landing Page</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRankings.map((kw, i) => (
                    <tr key={i} className="table-row-hover" style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{kw.keyword}</div>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ 
                            fontSize: '1.1rem',
                            fontWeight: 800, 
                            color: kw.pos <= 3 ? 'var(--success)' : kw.pos <= 10 ? 'var(--warning)' : 'inherit' 
                          }}>#{kw.pos}</span>
                          {kw.pos <= 3 && <Zap size={14} className="text-premium animate-pulse" />}
                        </div>
                      </td>
                      <td style={{ padding: '20px 24px', fontWeight: 600 }}>{(kw.volume || 0).toLocaleString()}</td>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '4px', background: 'var(--bg-main)', borderRadius: '2px', minWidth: '40px' }}>
                            <div style={{ height: '100%', width: `${kw.difficulty || 0}%`, background: (kw.difficulty || 0) > 60 ? 'var(--danger)' : 'var(--success)' }} />
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{kw.difficulty || 0}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
                          {(kw.traffic || 0).toLocaleString()} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>visits/mo</span>
                        </div>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <a href={`https://${domainInput}${kw.url || '/'}`} target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', textDecoration: 'none' }}>
                          {kw.url || '/'} <ExternalLink size={12} />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState 
          icon={TrendingUp} 
          title="Analyze Organic Visibility" 
          description="Enter a domain above to see exactly which keywords they rank for, their monthly search volume, and estimated traffic."
          action={<button className="btn btn-secondary" onClick={() => { setDomainInput('apple.com'); fetchRankings('apple.com'); }}>Try apple.com</button>}
        />
      )}
    </div>
  );
};

export default OrganicRankingsPage;
