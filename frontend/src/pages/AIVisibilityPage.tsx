import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Brain, Cpu, MessageSquare, Search, ShieldCheck, Sparkles, Zap, Loader2, BarChart2, MessageCircle, ArrowRight, ExternalLink } from 'lucide-react';
import MetricCard from '../components/ui/MetricCard';
import EmptyState from '../components/ui/EmptyState';
import { seoService } from '../services/seoService';
import { useProjectStore } from '../store/projectStore';
import { toast } from '../store/uiStore';

/**
 * AutoSEO AI Platform — AI Visibility Engine
 * =========================================
 * Track brand citations and sentiment across AI Search Engines (Perplexity, Gemini, etc.)
 */
const AIVisibilityPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const currentProject = useProjectStore((state) => state.currentProject);
  const activeDomain = useProjectStore((state) => state.activeDomain);

  const fetchReport = useCallback(async (force: boolean = false) => {
    if (!currentProject || !activeDomain) {
      setLoading(false);
      return;
    }
    
    if (force) {
      setLoading(true);
      toast.info('Deep Analysis Started', 'Scanning AI indices for brand mentions...');
    }
    
    try {
      const data = await seoService.getAIVisibility(
        currentProject._id, 
        currentProject.name || activeDomain.split('.')[0], 
        activeDomain,
        force
      );
      setReport(data);
      if (force) toast.success('Analysis Complete', 'Brand visibility data has been updated.');
    } catch (err) {
      toast.error('Analysis Failed', 'Could not reach the AI visibility engine.');
    } finally {
      setLoading(false);
    }
  }, [currentProject, activeDomain]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleRefresh = () => fetchReport(true);

  if (loading && !report) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '24px' }}>
        <div style={{ position: 'relative' }}>
          <Loader2 className="animate-spin" size={48} color="var(--primary)" />
          <Brain size={24} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--primary)' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>AI Visibility Engine</h3>
          <p style={{ color: 'var(--text-muted)' }}>Scanning neural indices for brand references...</p>
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <EmptyState
        icon={Brain}
        title="No Project Selected"
        description="Select a project to analyze its brand visibility in AI-generated content."
        action={<Link to="/projects" className="btn btn-primary">Go to Projects</Link>}
      />
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 'var(--space-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '8px' }}>
            AI Visibility <span className="text-gradient">Engine</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
            Monitor how LLMs and AI Search Engines cite your brand and products.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleRefresh} disabled={loading} style={{ background: 'var(--premium-gradient)' }}>
          {loading ? <Loader2 className="animate-spin" size={18} /> : <><Zap size={18} style={{ marginRight: '8px' }} /> Deep Brand Scan</>}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
        <MetricCard title="Brand Authority Score" value={`${report?.overall_score || 0}/100`} icon={Zap} trend="up" change={5} />
        <MetricCard title="AI Sentiment" value={report?.sentiment || "Neutral"} icon={Sparkles} />
        <MetricCard title="Platform Coverage" value={`${report?.platforms?.length || 0} Engines`} icon={Cpu} />
        <MetricCard title="Citation Health" value="Healthy" icon={ShieldCheck} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)' }}>
        <div className="card-static">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Platform Breakdown</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Citation Share</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(report?.platforms || []).length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>No platform data available.</p>
            ) : (
              report.platforms.map((p: any, i: number) => (
                <div key={i} className="list-item-hover" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', background: 'var(--bg-main)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Cpu size={20} style={{ color: 'var(--primary)' }} />
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, display: 'block' }}>{p.name}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.mentions} Citations found</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      padding: '2px 10px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 800,
                      background: p.sentiment === 'positive' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                      color: p.sentiment === 'positive' ? 'var(--success)' : 'var(--primary)',
                      textTransform: 'uppercase', marginBottom: '4px'
                    }}>
                      {p.sentiment}
                    </div>
                    <div style={{ width: '60px', height: '4px', background: 'var(--bg-main)', borderRadius: '2px' }}>
                      <div style={{ height: '100%', width: `${(p.mentions / (report.platforms.reduce((a:any,b:any)=>a+b.mentions,0)||1))*100}%`, background: 'var(--primary)', borderRadius: '2px' }}></div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Neural Snippets</h3>
            <div style={{ display: 'flex', gap: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>LIVE</span>
            </div>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '24px' }}>How AI agents are describing your brand to users.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {(report?.recent_mentions || []).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                <MessageCircle size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <p>No specific snippets captured yet.</p>
              </div>
            ) : (
              report.recent_mentions.map((m: any, i: number) => (
                <div key={i} style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px solid var(--border)', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>{m.platform}</span>
                      <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--text-muted)' }}></span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Query: "{m.query}"</span>
                    </div>
                    <ExternalLink size={12} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
                  </div>
                  <p style={{ fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--text-main)', lineHeight: '1.6', position: 'relative' }}>
                    <span style={{ fontSize: '1.5rem', position: 'absolute', left: '-12px', top: '-10px', opacity: 0.2 }}>"</span>
                    {m.snippet}
                    <span style={{ fontSize: '1.5rem', position: 'absolute', right: '-4px', bottom: '-20px', opacity: 0.2 }}>"</span>
                  </p>
                </div>
              ))
            )}
          </div>
          <button className="btn btn-secondary" style={{ width: '100%', marginTop: '24px' }}>
            View All Platform Citations <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIVisibilityPage;
