import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldCheck, AlertCircle, CheckCircle2, Clock, Play, BarChart2, Zap, Info, ExternalLink, Globe, Loader2, RefreshCw, FileText, Download, ChevronRight } from 'lucide-react';
import MetricCard from '../components/ui/MetricCard';
import ExportButton from '../components/ui/ExportButton';
import EmptyState from '../components/ui/EmptyState';
import { auditService } from '../services/auditService';
import { seoService } from '../services/seoService';
import integrationService from '../services/integrationService';
import type { Integration } from '../services/integrationService';
import { useProjectStore } from '../store/projectStore';
import { toast, useUIStore } from '../store/uiStore';
import IntegrationModal from '../components/modals/IntegrationModal';

/**
 * AutoSEO AI Platform — Site Audit
 * ================================
 * Deep-crawl analysis to uncover technical issues, performance bottlenecks, and SEO errors.
 */
const SiteAuditPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const activeDomain = useProjectStore((state) => state.activeDomain);
  const currentProject = useProjectStore((state) => state.currentProject);

  const [domain, setDomain] = useState(activeDomain || '');
  const [running, setRunning] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [roadmap, setRoadmap] = useState<any>(null);
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [applyingFixes, setApplyingFixes] = useState(false);
  const { openModal } = useUIStore();
  const intervalRef = useRef<any>(null);

  // Update local domain if store domain changes
  useEffect(() => {
    if (activeDomain) setDomain(activeDomain);
  }, [activeDomain]);

  useEffect(() => {
    if (currentProject?._id) {
      loadIntegrations();
    }
  }, [currentProject]);

  const loadIntegrations = async () => {
    if (!currentProject?._id) return;
    try {
      const data = await integrationService.getIntegrations(currentProject._id);
      setIntegrations(data);
    } catch (error) {
      console.error('Failed to load integrations', error);
    }
  };

  const startAudit = async () => {
    if (!domain.trim()) {
      toast.error('Missing Domain', 'Please enter a domain to audit.');
      return;
    }
    const cleanDomain = domain.toLowerCase().replace(/https?:\/\//, '').replace(/\/+$/, '');
    
    setRunning(true);
    setReport(null);
    setProgress(0);
    setStatusText('Starting crawl...');

    try {
      const result = await auditService.startCrawl(
        currentProject?._id || 'guest',
        cleanDomain
      );
      setJobId(result.job_id);
      toast.info('Audit Started', `Analyzing ${cleanDomain}...`);
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Failed to start audit. Check your connection.';
      toast.error('Audit Failed', detail);
      setRunning(false);
    }
  };

  const fetchReport = async () => {
    if (!domain && !currentProject) return;
    setLoading(true);
    try {
      const identifier = currentProject?._id || domain.toLowerCase().replace(/https?:\/\//, '').replace(/\/+$/, '');
      const data = await auditService.getLatestReport(identifier);
      if (data) setReport(data);
    } catch (err: any) {
      console.warn('No report found yet');
    } finally {
      setLoading(false);
    }
  };

  // Handle run param or active domain change
  useEffect(() => {
    const checkActiveJob = async () => {
      if (currentProject?._id) {
        try {
          const activeJob = await auditService.getActiveJob(currentProject._id);
          if (activeJob && activeJob.status === 'running') {
            setJobId(activeJob.job_id);
            setRunning(true);
            setProgress(activeJob.progress || 0);
          }
        } catch (e) {
          console.warn("No active job check failed", e);
        }
      }
    };

    if (searchParams.get('run') === 'true' && domain && !running) {
      startAudit();
    } else {
      if (activeDomain) fetchReport();
      checkActiveJob();
    }
  }, [searchParams, activeDomain, currentProject?._id]);

  // Poll for status if a job is running
  useEffect(() => {
    if (running && jobId) {
      intervalRef.current = setInterval(async () => {
        try {
          const status = await auditService.getCrawlStatus(jobId);
          setProgress(status.progress || 0);
          setStatusText(`Crawled ${status.pages_crawled || 0} pages — found ${status.pages_found || 0} URLs`);
          
          if (status.status === 'completed') {
            setRunning(false);
            clearInterval(intervalRef.current);
            await fetchReport();
            toast.success('Audit Complete', `Analysis for ${domain} is ready.`);
          }
          if (status.status === 'failed') {
            setRunning(false);
            clearInterval(intervalRef.current);
            toast.error('Audit Failed', 'The crawler encountered an error.');
          }
        } catch (err: any) {
          console.warn('Polling error:', err);
        }
      }, 3000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, jobId, domain]);

  const handleApplyFixes = async () => {
    if (!currentProject?._id || integrations.length === 0) return;
    setApplyingFixes(true);
    try {
      const type = integrations[0].type;
      const result = await seoService.applyFixes(currentProject._id, type);
      toast.success('Fixes Applied', result.message);
    } catch (error: any) {
      toast.error('Fix Failed', error.response?.data?.detail || 'Failed to apply fixes');
    } finally {
      setApplyingFixes(false);
    }
  };

  const handleGenerateRoadmap = async () => {
    if (!report || !currentProject) {
      toast.error('No Audit Data', 'Please run an audit first to generate a roadmap.');
      return;
    }
    
    setGeneratingRoadmap(true);
    try {
      const data = await auditService.generateRoadmap(currentProject._id);
      setRoadmap(data);
      toast.success('Roadmap Generated', 'Your personalized SEO roadmap is ready.');
      
      // Scroll to roadmap
      setTimeout(() => {
        document.getElementById('seo-roadmap')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      toast.error('Generation Failed', 'Could not generate roadmap. Please try again.');
    } finally {
      setGeneratingRoadmap(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !running) startAudit();
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '8px' }}>
            Site <span className="text-gradient">Audit</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
            Deep-crawl analysis to uncover technical issues and SEO bottlenecks.
          </p>
        </div>
        {report && !running && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <ExportButton 
              data={report.top_issues || []} 
              filename={`audit_${domain}`} 
              columns={[
                { key: 'type', label: 'Priority' },
                { key: 'category', label: 'Category' },
                { key: 'message', label: 'Issue' },
                { key: 'url', label: 'Affected URL' }
              ]} 
            />
            <button className="btn btn-secondary" onClick={startAudit}>
              <RefreshCw size={18} style={{ marginRight: '8px' }} /> Re-run Audit
            </button>
          </div>
        )}
      </div>

      {/* Domain Input Bar */}
      <div className="card glass" style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 16px', marginBottom: 'var(--space-xl)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <Globe size={20} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          type="text"
          className="input-field"
          placeholder="Enter domain (e.g. agpkacademy.in)"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={running}
          style={{
            flex: 1, background: 'transparent', border: 'none',
            fontSize: '1.05rem', padding: '8px 0', outline: 'none',
          }}
        />
        <button
          className="btn btn-primary"
          onClick={startAudit}
          disabled={running || !domain.trim()}
          style={{
            padding: '0 24px', height: '44px', display: 'flex',
            alignItems: 'center', gap: '8px', flexShrink: 0,
          }}
        >
          {running ? (
            <><Loader2 size={18} className="animate-spin" /> Crawling...</>
          ) : (
            <><Play size={16} fill="currentColor" /> Run Audit</>
          )}
        </button>
      </div>

      {/* Crawl Progress */}
      {running && (
        <div className="card glass" style={{ textAlign: 'center', padding: '48px', border: '1px solid var(--primary-soft)', marginBottom: 'var(--space-xl)' }}>
          <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 24px' }}>
            <svg style={{ transform: 'rotate(-90deg)', width: '120px', height: '120px' }}>
              <circle cx="60" cy="60" r="54" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
              <circle cx="60" cy="60" r="54" fill="transparent" stroke="var(--primary)" strokeWidth="8"
                strokeDasharray="339" strokeDashoffset={339 - (339 * progress / 100)}
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                strokeLinecap="round"
              />
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: 800, fontSize: '1.5rem' }}>
              {progress}%
            </div>
          </div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>
            Crawling <span className="text-gradient">{domain}</span>
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{statusText}</p>
        </div>
      )}

      {/* Report Results */}
      {report && !running ? (
        <>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)'
          }}>
            <div className="card-static" style={{ borderTop: `4px solid ${(report.overall_score || 0) >= 70 ? '#10b981' : (report.overall_score || 0) >= 40 ? '#f59e0b' : '#ef4444'}` }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Site Health</p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: (report.overall_score || 0) >= 70 ? '#10b981' : (report.overall_score || 0) >= 40 ? '#f59e0b' : '#ef4444' }}>
                  {report.overall_score ?? 0}
                </span>
                <span style={{ color: 'var(--text-muted)', paddingBottom: '8px' }}>/ 100</span>
              </div>
            </div>
            <MetricCard title="Pages Crawled" value={report.total_pages_crawled ?? 0} icon={BarChart2} />
            <MetricCard title="Total Errors" value={report.errors_count ?? 0} icon={AlertCircle} trend="down" change={0} />
            <MetricCard title="Total Warnings" value={report.warnings_count ?? 0} icon={Clock} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-lg)' }}>
            <div className="card-static">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Top Issues to Fix</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(report.top_issues || []).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    <CheckCircle2 size={32} style={{ margin: '0 auto 12px', color: '#10b981' }} />
                    <p>No major issues found! Your site is looking great.</p>
                  </div>
                ) : (
                  (report.top_issues || []).map((issue: any, i: number) => (
                    <div key={i} className="table-row-hover" style={{
                      display: 'flex', gap: '16px', padding: '16px',
                      background: 'rgba(255,255,255,0.02)', borderRadius: '12px',
                      borderLeft: `4px solid ${issue.type === 'error' ? 'var(--danger)' : 'var(--warning)'}`
                    }}>
                      <div style={{ color: issue.type === 'error' ? 'var(--danger)' : 'var(--warning)' }}>
                        {issue.type === 'error' ? <AlertCircle size={20} /> : <Info size={20} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600, fontSize: '1rem' }}>{issue.message}</span>
                          <span style={{ 
                            fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px',
                            background: issue.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                            color: issue.type === 'error' ? 'var(--danger)' : 'var(--warning)',
                            textTransform: 'uppercase', fontWeight: 800
                          }}>{issue.category}</span>
                        </div>
                        {issue.url && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            <a href={issue.url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {issue.url} <ExternalLink size={12} />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
              <div className="card glass">
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Zap size={18} style={{ color: 'var(--primary)' }} /> Crawl Stats
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Status</span>
                    <span style={{ color: 'var(--success)', fontWeight: 600 }}>Completed</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Crawl Depth</span>
                    <span>3 Levels</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>User Agent</span>
                    <span>AutoSEO Bot</span>
                  </div>
                  <div style={{ height: '1px', background: 'var(--border)' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Crawled at</span>
                    <span>{report.crawled_at ? new Date(report.crawled_at).toLocaleDateString() : '—'}</span>
                  </div>
                </div>
              </div>

              <div className="card glass" style={{ background: 'var(--primary-soft)' }}>
                <h4 style={{ marginBottom: '12px', fontSize: '1rem' }}>Need expert help?</h4>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Our AI can automatically generate a fix strategy for all identified issues.
                </p>
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%' }}
                  onClick={handleGenerateRoadmap}
                  disabled={generatingRoadmap}
                >
                  {generatingRoadmap ? (
                    <><Loader2 size={16} className="animate-spin" style={{ marginRight: '8px' }} /> Generating...</>
                  ) : (
                    <>Generate Fix Plan <ChevronRight size={16} /></>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* SEO Roadmap Section */}
          {roadmap && (
            <div id="seo-roadmap" className="animate-slide-up" style={{ marginTop: 'var(--space-2xl)' }}>
              <div style={{ marginBottom: 'var(--space-xl)', textAlign: 'center' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '12px' }}>
                  Real <span className="text-gradient">SEO Roadmap</span>
                </h2>
                <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
                  {roadmap.summary}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-xl)' }}>
                {roadmap.phases.map((phase: any, idx: number) => (
                  <div key={idx} className="card glass" style={{ 
                    position: 'relative', 
                    overflow: 'hidden',
                    borderTop: `4px solid ${idx === 0 ? 'var(--danger)' : idx === 1 ? 'var(--warning)' : 'var(--success)'}`
                  }}>
                    <div style={{ 
                      position: 'absolute', top: '-10px', right: '-10px', 
                      fontSize: '4rem', fontWeight: 900, color: 'rgba(255,255,255,0.03)',
                      zIndex: 0
                    }}>
                      {idx + 1}
                    </div>
                    
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{phase.title}</h3>
                        <span style={{ 
                          fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px',
                          background: phase.impact === 'High' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)',
                          color: phase.impact === 'High' ? 'var(--danger)' : 'var(--text-muted)',
                          fontWeight: 700, textTransform: 'uppercase'
                        }}>
                          Impact: {phase.impact}
                        </span>
                      </div>
                      
                      <p style={{ fontSize: '0.9rem', color: 'var(--primary-light)', marginBottom: '16px', fontWeight: 500 }}>
                        {phase.objective}
                      </p>
                      
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {phase.steps.map((step: string, sIdx: number) => (
                          <li key={sIdx} style={{ display: 'flex', gap: '10px', fontSize: '0.875rem' }}>
                            <div style={{ 
                              width: '18px', height: '18px', borderRadius: '50%', 
                              background: 'var(--primary)', color: 'white', 
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.65rem', flexShrink: 0, marginTop: '2px'
                            }}>
                              {sIdx + 1}
                            </div>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>

              <div className="card glass" style={{ 
                marginTop: 'var(--space-xl)', padding: '24px', 
                background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
                textAlign: 'center', border: '1px solid var(--primary-soft)'
              }}>
                <h4 style={{ marginBottom: '8px' }}>
                  {integrations.length > 0 ? 'Integrations Active' : 'Need help executing this roadmap?'}
                </h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
                  {integrations.length > 0 
                    ? `Connected: ${integrations.map(i => i.type.toUpperCase()).join(', ')}. AI can now apply fixes directly.`
                    : 'Connect your Google Search Console or CMS to enable one-click fixes for identified issues.'}
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '8px 24px' }}
                    onClick={() => openModal('connect-integration')}
                  >
                    {integrations.length > 0 ? 'Manage Integrations' : 'Connect Integration'}
                  </button>
                  {integrations.length > 0 && (
                    <button 
                      className="btn btn-primary" 
                      style={{ padding: '8px 24px' }}
                      onClick={handleApplyFixes}
                      disabled={applyingFixes}
                    >
                      {applyingFixes ? (
                        <><Loader2 size={16} className="animate-spin" style={{ marginRight: '8px' }} /> Applying...</>
                      ) : (
                        <>Apply Automated Fixes <Zap size={16} /></>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentProject?._id && (
            <IntegrationModal 
              projectId={currentProject._id} 
              onConnected={loadIntegrations} 
            />
          )}
        </>
      ) : loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh' }}>
          <Loader2 className="animate-spin" size={32} color="var(--primary)" />
        </div>
      ) : !running && (
        <EmptyState
          icon={ShieldCheck}
          title="No Audit Data"
          description="Enter a domain above and run a comprehensive audit to uncover technical SEO issues."
          action={<button className="btn btn-primary" onClick={startAudit}>Start Your First Audit</button>}
        />
      )}
    </div>
  );
};

export default SiteAuditPage;
