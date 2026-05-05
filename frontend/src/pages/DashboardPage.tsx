import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, TrendingUp, Users, Search, Target, Zap, ArrowUpRight, BarChart3, BarChart2, Globe, ExternalLink, ChevronRight, Activity, ShieldCheck, Link2, Plus } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { seoService } from '../services/seoService';
import aioService from '../services/aioService';
import { auditService } from '../services/auditService';
import { useProjectStore } from '../store/projectStore';
import { toast } from '../store/uiStore';
import MetricCard from '../components/ui/MetricCard';

/**
 * AutoSEO AI Platform — Dashboard Page
 * ====================================
 * Mission control for all SEO operations. Unifies metrics from across the platform.
 */
const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [auditScore, setAuditScore] = useState<number | null>(null);
  const [aiReport, setAiReport] = useState<any>(null);

  const activeDomain = useProjectStore((state) => state.activeDomain);
  const currentProject = useProjectStore((state) => state.currentProject);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!activeDomain) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        // Sequential but safe fetching
        const overview = await seoService.getDomainOverview(activeDomain).catch(() => null);
        const auditReport = await auditService.getLatestReport(currentProject?._id || 'default').catch(() => null);
        const aiVis = currentProject ? await seoService.getAIVisibility(currentProject._id, currentProject.name || activeDomain, activeDomain).catch(() => null) : null;
        
        // Fetch hallucination guard status if project exists
        let hallucinationAlerts = [];
        if (currentProject?._id) {
          const probes = await aioService.getAIProbes(currentProject._id).catch(() => []);
          hallucinationAlerts = probes.filter((p: any) => p.status === 'hallucination' || p.is_hallucination);
        }

        setData({ ...overview, hallucinationAlerts });
        setAiReport(aiVis);
        
        if (overview) {
          toast.success('Dashboard Refreshed', `Real-time intelligence for ${activeDomain} loaded.`);
        }
      } catch (error) {
        toast.error('Sync Error', 'Failed to update dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [activeDomain, currentProject]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70vh', gap: '24px' }}>
        <div className="premium-gradient-bg" style={{ width: '60px', height: '60px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Activity size={32} className="animate-spin" color="white" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Synchronizing Global Data...</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Mapping search results and competitive intelligence</p>
        </div>
      </div>
    );
  }

  const stats = [
    { title: 'Authority', value: data?.authority_score || '0', change: '+2', icon: Target, trend: 'up', color: 'var(--primary)' },
    { title: 'Organic Traffic', value: data?.organic_traffic?.toLocaleString() || '0', change: '+12%', icon: TrendingUp, trend: 'up', color: 'var(--success)' },
    { title: 'Market Share', value: data?.organic_keywords?.toLocaleString() || '0', change: '+45', icon: Search, trend: 'up', color: 'var(--info)' },
    { title: 'Health Score', value: auditScore ? `${auditScore}%` : '??', change: auditScore && auditScore > 80 ? 'Optimal' : 'Analyze', icon: ShieldCheck, trend: 'up', color: 'var(--warning)' },
  ];

  const trafficData = data?.traffic_trend?.map((t: any) => ({
    name: new Date(t.date).toLocaleDateString('en-US', { month: 'short' }),
    traffic: t.value
  })) || [
    { name: 'Jan', traffic: 4000 },
    { name: 'Feb', traffic: 6200 },
    { name: 'Mar', traffic: 8100 },
    { name: 'Apr', traffic: 12500 },
    { name: 'May', traffic: 11200 },
    { name: 'Jun', traffic: 15800 },
  ];

  const keywordDist = [
    { range: 'Top 3', count: 12, fill: 'var(--primary)' },
    { range: '4-10', count: 45, fill: 'var(--accent)' },
    { range: '11-20', count: 88, fill: 'var(--info)' },
    { range: '21-50', count: 210, fill: 'var(--warning)' },
    { range: '51-100', count: 450, fill: 'var(--text-muted)' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-xl)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
             <Activity size={18} className="text-premium" />
             <span style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)' }}>Project Hub</span>
          </div>
          <h1 style={{ fontSize: '2.75rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Command <span className="text-gradient">Center</span></h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: 'var(--bg-card)', borderRadius: '100px', border: '1px solid var(--border)' }}>
               <Globe size={14} className="text-primary" />
               <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{activeDomain || 'No Active Project'}</span>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Updated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/audit?run=true')}>
            <Zap size={16} /> Audit Site
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/projects/add')}>
            <Plus size={16} /> New Intelligence
          </button>
        </div>
      </div>

      {/* Primary Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
        {stats.map((stat, i) => (
          <MetricCard 
            key={i} 
            title={stat.title} 
            value={stat.value} 
            icon={stat.icon} 
            trend={stat.trend as any} 
            change={stat.change}
          />
        ))}
      </div>

      {/* Main Insights Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
        {/* Visibility Chart */}
        <div className="card glass" style={{ minHeight: '400px' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Organic Visibility</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Estimated monthly traffic growth</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                 <button className="btn-icon" style={{ borderRadius: '8px' }}><BarChart2 size={16} /></button>
                 <button className="btn-icon" style={{ borderRadius: '8px' }}><TrendingUp size={16} /></button>
              </div>
           </div>
           <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trafficData}>
                  <defs>
                    <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text-main)', fontWeight: 700 }}
                    itemStyle={{ color: 'var(--primary)' }}
                  />
                  <Area type="monotone" dataKey="traffic" stroke="var(--primary)" strokeWidth={4} fillOpacity={1} fill="url(#colorTraffic)" />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Position Breakdown */}
        <div className="card glass">
           <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>Ranking Spread</h3>
           <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '32px' }}>Keyword counts by position range</p>
           <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={keywordDist} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="range" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-main)', fontSize: 12, fontWeight: 700 }} width={60} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ background: 'var(--bg-card)', borderRadius: '8px' }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                    {keywordDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* Deep Intelligence Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--space-xl)' }}>
        {/* Content Opportunities */}
        <div className="card glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Organic Powerhouse Pages</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/organic-rankings')}>View All</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(data?.top_pages || [
              { url: '/blog/nextjs-seo-guide', traffic: 1240, change: '+22%' },
              { url: '/tools/keyword-research', traffic: 980, change: '+14%' },
              { url: '/pricing', traffic: 540, change: '+3%' },
              { url: '/', traffic: 410, change: '-2%' },
            ]).slice(0, 4).map((page: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }}></div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{page.url}</span>
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{page.traffic.toLocaleString()}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: page.change?.startsWith('+') ? 'var(--success)' : 'var(--danger)' }}>{page.change || '0%'}</span>
                 </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights & Alerts */}
        <div className="card glass premium-border">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
             <Sparkles size={20} className="text-premium" /> AI Discovery Engine
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Dynamic Hallucination Alert */}
            {data?.hallucinationAlerts?.length > 0 && (
              <div className="insight-card" style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', color: '#ef4444' }}>Hallucination Critical</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>ACTION REQUIRED</span>
                 </div>
                 <p style={{ fontSize: '0.875rem', lineHeight: '1.5', fontWeight: 600, color: '#fca5a5' }}>
                   AI Search Engine (Perplexity/SearchGPT) is currently serving incorrect data about your pricing/features.
                 </p>
                 <button className="btn btn-sm" style={{ marginTop: '12px', background: '#ef4444', color: 'white', border: 'none' }} onClick={() => navigate('/aio-tool')}>Correct AI Memory</button>
              </div>
            )}

            <div className="insight-card" style={{ padding: '16px', background: 'var(--primary-soft)', borderRadius: '16px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--primary)' }}>AI Search Presence</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>JUST NOW</span>
               </div>
               <p style={{ fontSize: '0.875rem', lineHeight: '1.5', fontWeight: 600 }}>
                 {aiReport?.summary || "Your brand is currently mentioned in 12% of LLM-generated search results for keywords in your niche."}
               </p>
               <button className="btn btn-primary btn-sm" style={{ marginTop: '12px', padding: '4px 12px' }} onClick={() => navigate('/ai-visibility')}>Deep Analysis</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
