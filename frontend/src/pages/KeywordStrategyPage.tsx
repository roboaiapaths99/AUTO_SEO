import React, { useState, useEffect } from 'react';
import { Target, Zap, Sparkles, Layers, ArrowRight, CheckCircle2, Loader2, Search, BookOpen, TrendingUp, Info } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { seoService } from '../services/seoService';
import { toast } from '../store/uiStore';
import ExportButton from '../components/ui/ExportButton';
import EmptyState from '../components/ui/EmptyState';

/**
 * AutoSEO AI Platform — Keyword Strategy Builder
 * =============================================
 * Clusters keywords into semantic pillars and builds a content map.
 */
const KeywordStrategyPage: React.FC = () => {
  const activeDomain = useProjectStore((state) => state.activeDomain);
  const currentProject = useProjectStore((state) => state.currentProject);
  const activeProjectId = currentProject?._id;
  const [loading, setLoading] = useState(false);
  const [seedKeyword, setSeedKeyword] = useState('');
  const [strategy, setStrategy] = useState<any>(null);

  const generateStrategy = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeProjectId) {
      toast.error('No project active', 'Please select or add a project first.');
      return;
    }

    setLoading(true);
    toast.info('Building Strategy', 'AI is clustering keywords and mapping semantic relationships...');

    try {
      // 1. Get some seed keywords if not provided (e.g. from magic tool first)
      let keywordsToCluster = [seedKeyword];
      if (!seedKeyword) {
        // Fallback: search for top keywords related to the domain
        const magic = await seoService.keywordMagic(activeDomain || 'seo');
        keywordsToCluster = magic.slice(0, 10).map((k: any) => k.keyword);
      } else {
        const magic = await seoService.keywordMagic(seedKeyword);
        keywordsToCluster = magic.slice(0, 20).map((k: any) => k.keyword);
      }

      // 2. Generate the actual clustered strategy
      const result = await seoService.generateStrategy(activeProjectId, keywordsToCluster);
      setStrategy(result);
      toast.success('Strategy Ready', `Generated ${result.clusters?.length || 0} content pillars.`);
    } catch (error) {
      console.error('Strategy generation failed:', error);
      toast.error('Strategy Failed', 'Our AI encountered an error while mapping your keywords.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 'var(--space-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '8px' }}>
            Keyword <span className="text-gradient">Strategy Builder</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
            Let AI build a semantic content plan and keyword map for <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{activeDomain}</span>.
          </p>
        </div>
        {strategy && (
          <ExportButton 
            data={strategy.clusters} 
            filename={`strategy_${activeDomain}`}
            columns={[
              { key: 'topic', label: 'Cluster Topic' },
              { key: 'intent', label: 'Search Intent' },
              { key: 'total_volume', label: 'Total Volume' },
              { key: 'average_difficulty', label: 'Avg Difficulty' }
            ]}
          />
        )}
      </div>

      {!strategy ? (
        <div className="card glass" style={{ textAlign: 'center', padding: '64px', maxWidth: '800px', margin: '0 auto' }}>
          <div className="premium-gradient" style={{ width: '80px', height: '80px', borderRadius: '24px', margin: '0 auto 32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 20px 40px rgba(99, 102, 241, 0.3)' }}>
            <Sparkles size={40} />
          </div>
          <h2 style={{ fontSize: '2rem', marginBottom: '16px', fontWeight: 800 }}>Build your semantic map</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto 32px', fontSize: '1.1rem', lineHeight: '1.6' }}>
            Our AI will analyze your niche and cluster keywords into topical pillars to maximize your search authority and topical relevance.
          </p>
          
          <form onSubmit={generateStrategy} style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
            <div style={{ width: '100%', position: 'relative', maxWidth: '500px' }}>
              <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                className="input-field" 
                placeholder="Enter a seed keyword (e.g. 'Project Management')" 
                style={{ paddingLeft: '48px', height: '56px', fontSize: '1.1rem' }}
                value={seedKeyword}
                onChange={e => setSeedKeyword(e.target.value)}
              />
            </div>
            <button 
              className="btn btn-primary" 
              type="submit"
              disabled={loading} 
              style={{ padding: '16px 48px', background: 'var(--premium-gradient)', fontSize: '1.1rem', height: 'auto' }}
            >
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Loader2 className="animate-spin" size={20} />
                  <span>AI is thinking...</span>
                </div>
              ) : 'Generate Content Pillars'}
            </button>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Tip: Leave empty to auto-generate based on your domain.
            </p>
          </form>
        </div>
      ) : (
        <div className="animate-slide-up">
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-lg)' }}>
             {strategy.clusters.map((cluster: any, i: number) => (
               <div key={i} className="card glass hover-lift" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                     <div style={{ width: '40px', height: '40px', background: 'var(--primary-soft)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                       <Layers size={20} />
                     </div>
                     <div>
                       <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{cluster.topic}</h3>
                       <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                         {cluster.intent || 'Informational'} Pillar
                       </span>
                     </div>
                   </div>
                 </div>

                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                   {cluster.keywords.slice(0, 5).map((kw: string, j: number) => (
                     <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                       <CheckCircle2 size={16} color="var(--success)" />
                       <span style={{ fontWeight: 500 }}>{kw}</span>
                     </div>
                   ))}
                   {cluster.keywords.length > 5 && (
                     <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', paddingLeft: '12px' }}>
                       + {cluster.keywords.length - 5} more keywords
                     </div>
                   )}
                 </div>

                 <div style={{ marginTop: 'auto' }}>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                     <div style={{ textAlign: 'center', padding: '10px', background: 'var(--bg-main)', borderRadius: '12px' }}>
                       <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>AVG. DIFFICULTY</span>
                       <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{cluster.average_difficulty}%</span>
                     </div>
                     <div style={{ textAlign: 'center', padding: '10px', background: 'var(--bg-main)', borderRadius: '12px' }}>
                       <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>TOTAL VOLUME</span>
                       <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{cluster.total_volume.toLocaleString()}</span>
                     </div>
                   </div>
                   
                   <button 
                     className="btn btn-secondary" 
                     onClick={() => toast.info('Expanding Pillar', `Loading deep analysis for ${cluster.topic}...`)}
                     style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', height: '44px' }}
                   >
                     Analyze Cluster <ArrowRight size={16} />
                   </button>
                 </div>
               </div>
             ))}
           </div>
           
           <div className="card glass" style={{ marginTop: 'var(--space-xl)', padding: '32px', display: 'flex', alignItems: 'center', gap: '24px', background: 'rgba(99, 102, 241, 0.05)' }}>
              <div style={{ padding: '16px', background: 'var(--primary)', color: 'white', borderRadius: '16px' }}>
                <TrendingUp size={32} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Ready to dominate?</h3>
                <p style={{ color: 'var(--text-muted)' }}>Use these pillars to guide your content creation. Each pillar represents a topical authority hub.</p>
              </div>
              <button className="btn btn-primary" onClick={() => setStrategy(null)}>Reset Strategy</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default KeywordStrategyPage;
