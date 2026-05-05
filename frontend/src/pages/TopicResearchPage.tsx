import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, BookOpen, TrendingUp, Lightbulb, ArrowRight, Loader2, Target, BarChart2, Filter, Download } from 'lucide-react';
import ExportButton from '../components/ui/ExportButton';
import EmptyState from '../components/ui/EmptyState';
import { useProjectStore } from '../store/projectStore';
import { seoService } from '../services/seoService';
import { toast } from '../store/uiStore';

/**
 * AutoSEO AI Platform — Topic Research
 * ====================================
 * Discover trending topics and content clusters to dominate your niche.
 */
const TopicResearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<any[]>([]);
  const activeDomain = useProjectStore((state) => state.activeDomain);

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    
    setLoading(true);
    setIdeas([]);
    toast.info('Researching Topic', `Analyzing the search landscape for "${topic}"...`);

    try {
      // In a real app, we might have a dedicated topic research endpoint.
      // Here we leverage keywordMagic for topical suggestions.
      const data = await seoService.keywordMagic(topic);
      const results = data.map((item: any) => ({
        title: item.keyword,
        difficulty: (item.difficulty || 0) > 60 ? 'Hard' : (item.difficulty || 0) > 30 ? 'Medium' : 'Easy',
        difficultyScore: item.difficulty || 0,
        volume: item.volume || 0,
        cpc: item.cpc || 0,
        potential: (item.volume || 0) > 1000 ? 'High' : 'Medium'
      }));
      setIdeas(results);
      if (results.length > 0) {
        toast.success('Research Complete', `Generated ${results.length} content ideas.`);
      } else {
        toast.info('No ideas found', 'Try a broader topic.');
      }
    } catch (error) {
      toast.error('Research Failed', 'Could not generate topic ideas.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = (kw: string) => {
    navigate(`/keywords?q=${encodeURIComponent(kw)}`);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 'var(--space-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '8px' }}>
            Topic <span className="text-gradient">Research</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
            Discover trending topics and content clusters to dominate your niche.
          </p>
        </div>
        {ideas.length > 0 && (
          <ExportButton 
            data={ideas} 
            filename={`topics_${topic}`}
            columns={[
              { key: 'title', label: 'Topic Idea' },
              { key: 'difficulty', label: 'Difficulty' },
              { key: 'volume', label: 'Volume' },
              { key: 'potential', label: 'Potential' }
            ]}
          />
        )}
      </div>

      <div className="card glass" style={{ marginBottom: 'var(--space-xl)', padding: '16px' }}>
        <form onSubmit={handleResearch} style={{ display: 'flex', gap: 'var(--space-md)' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              className="input-field" 
              placeholder="Enter a topic (e.g. 'vegan recipes' or 'ai marketing')" 
              style={{ paddingLeft: '48px', height: '48px', fontSize: '1.05rem' }}
              value={topic}
              onChange={e => setTopic(e.target.value)}
              disabled={loading}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading || !topic.trim()} style={{ padding: '0 24px' }}>
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Discover Ideas'}
          </button>
        </form>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px' }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '24px' }}>
             <Sparkles size={48} className="text-premium animate-pulse" />
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>AI is exploring the web...</h3>
          <p style={{ color: 'var(--text-muted)' }}>Clustering topics and calculating search volumes for "{topic}"</p>
        </div>
      ) : ideas.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-lg)' }}>
          {ideas.map((idea, i) => (
            <div key={i} className="card-static table-row-hover" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
                <div style={{ padding: '10px', background: 'var(--primary-soft)', borderRadius: '10px', color: 'var(--primary)' }}>
                  <Lightbulb size={20} />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ 
                    fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 800, textTransform: 'uppercase',
                    background: idea.difficulty === 'Easy' ? 'rgba(16, 185, 129, 0.1)' : idea.difficulty === 'Medium' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: idea.difficulty === 'Easy' ? 'var(--success)' : idea.difficulty === 'Medium' ? 'var(--warning)' : 'var(--danger)',
                  }}>{idea.difficulty}</span>
                </div>
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', lineHeight: '1.4' }}>{idea.title}</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div style={{ padding: '8px', background: 'var(--bg-main)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>VOLUME</span>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{idea.volume.toLocaleString()}</span>
                </div>
                <div style={{ padding: '8px', background: 'var(--bg-main)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>POTENTIAL</span>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>{idea.potential}</span>
                </div>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => handleAnalyze(idea.title)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  View Keyword Data <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="Topical Authority Starts Here"
          description="Enter a broad topic to see a list of high-potential content angles and sub-topics you can rank for."
          action={<div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
             <button className="btn btn-secondary" onClick={() => { setTopic('Healthy Eating'); setIdeas([]); }}>Healthy Eating</button>
             <button className="btn btn-secondary" onClick={() => { setTopic('Cybersecurity'); setIdeas([]); }}>Cybersecurity</button>
          </div>}
        />
      )}
    </div>
  );
};

export default TopicResearchPage;
