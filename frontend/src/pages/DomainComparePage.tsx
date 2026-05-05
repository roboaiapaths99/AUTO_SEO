import React, { useState, useEffect } from 'react';
import { Layers, Plus, BarChart, TrendingUp, ShieldCheck, Loader2, Download, Zap, Users, Globe, ExternalLink, ArrowRight, Search, Info } from 'lucide-react';
import MetricCard from '../components/ui/MetricCard';
import ExportButton from '../components/ui/ExportButton';
import EmptyState from '../components/ui/EmptyState';
import { useProjectStore } from '../store/projectStore';
import { seoService } from '../services/seoService';
import { toast } from '../store/uiStore';

/**
 * AutoSEO AI Platform — Domain Comparison
 * =======================================
 * Side-by-side head-to-head analysis of two domains.
 */
const DomainComparePage: React.FC = () => {
  const activeDomain = useProjectStore((state) => state.activeDomain);
  const [domain1, setDomain1] = useState(activeDomain || '');
  const [domain2, setDomain2] = useState('');
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState<any>(null);

  useEffect(() => {
    if (activeDomain && !domain1) {
      setDomain1(activeDomain);
    }
  }, [activeDomain]);

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain1 || !domain2) {
      toast.error('Missing Domains', 'Please enter two domains to compare.');
      return;
    }
    
    setLoading(true);
    setComparison(null);
    toast.info('Comparing Domains', `Benchmarking ${domain1} against ${domain2}...`);
    
    try {
      const data = await seoService.compareTwoDomains(domain1, domain2);
      setComparison(data);
      toast.success('Comparison Complete', `Generated head-to-head report.`);
    } catch (err: any) {
      toast.error('Comparison Failed', 'Could not retrieve head-to-head metrics.');
    } finally {
      setLoading(false);
    }
  };

  const getExportData = () => {
    if (!comparison?.metrics) return [];
    return Object.entries(comparison.metrics).map(([key, val]: any) => ({
      metric: key.replace(/_/g, ' '),
      [`${domain1}`]: val.a,
      [`${domain2}`]: val.b,
      winner: val.a > val.b ? domain1 : domain2
    }));
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 'var(--space-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '8px' }}>
            Domain <span className="text-gradient">Battle</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
            Head-to-head comparison of authority, traffic, and visibility.
          </p>
        </div>
        {comparison && (
          <ExportButton 
            data={getExportData()} 
            filename={`comparison_${domain1}_vs_${domain2}`}
            columns={[
              { key: 'metric', label: 'Metric' },
              { key: domain1, label: domain1 },
              { key: domain2, label: domain2 },
              { key: 'winner', label: 'Winner' }
            ]}
          />
        )}
      </div>

      <div className="card glass" style={{ marginBottom: 'var(--space-xl)', padding: '24px' }}>
        <form onSubmit={handleCompare} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto', gap: 'var(--space-lg)', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
             <Globe size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
             <input 
              type="text" 
              className="input-field" 
              placeholder="Domain 1" 
              style={{ paddingLeft: '44px', height: '52px', fontSize: '1.05rem', borderColor: 'rgba(99, 102, 241, 0.2)' }}
              value={domain1}
              onChange={(e) => setDomain1(e.target.value)}
            />
          </div>
          <div style={{ fontWeight: 800, color: 'var(--text-muted)', fontSize: '1.2rem', padding: '0 10px' }}>VS</div>
          <div style={{ position: 'relative' }}>
             <Globe size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent)' }} />
             <input 
              type="text" 
              className="input-field" 
              placeholder="Domain 2" 
              style={{ paddingLeft: '44px', height: '52px', fontSize: '1.05rem', borderColor: 'rgba(168, 85, 247, 0.2)' }}
              value={domain2}
              onChange={(e) => setDomain2(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: '52px', padding: '0 32px' }}>
            {loading ? <Loader2 className="animate-spin" size={24} /> : 'Fight'}
          </button>
        </form>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '40px', marginBottom: '40px' }}>
             <Globe size={60} className="text-premium animate-pulse" />
             <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-muted)' }}>VS</div>
             <Globe size={60} className="text-accent animate-pulse" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Benchmarking Metrics...</h2>
          <p style={{ color: 'var(--text-muted)' }}>Cross-referencing domain authority and organic footprint</p>
        </div>
      ) : comparison ? (
        <div className="animate-slide-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 'var(--space-xl)' }}>
          <div className="card glass">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Head-to-Head</h3>
              <div style={{ display: 'flex', gap: '16px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)' }}></div>
                  <span>{domain1}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent)' }}></div>
                  <span>{domain2}</span>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {Object.entries(comparison.metrics || {}).map(([key, val]: any) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>{key.replace(/_/g, ' ')}</span>
                    <div style={{ display: 'flex', gap: '12px', fontWeight: 800 }}>
                       <span style={{ color: val.a > val.b ? 'var(--primary)' : 'inherit' }}>{val.a.toLocaleString()}</span>
                       <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>/</span>
                       <span style={{ color: val.b > val.a ? 'var(--accent)' : 'inherit' }}>{val.b.toLocaleString()}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', height: '10px', borderRadius: '5px', overflow: 'hidden', background: 'var(--bg-main)' }}>
                    <div style={{ 
                      width: `${(val.a / (Math.max(val.a + val.b, 1))) * 100}%`, 
                      background: 'var(--primary)',
                      transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}></div>
                    <div style={{ 
                      width: `${(val.b / (Math.max(val.a + val.b, 1))) * 100}%`, 
                      background: 'var(--accent)',
                      transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card glass" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '32px' }}>Market Overlap</h3>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', position: 'relative' }}>
               {/* Simplified Venn visualization */}
               <div style={{ 
                 width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', border: '2px solid var(--primary)',
                 position: 'absolute', left: 'calc(50% - 120px)', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
               }}>
                 <span style={{ fontWeight: 800, fontSize: '0.75rem', textAlign: 'center' }}>{domain1}</span>
               </div>
               <div style={{ 
                 width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.15)', border: '2px solid var(--accent)',
                 position: 'absolute', right: 'calc(50% - 120px)', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
               }}>
                 <span style={{ fontWeight: 800, fontSize: '0.75rem', textAlign: 'center' }}>{domain2}</span>
               </div>
               <div style={{ 
                 zIndex: 10, background: 'var(--bg-card)', padding: '16px 32px', borderRadius: '20px', border: '1px solid var(--border)', 
                 fontWeight: 900, color: 'var(--text-main)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', textAlign: 'center'
               }}>
                 <div style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>{comparison.overlap?.common?.toLocaleString() || 0}</div>
                 <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '4px' }}>Shared Keywords</div>
               </div>
            </div>
            <div style={{ marginTop: 'auto', padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
               <Info size={24} className="text-premium" />
               <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                 The overlap indicates the shared organic footprint. A larger overlap suggests direct competition in the same search niche.
               </p>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Layers}
          title="Compare Dominance"
          description="Select any two domains to see a head-to-head breakdown of their search performance and keyword overlap."
          action={
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={() => { setDomain1('apple.com'); setDomain2('samsung.com'); }}>Apple vs Samsung</button>
              <button className="btn btn-secondary" onClick={() => { setDomain1('nike.com'); setDomain2('adidas.com'); }}>Nike vs Adidas</button>
            </div>
          }
        />
      )}
    </div>
  );
};

export default DomainComparePage;
