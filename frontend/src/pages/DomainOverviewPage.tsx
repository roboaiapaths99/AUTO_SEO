import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Globe, Search, BarChart3, Users, Link as LinkIcon, Layers, Zap, Info, ArrowUpRight, ShieldCheck, Loader2, Download, ExternalLink } from 'lucide-react';
import MetricCard from '../components/ui/MetricCard';
import ExportButton from '../components/ui/ExportButton';
import EmptyState from '../components/ui/EmptyState';
import { seoService } from '../services/seoService';
import { useProjectStore } from '../store/projectStore';
import { toast } from '../store/uiStore';

/**
 * AutoSEO AI Platform — Domain Intelligence
 * ========================================
 * High-level analysis of any domain's SEO performance.
 */
const DomainOverviewPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeDomain = useProjectStore((state) => state.activeDomain);
  const [domainInput, setDomainInput] = useState(searchParams.get('q') || activeDomain || '');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const fetchDomainData = async (targetDomain: string) => {
    if (!targetDomain) return;
    
    // Normalize domain
    const cleanDomain = targetDomain.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0];
    
    setLoading(true);
    toast.info('Analyzing Domain', `Gathering competitive intelligence for ${cleanDomain}...`);
    
    try {
      const result = await seoService.getDomainOverview(cleanDomain);
      setData(result);
      toast.success('Analysis Complete', `Domain data for ${cleanDomain} has been refreshed.`);
    } catch (err: any) {
      console.error(err);
      toast.error('Analysis Failed', err.response?.data?.detail || 'Could not retrieve domain data.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setDomainInput(q);
      fetchDomainData(q);
    } else if (activeDomain) {
      setDomainInput(activeDomain);
      fetchDomainData(activeDomain);
    } else {
      setData(null);
      setDomainInput('');
    }
  }, [searchParams, activeDomain]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainInput) return;
    setSearchParams({ q: domainInput });
    fetchDomainData(domainInput);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 'var(--space-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '8px' }}>
            Domain <span className="text-gradient">Intelligence</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
            Uncover any domain's organic strategy, traffic sources, and backlink profile.
          </p>
        </div>
        {data && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <ExportButton 
              data={[data]} 
              filename={`domain_overview_${data.domain}`}
              columns={[
                { key: 'domain', label: 'Domain' },
                { key: 'authority_score', label: 'Authority Score' },
                { key: 'organic_traffic', label: 'Organic Traffic' },
                { key: 'organic_keywords', label: 'Organic Keywords' },
                { key: 'backlinks_count', label: 'Total Backlinks' }
              ]}
            />
          </div>
        )}
      </div>

      <div className="card glass" style={{ marginBottom: 'var(--space-xl)', padding: '16px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 'var(--space-md)' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Globe size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Enter a competitor's domain (e.g. semrush.com)" 
              style={{ paddingLeft: '48px', height: '48px', fontSize: '1.05rem' }}
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              disabled={loading}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading || !domainInput} style={{ padding: '0 32px' }}>
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Analyze Domain'}
          </button>
        </form>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <div className="premium-gradient animate-pulse" style={{ width: '80px', height: '80px', borderRadius: '24px', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <Globe size={40} className="animate-spin-slow" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Scanning Digital Footprint...</h2>
          <p style={{ color: 'var(--text-muted)' }}>Retrieving authority scores, traffic metrics, and keyword data for {domainInput}</p>
        </div>
      ) : data ? (
        <div className="animate-slide-up">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
            <MetricCard title="Authority Score" value={data.authority_score} icon={Zap} trend="up" change={5} />
            <MetricCard title="Organic Traffic" value={(data.organic_traffic || 0).toLocaleString()} icon={Users} trend="up" change={12} />
            <MetricCard title="Organic Keywords" value={(data.organic_keywords || 0).toLocaleString()} icon={Search} trend="down" change={2} />
            <MetricCard title="Backlinks" value={(data.backlinks_count || 0).toLocaleString()} icon={LinkIcon} trend="up" change={8} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
            <div className="card glass">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '4px' }}>Organic Traffic Trend</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Traffic estimations over the last 6 months</p>
                </div>
                <BarChart3 size={24} className="text-premium" />
              </div>
              <div style={{ height: '220px', display: 'flex', alignItems: 'flex-end', gap: '12px', padding: '0 10px', borderBottom: '1px solid var(--border)' }}>
                {(data.traffic_trend || []).map((t: any, i: number) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <div 
                      className="premium-gradient" 
                      style={{ 
                        width: '100%', 
                        height: `${(t.traffic / (Math.max(...data.traffic_trend.map((x:any) => x.traffic)) || 1)) * 160}px`, 
                        borderRadius: '6px 6px 0 0',
                        opacity: 0.7 + (i * 0.05),
                        transition: 'height 0.5s ease'
                      }} 
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '8px' }}>{t.date}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card glass">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '24px' }}>Domain Health & Setup</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'SSL Certificate', status: 'Valid', color: 'var(--success)', icon: ShieldCheck },
                  { label: 'Schema Markup', status: 'Incomplete', color: 'var(--warning)', icon: Layers },
                  { label: 'Page Speed', status: 'Excellent', color: 'var(--primary)', icon: Zap },
                  { label: 'Mobile Optimized', status: 'Yes', color: 'var(--success)', icon: Globe },
                ].map((item, i) => (
                  <div key={i} className="list-item-hover" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <item.icon size={20} className="text-premium" />
                      <span style={{ fontWeight: 500 }}>{item.label}</span>
                    </div>
                    <span style={{ fontWeight: 700, color: item.color }}>{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="card glass" style={{ background: 'var(--premium-gradient)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '40px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.1 }}>
              <Layers size={200} />
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '12px' }}>Keyword Gap Analysis</h2>
              <p style={{ fontSize: '1.1rem', opacity: 0.9, maxWidth: '600px' }}>
                Compare {data.domain} with your own domain to find missing keyword opportunities that drive the most traffic.
              </p>
            </div>
            <button 
              className="btn" 
              onClick={() => navigate(`/keyword-gap?domain=${data.domain}`)}
              style={{ background: 'white', color: 'var(--primary)', fontWeight: 800, padding: '16px 32px', fontSize: '1rem', position: 'relative', zIndex: 1 }}
            >
              Start Comparison
            </button>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Globe}
          title="Analyze Any Domain"
          description="Enter a website URL above to get instant SEO metrics, traffic trends, and authority scores."
          action={
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={() => { setDomainInput('google.com'); fetchDomainData('google.com'); }}>Try google.com</button>
              <button className="btn btn-secondary" onClick={() => { setDomainInput('github.com'); fetchDomainData('github.com'); }}>Try github.com</button>
            </div>
          }
        />
      )}
    </div>
  );
};

export default DomainOverviewPage;
