import React, { useState } from 'react';
import { Search, Layers, Zap, Info, ArrowRight, TrendingUp, Loader2, Download, Globe, Target, Plus, Minus, Filter } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { seoService } from '../services/seoService';
import { toast } from '../store/uiStore';
import ExportButton from '../components/ui/ExportButton';
import EmptyState from '../components/ui/EmptyState';

/**
 * AutoSEO AI Platform — Keyword Gap Analysis
 * =========================================
 * Multi-domain comparison to identify ranking opportunities.
 */
const KeywordGapPage: React.FC = () => {
  const activeDomain = useProjectStore((state) => state.activeDomain);
  const [primary, setPrimary] = useState(activeDomain || '');
  const [competitors, setCompetitors] = useState(['', '']);
  const [loading, setLoading] = useState(false);
  const [gapData, setGapData] = useState<any>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primary || competitors.some(c => !c.trim())) {
      toast.error('Missing Domains', 'Please enter your domain and at least two competitors.');
      return;
    }
    
    setLoading(true);
    setGapData(null);
    toast.info('Analyzing Keyword Gaps', `Comparing ${primary} against ${competitors.join(', ')}...`);

    try {
      const data = await seoService.getKeywordGap(primary, competitors);
      setGapData(data);
      toast.success('Analysis Complete', `Identified ${data.missing_count || 0} unique ranking opportunities.`);
    } catch (err: any) {
      toast.error('Analysis Failed', err.response?.data?.detail || 'Keyword gap analysis encountered an error.');
    } finally {
      setLoading(false);
    }
  };

  const addCompetitor = () => {
    if (competitors.length < 4) {
      setCompetitors([...competitors, '']);
    } else {
      toast.info('Limit Reached', 'You can compare up to 4 competitors at once.');
    }
  };

  const removeCompetitor = (index: number) => {
    setCompetitors(competitors.filter((_, i) => i !== index));
  };

  const updateCompetitor = (index: number, value: string) => {
    const newComp = [...competitors];
    newComp[index] = value;
    setCompetitors(newComp);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 'var(--space-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '8px' }}>
            Keyword <span className="text-gradient">Gap Analysis</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
            Multi-domain comparison to find keywords your competitors rank for that you don't.
          </p>
        </div>
        {gapData && (
          <ExportButton 
            data={gapData.gap_keywords} 
            filename={`keyword_gap_${primary}`}
            columns={[
              { key: 'keyword', label: 'Keyword' },
              { key: 'primary_rank', label: 'Your Rank' },
              { key: 'competitor_rank', label: 'Best Comp. Rank' },
              { key: 'volume', label: 'Search Volume' },
              { key: 'difficulty', label: 'Difficulty' }
            ]}
          />
        )}
      </div>

      <div className="card glass" style={{ marginBottom: 'var(--space-xl)', padding: '24px' }}>
        <form onSubmit={handleSearch}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', display: 'block' }}>Primary Domain</label>
              <div style={{ position: 'relative' }}>
                <Globe size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
                <input 
                  className="input-field" 
                  value={primary} 
                  onChange={(e) => setPrimary(e.target.value)} 
                  placeholder="yourdomain.com"
                  style={{ paddingLeft: '36px', borderColor: 'var(--primary-soft)' }}
                />
              </div>
            </div>
            {competitors.map((c, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Competitor {i+1}</label>
                  {competitors.length > 1 && (
                    <button type="button" onClick={() => removeCompetitor(i)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 0 }}>
                      <Minus size={14} />
                    </button>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <Target size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    className="input-field" 
                    value={c} 
                    onChange={(e) => updateCompetitor(i, e.target.value)} 
                    placeholder="competitor.com"
                    style={{ paddingLeft: '36px' }}
                  />
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button 
                type="button" 
                onClick={addCompetitor} 
                className="btn btn-secondary" 
                style={{ width: '100%', height: '44px', borderStyle: 'dashed', borderColor: 'var(--border)' }}
              >
                <Plus size={18} style={{ marginRight: '8px' }} /> Add Competitor
              </button>
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', height: '52px', fontSize: '1.1rem' }}>
            {loading ? <Loader2 className="animate-spin" size={24} /> : 'Compare Keyword Rankings'}
          </button>
        </form>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div className="premium-gradient animate-pulse" style={{ width: '80px', height: '80px', borderRadius: '24px', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <Layers size={40} className="animate-bounce" />
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Intersecting SERP Data...</h3>
          <p style={{ color: 'var(--text-muted)' }}>Calculating ranking gaps across {competitors.length + 1} domains</p>
        </div>
      ) : gapData ? (
        <div className="animate-slide-up">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
            <div className="card glass" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ width: '56px', height: '56px', background: 'var(--primary-soft)', color: 'var(--primary)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={28} />
              </div>
              <div>
                <h4 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 800 }}>Shared Keywords</h4>
                <span style={{ fontSize: '2rem', fontWeight: 800 }}>{gapData.shared_count || 0}</span>
              </div>
            </div>
            <div className="card glass" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ width: '56px', height: '56px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={28} />
              </div>
              <div>
                <h4 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 800 }}>Missing Opportunities</h4>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success)' }}>{gapData.missing_count || 0}</span>
              </div>
            </div>
          </div>

          <div className="card glass" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Keyword Gap Matrix</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Untapped</span>
                <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>Underperforming</span>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '16px 24px' }}>Keyword</th>
                    <th style={{ padding: '16px 24px' }}>{primary} (You)</th>
                    <th style={{ padding: '16px 24px' }}>Competitor Pos.</th>
                    <th style={{ padding: '16px 24px' }}>Volume</th>
                    <th style={{ padding: '16px 24px' }}>Difficulty</th>
                  </tr>
                </thead>
                <tbody>
                  {(gapData.gap_keywords || []).map((row: any, i: number) => (
                    <tr key={i} className="table-row-hover" style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ fontWeight: 700 }}>{row.keyword}</div>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <span style={{ 
                          padding: '4px 10px', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 700,
                          background: row.primary_rank ? 'rgba(255,255,255,0.05)' : 'rgba(239, 68, 68, 0.05)',
                          color: row.primary_rank ? 'var(--text)' : 'var(--danger)'
                        }}>
                          {row.primary_rank || 'Not Ranking'}
                        </span>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>#{row.competitor_rank}</span>
                          <div style={{ width: '40px', height: '4px', background: 'var(--bg-main)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.max(5, 100 - row.competitor_rank)}%`, background: 'var(--primary)' }} />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '20px 24px', fontWeight: 600 }}>{row.volume?.toLocaleString()}</td>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                           <span style={{ 
                            fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 800,
                            background: row.difficulty > 70 ? 'rgba(239, 68, 68, 0.1)' : row.difficulty > 40 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            color: row.difficulty > 70 ? 'var(--danger)' : row.difficulty > 40 ? 'var(--warning)' : 'var(--success)',
                          }}>{row.difficulty}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(gapData.gap_keywords || []).length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: '48px', textAlign: 'center' }}>
                         <EmptyState 
                           icon={Layers} 
                           title="No Keyword Gaps" 
                           description="Your domain and competitors have nearly identical keyword profiles."
                         />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Layers}
          title="Identify Ranking Gaps"
          description="Find out which high-volume keywords your competitors are ranking for that you're missing out on."
          action={
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={() => { setCompetitors(['semrush.com', 'ahrefs.com']); }}>Load Example</button>
            </div>
          }
        />
      )}
    </div>
  );
};

export default KeywordGapPage;
