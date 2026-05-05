import React, { useState } from 'react';
import { PenTool, Sparkles, Wand2, FileText, Zap, Loader2, Save, BarChart3, ChevronRight, Target, AlertCircle } from 'lucide-react';
import { contentService } from '../services/contentService';
import { toast } from '../store/uiStore';

/**
 * AutoSEO AI Platform — AI Content Assistant
 * =========================================
 * Generates SEO content briefs and analyzes writing for optimization.
 */
const ContentPage: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [contentText, setContentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);

  const handleGenerateBrief = async () => {
    if (!keyword) {
      toast.error('Keyword Required', 'Please enter a target keyword.');
      return;
    }
    setLoading(true);
    try {
      const data = await contentService.generateBrief(keyword);
      setBrief(data);
      toast.success('Strategy Ready', 'SEO brief generated based on top-ranking competitors.');
    } catch (err: any) {
      toast.error('Brief Failed', 'Could not generate content strategy.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateContent = async () => {
    if (!keyword) return;
    setLoading(true);
    try {
      const data = await contentService.generateContent(keyword);
      if (data.content) {
        setContentText(data.content);
        toast.success('Content Drafted', 'AI has generated a SEO-optimized draft.');
      }
    } catch (err: any) {
      toast.error('Generation Failed', 'AI writer encountered an issue.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!contentText || !keyword) return;
    setLoading(true);
    try {
      const data = await contentService.analyzeContent(contentText, keyword);
      setAnalysis(data);
      toast.success('Analysis Complete', `Score: ${data.score}/100`);
    } catch (err: any) {
      toast.error('Analysis Failed', 'Could not process content for optimization.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    // In a real app, this would save to DB
    toast.success('Draft Saved', 'Your content has been saved to your workspace.');
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '8px' }}>
          AI Content <span className="text-gradient">Assistant</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Generate high-ranking content templates and optimize your writing in real-time.</p>
      </div>

      <div className="card glass" style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)', padding: '16px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Target size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="input-field" 
            placeholder="What keyword are you targeting?" 
            style={{ paddingLeft: '48px', height: '48px', fontSize: '1.05rem' }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <button className="btn btn-secondary" onClick={handleGenerateBrief} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" size={18} /> : <><Sparkles size={18} style={{ marginRight: '8px' }} /> Generate Brief</> }
        </button>
        <button className="btn btn-primary" onClick={handleGenerateContent} disabled={loading || !keyword}>
          {loading ? <Loader2 className="animate-spin" size={18} /> : <><PenTool size={18} style={{ marginRight: '8px' }} /> AI Write Draft</> }
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-xl)' }}>
        <div className="card-static">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FileText size={20} style={{ color: 'var(--primary)' }} />
              <h3 style={{ margin: 0 }}>Smart Editor</h3>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-secondary" style={{ padding: '8px 16px' }} onClick={handleSave}>
                <Save size={16} style={{ marginRight: '8px' }} /> Save
              </button>
              <button className="btn btn-primary" onClick={handleAnalyze} disabled={loading || !contentText}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <><BarChart3 size={16} style={{ marginRight: '8px' }} /> Optimize</>}
              </button>
            </div>
          </div>
          
          {brief && (
            <div style={{ marginBottom: '16px', padding: '16px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Zap size={14} style={{ color: 'var(--primary)' }} />
                <strong style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)' }}>SEO Strategy Brief</strong>
              </div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 700 }}>{brief.title_suggestion}</h4>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>{brief.meta_description_suggestion}</p>
            </div>
          )}

          <textarea 
            style={{ 
              width: '100%',
              minHeight: '600px', 
              background: 'var(--bg-main)', 
              borderRadius: 'var(--radius-md)', 
              padding: '32px', 
              border: '1px solid var(--border)',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '1.1rem',
              lineHeight: '1.8',
              color: 'var(--text-main)',
              resize: 'vertical',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            placeholder="Start writing or paste your content here..."
            value={contentText}
            onChange={(e) => setContentText(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <div className="card glass">
            <h4 style={{ marginBottom: '20px', fontWeight: 700 }}>SEO Health Score</h4>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '140px' }}>
              <div style={{ 
                width: '110px', 
                height: '110px', 
                borderRadius: '50%', 
                border: '8px solid var(--border)', 
                borderTopColor: (analysis?.score || 0) >= 80 ? 'var(--success)' : (analysis?.score || 0) >= 50 ? 'var(--primary)' : 'var(--danger)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexDirection: 'column',
                position: 'relative',
                boxShadow: `0 0 20px ${ (analysis?.score || 0) >= 80 ? 'rgba(16, 185, 129, 0.2)' : (analysis?.score || 0) >= 50 ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)' }`
              }}>
                <span style={{ fontSize: '2rem', fontWeight: 900 }}>{analysis?.score || 0}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>SCORE</span>
              </div>
            </div>
            {analysis && (
              <div style={{ marginTop: '24px', fontSize: '0.8125rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="glass" style={{ padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                  <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--text-muted)' }}>Words</strong>
                  <span style={{ fontSize: '1rem', fontWeight: 700 }}>{analysis.word_count}</span>
                </div>
                <div className="glass" style={{ padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                  <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--text-muted)' }}>Density</strong>
                  <span style={{ fontSize: '1rem', fontWeight: 700 }}>{analysis.keyword_density}%</span>
                </div>
              </div>
            )}
          </div>

          <div className="card-static">
            <h4 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ChevronRight size={18} style={{ color: 'var(--primary)' }} /> Outline Builder
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
              {brief?.suggested_headings?.length > 0 ? brief.suggested_headings.map((h: string, i: number) => (
                <div key={i} style={{ 
                  padding: '10px 14px', 
                  background: 'var(--bg-main)', 
                  borderRadius: '8px', 
                  fontSize: '0.875rem', 
                  border: '1px solid var(--border)',
                  color: 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }}></div>
                  {h}
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  <PenTool size={24} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <p>Generate a brief to see recommended headings.</p>
                </div>
              )}
            </div>
          </div>

          <div className="card glass">
            <h4 style={{ fontWeight: 700, color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} /> Critical Fixes
            </h4>
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {analysis?.suggestions?.length > 0 ? analysis.suggestions.map((s: string, i: number) => (
                <div key={i} style={{ display: 'flex', gap: '10px', fontSize: '0.875rem', lineHeight: '1.5' }}>
                  <Zap size={14} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '3px' }} />
                  <span>{s}</span>
                </div>
              )) : (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Analyze content to see optimization suggestions.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentPage;
