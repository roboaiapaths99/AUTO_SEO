import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Zap, BarChart3, TrendingUp, Info, Plus, Target, MousePointer2, Loader2, Download, Filter, X, ChevronRight, BarChart2 } from 'lucide-react';
import MetricCard from '../components/ui/MetricCard';
import ExportButton from '../components/ui/ExportButton';
import EmptyState from '../components/ui/EmptyState';
import { seoService } from '../services/seoService';
import { useProjectStore } from '../store/projectStore';
import { toast } from '../store/uiStore';

/**
 * AutoSEO AI Platform — Keyword Magic Tool
 * ========================================
 * Generate keyword variations, analysis, and clusters.
 */
const KeywordsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeDomain = useProjectStore((state) => state.activeDomain);
  const currentProject = useProjectStore((state) => state.currentProject);

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchKeywords = async (target: string) => {
    if (!target) return;
    setLoading(true);
    setError(null);
    setSearchParams({ q: target });
    toast.info('Analyzing Keywords', `Generating Variations for "${target}"...`);
    
    try {
      const data = await seoService.keywordMagic(target);
      setResults(data || []);
      if (data?.length > 0) {
        toast.success('Search Complete', `Discovered ${data.length} keyword variations.`);
      } else {
        toast.info('No Variations Found', 'Try a broader seed keyword.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Keyword analysis failed.';
      setError(msg);
      toast.error('Analysis Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = searchParams.get('q');
    if (q && results.length === 0 && !loading) {
      setQuery(q);
      fetchKeywords(q);
    }
  }, [searchParams]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    await fetchKeywords(query.trim());
  };

  const handleAddTracking = async (keyword: string) => {
    if (!currentProject || !activeDomain) {
      toast.error('Project Required', 'Select a project to enable tracking.');
      return;
    }
    try {
      await seoService.trackKeywords(currentProject._id, activeDomain, [keyword]);
      toast.success('Added to Tracker', `Now monitoring positions for "${keyword}"`);
    } catch (err) {
      toast.error('Tracking Failed', 'Could not add keyword to monitor.');
    }
  };

  const totalVolume = results.reduce((acc, curr) => acc + (curr.volume || 0), 0);
  const avgDifficulty = results.length > 0 
    ? Math.round(results.reduce((acc, curr) => acc + (curr.difficulty || 0), 0) / results.length)
    : 0;
  const avgCpc = results.length > 0
    ? (results.reduce((acc, curr) => acc + (curr.cpc || 0), 0) / results.length).toFixed(2)
    : '0.00';

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 'var(--space-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '8px' }}>
            Keyword <span className="text-gradient">Magic Tool</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
            Generate profitable keyword variations and search intent data in seconds.
          </p>
        </div>
        {results.length > 0 && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <ExportButton
              data={results}
              filename={`keyword_variations_${query}`}
              columns={[
                { key: 'keyword', label: 'Keyword' },
                { key: 'volume', label: 'Volume' },
                { key: 'difficulty', label: 'Difficulty %' },
                { key: 'intent', label: 'Intent' },
                { key: 'cpc', label: 'CPC' }
              ]}
            />
            <button className="btn btn-secondary" onClick={() => { setResults([]); setQuery(''); setSearchParams({}); }}>
              <X size={18} /> Clear
            </button>
          </div>
        )}
      </div>

      <div className="card glass" style={{ marginBottom: 'var(--space-xl)', padding: '24px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 'var(--space-md)' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={22} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Enter seed keyword (e.g. 'electric cars')" 
              style={{ paddingLeft: '54px', fontSize: '1.1rem', height: '54px', borderRadius: '14px' }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={loading}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading || !query.trim()} style={{ padding: '0 40px', borderRadius: '14px' }}>
            {loading ? <Loader2 size={24} className="animate-spin" /> : 'Discover Variations'}
          </button>
        </form>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <div className="premium-gradient animate-pulse" style={{ width: '80px', height: '80px', borderRadius: '24px', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <Zap size={40} className="animate-bounce" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>AI Keyword Engine Active...</h2>
          <p style={{ color: 'var(--text-muted)' }}>Scanning search landscape for high-intent opportunities</p>
        </div>
      ) : results.length > 0 ? (
        <div className="animate-slide-up" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-xl)' }}>
          <div className="card glass" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Broad Match Variations</h3>
              <div className="badge" style={{ background: 'var(--primary-soft)', color: 'var(--primary)', fontWeight: 800 }}>{results.length} Suggestions</div>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    <th style={{ padding: '16px 24px' }}>Keyword</th>
                    <th style={{ padding: '16px 24px' }}>Intent</th>
                    <th style={{ padding: '16px 24px' }}>Volume</th>
                    <th style={{ padding: '16px 24px' }}>KD %</th>
                    <th style={{ padding: '16px 24px' }}>CPC (USD)</th>
                    <th style={{ padding: '16px 24px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((kw, i) => (
                    <tr key={i} className="table-row-hover" style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{kw.keyword}</div>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <span style={{ 
                          padding: '4px 10px', borderRadius: '6px', 
                          background: kw.intent === 'Transactional' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                          color: kw.intent === 'Transactional' ? 'var(--success)' : 'var(--primary)', 
                          fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase'
                        }}>{kw.intent || 'Informational'}</span>
                      </td>
                      <td style={{ padding: '20px 24px', fontWeight: 700 }}>{(kw.volume || 0).toLocaleString()}</td>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '4px', background: 'var(--bg-main)', borderRadius: '2px', minWidth: '40px' }}>
                            <div style={{ 
                              height: '100%', width: `${kw.difficulty || 0}%`, 
                              background: (kw.difficulty || 0) > 70 ? 'var(--danger)' : (kw.difficulty || 0) > 40 ? 'var(--warning)' : 'var(--success)' 
                            }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>{kw.difficulty || 0}</span>
                        </div>
                      </td>
                      <td style={{ padding: '20px 24px', color: 'var(--text-muted)', fontWeight: 600 }}>${(kw.cpc || 0).toFixed(2)}</td>
                      <td style={{ padding: '20px 24px' }}>
                        <button 
                          className="btn-icon" 
                          onClick={() => handleAddTracking(kw.keyword)}
                          style={{ color: 'var(--primary)', background: 'var(--primary-soft)' }}
                        >
                          <Plus size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            <MetricCard title="Market Potential" value={totalVolume.toLocaleString()} icon={TrendingUp} trend="up" change={22} />
            <MetricCard title="Niche Difficulty" value={`${avgDifficulty}%`} icon={Target} />
            <MetricCard title="Avg. Ad Cost" value={`$${avgCpc}`} icon={MousePointer2} />
            
            <div className="card glass premium-border" style={{ position: 'relative', overflow: 'hidden' }}>
              <div className="premium-gradient-bg" style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%' }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <Zap size={24} className="text-premium" />
                <h4 style={{ fontWeight: 800 }}>Strategy Builder</h4>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '24px' }}>
                Group these keywords into <strong>topical pillars</strong> and generate an AI-powered content roadmap.
              </p>
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 800 }}
                onClick={() => navigate(`/keywords/strategy?q=${query}`)}
              >
                Create Strategy <ChevronRight size={18} />
              </button>
            </div>

            <div className="card glass" style={{ padding: '20px' }}>
               <h4 style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <BarChart2 size={16} className="text-primary" /> Volume Distribution
               </h4>
               <div style={{ height: '6px', background: 'var(--bg-main)', borderRadius: '3px', marginBottom: '8px', overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: '40%', height: '100%', background: 'var(--primary)' }}></div>
                  <div style={{ width: '30%', height: '100%', background: 'var(--accent)' }}></div>
                  <div style={{ width: '30%', height: '100%', background: 'var(--success)' }}></div>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  <span>High</span>
                  <span>Med</span>
                  <span>Low</span>
               </div>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Search}
          title="Keyword Research Engine"
          description="Enter a broad keyword, product, or competitor topic to unlock thousands of variations and search intent data."
          action={
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {['AI tools', 'Digital Marketing', 'Crypto', 'Health & Fitness'].map(s => (
                <button key={s} className="btn btn-secondary" style={{ borderRadius: '100px' }} onClick={() => { setQuery(s); fetchKeywords(s); }}>
                  {s}
                </button>
              ))}
            </div>
          }
        />
      )}
    </div>
  );
};

export default KeywordsPage;
