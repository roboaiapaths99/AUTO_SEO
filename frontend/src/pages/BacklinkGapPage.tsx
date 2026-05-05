import React, { useState } from 'react';
import { Search, Link2, Zap, Globe, ShieldCheck, Loader2, Download, Filter, ArrowRight, Info, Target, ExternalLink } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { seoService } from '../services/seoService';
import { toast } from '../store/uiStore';
import ExportButton from '../components/ui/ExportButton';
import EmptyState from '../components/ui/EmptyState';

/**
 * AutoSEO AI Platform — Backlink Gap Analysis
 * ==========================================
 * Identifies sites that link to competitors but not to the target domain.
 */
const BacklinkGapPage: React.FC = () => {
  const activeDomain = useProjectStore((state) => state.activeDomain);
  const [primary, setPrimary] = useState(activeDomain || '');
  const [competitor, setCompetitor] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primary || !competitor) {
      toast.error('Missing Domains', 'Please enter both your domain and a competitor domain.');
      return;
    }
    
    setLoading(true);
    setResults([]);
    toast.info('Analyzing Gaps', `Comparing backlink profiles of ${primary} and ${competitor}...`);

    try {
      const data = await seoService.getBacklinkGap(primary, competitor);
      setResults(data);
      if (data.length > 0) {
        toast.success('Analysis Complete', `Found ${data.length} backlink opportunities.`);
      } else {
        toast.info('No Gaps Found', 'Your backlink profiles are very similar.');
      }
    } catch (err: any) {
      toast.error('Analysis Failed', err.response?.data?.detail || 'Could not perform backlink gap analysis.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 'var(--space-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '8px' }}>
            Backlink <span className="text-gradient">Gap Analysis</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
            Discover high-authority domains linking to your competitors that are missing from your profile.
          </p>
        </div>
        {results.length > 0 && (
          <ExportButton 
            data={results} 
            filename={`backlink_gap_${primary}_vs_${competitor}`}
            columns={[
              { key: 'domain', label: 'Referring Domain' },
              { key: 'dr', label: 'Domain Rating' },
              { key: 'comp_links', label: 'Competitor Links' },
              { key: 'your_links', label: 'Your Links' }
            ]}
          />
        )}
      </div>

      <div className="card glass" style={{ marginBottom: 'var(--space-xl)', padding: '24px' }}>
        <form onSubmit={handleCompare} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 'var(--space-lg)', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Globe size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              className="input-field" 
              placeholder="Your domain (e.g. mysite.com)" 
              style={{ paddingLeft: '44px' }}
              value={primary} 
              onChange={e => setPrimary(e.target.value)}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <Target size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              className="input-field" 
              placeholder="Competitor (e.g. competitor.com)" 
              style={{ paddingLeft: '44px' }}
              value={competitor} 
              onChange={e => setCompetitor(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ height: '48px', padding: '0 32px' }}>
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Compare Backlinks'}
          </button>
        </form>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div className="premium-gradient animate-pulse" style={{ width: '80px', height: '80px', borderRadius: '24px', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <Link2 size={40} className="animate-bounce" />
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Mapping Backlink Profiles...</h3>
          <p style={{ color: 'var(--text-muted)' }}>Identifying unique referring domains for {competitor}</p>
        </div>
      ) : results.length > 0 ? (
        <div className="card glass" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Referring Domains Gap</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Showing {results.length} untapped link prospects</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '16px 24px' }}>Referring Domain</th>
                  <th style={{ padding: '16px 24px' }}>Domain Rating</th>
                  <th style={{ padding: '16px 24px' }}>Comp. Backlinks</th>
                  <th style={{ padding: '16px 24px' }}>Your Backlinks</th>
                  <th style={{ padding: '16px 24px' }}>Opportunity</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row, i) => (
                  <tr key={i} className="table-row-hover" style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', background: 'var(--bg-main)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Globe size={16} className="text-premium" />
                        </div>
                        <span style={{ fontWeight: 600 }}>{row.domain}</span>
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', background: 'var(--bg-main)', borderRadius: '3px', overflow: 'hidden', minWidth: '60px' }}>
                          <div style={{ height: '100%', width: `${row.dr}%`, background: 'var(--primary)' }} />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{row.dr}</span>
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px', fontWeight: 700 }}>{row.comp_links || row.compLinks}</td>
                    <td style={{ padding: '20px 24px' }}>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600,
                        background: (row.your_links || row.yourLinks) > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                        color: (row.your_links || row.yourLinks) > 0 ? 'var(--success)' : 'var(--text-muted)'
                      }}>
                        {row.your_links || row.yourLinks || 0} links
                      </span>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => toast.success('Added to Outreach', `Added ${row.domain} to your outreach campaign.`)}
                        style={{ padding: '6px 14px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        Prospect <ArrowRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Link2}
          title="Find Untapped Link Opportunities"
          description="Enter your domain and a competitor to see which high-authority sites are linking to them but not to you."
          action={
            <div style={{ display: 'flex', gap: '12px' }}>
               <button className="btn btn-secondary" onClick={() => { setCompetitor('competitor.com'); }}>Select Competitor</button>
            </div>
          }
        />
      )}
    </div>
  );
};

export default BacklinkGapPage;
