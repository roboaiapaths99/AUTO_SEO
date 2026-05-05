import React, { useState, useEffect } from 'react';
import { 
  History, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { seoService } from '../services/seoService';
import { useAuthStore } from '../store/authStore';
import { useProjectStore } from '../store/projectStore';
import { useUIStore } from '../store/uiStore';

interface HistoricalReport {
  job_id: string;
  crawled_at: string;
  health_score: number;
  total_issues: number;
}

interface DeltaData {
  health_score: number;
  total_pages: number;
  total_issues: number;
  errors: number;
  warnings: number;
  new_broken_links: string[];
  fixed_broken_links: string[];
}

const TimeMachinePage: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const { addToast } = useUIStore();
  const [reports, setReports] = useState<HistoricalReport[]>([]);
  const [reportA, setReportA] = useState<string>('');
  const [reportB, setReportB] = useState<string>('');
  const [delta, setDelta] = useState<DeltaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);

  const currentProject = useProjectStore(state => state.currentProject);
  const projectId = currentProject?._id || 'demo-project';

  useEffect(() => {
    fetchReports();
  }, [projectId]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await seoService.listAuditReports(projectId);
      setReports(data);
      if (data.length >= 2) {
        setReportA(data[1].job_id); // Previous
        setReportB(data[0].job_id); // Current
      }
    } catch (err) {
      console.error('Failed to fetch reports', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    if (!reportA || !reportB) return;
    try {
      setComparing(true);
      const data = await seoService.getAuditDelta(projectId, reportA, reportB);
      setDelta(data);
    } catch (err) {
      console.error('Comparison failed', err);
      addToast({ type: 'error', title: 'Comparison failed', message: 'Could not compare the selected audit snapshots.' });
    } finally {
      setComparing(false);
    }
  };

    const DeltaStat = ({ label, value, inverse = false }: { label: string; value: number; inverse?: boolean }) => {
      const isPositive = value > 0;
      const isZero = value === 0;
      const color = isZero ? 'text-slate-400' : ((isPositive !== inverse) ? 'text-emerald-400' : 'text-rose-400');
      
      return (
        <div className="card glass p-6 text-center lg:text-left">
          <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">{label}</p>
          <div className="flex items-end justify-center lg:justify-start gap-3">
            <span className={`text-4xl font-extrabold ${color}`}>
              {isPositive ? '+' : ''}{value}
            </span>
            {!isZero && (
              <div className={`mb-1 ${color}`}>
                {isPositive ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
              </div>
            )}
          </div>
        </div>
      );
    };

    if (loading) {
      return (
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      );
    }

    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-extrabold text-white flex items-center gap-4">
              <History className="w-10 h-10 text-indigo-500" />
              SEO Time Machine
            </h1>
            <p className="text-slate-400 mt-2 text-lg">
              Track site evolution and measure the impact of your SEO changes over time.
            </p>
          </div>
        </div>

        {reports.length < 2 ? (
          <div className="card glass p-12 text-center max-w-2xl mx-auto mt-16">
            <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.15)]">
              <Clock className="w-12 h-12 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Not Enough Historical Data</h2>
            <p className="text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
              You need at least two site audits to use the Time Machine comparison tool. Run a new audit to generate a snapshot.
            </p>
            <button 
              onClick={() => window.location.href = '/audit'}
              className="btn-primary"
              style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}
            >
              Run New Site Audit
            </button>
          </div>
        ) : (
          <>
            {/* Trend Chart Section */}
            <div className="card glass p-8 mb-12 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-white">Health Score Velocity</h2>
                  <p className="text-slate-400 text-sm">Long-term trend analysis of your site's SEO performance.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest">Growth Engine Active</span>
                </div>
              </div>

              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={[...reports].reverse().map(r => ({
                      date: new Date(r.crawled_at).toLocaleDateString(),
                      score: r.health_score,
                      issues: r.total_issues
                    }))}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#94a3b8" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      dy={10}
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      domain={[0, 100]}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0f172a', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#6366f1" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorScore)" 
                      animationDuration={2000}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Comparison Selector */}
            <div className="card glass p-8 mb-12">
              <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-indigo-400 ml-1 uppercase tracking-widest">Compare From (Previous)</label>
                  <select 
                    value={reportA}
                    onChange={(e) => setReportA(e.target.value)}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-5 py-4 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all appearance-none cursor-pointer shadow-inner"
                  >
                    {reports.map(r => (
                      <option key={r.job_id} value={r.job_id} disabled={r.job_id === reportB}>
                        {new Date(r.crawled_at).toLocaleDateString()} — Score: {r.health_score}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-slate-800/50 border border-white/5 rounded-full flex items-center justify-center shadow-lg">
                    <ArrowRight className="w-8 h-8 text-indigo-400" />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-emerald-400 ml-1 uppercase tracking-widest">Compare To (Current)</label>
                  <select 
                    value={reportB}
                    onChange={(e) => setReportB(e.target.value)}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-5 py-4 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all appearance-none cursor-pointer shadow-inner"
                  >
                    {reports.map(r => (
                      <option key={r.job_id} value={r.job_id} disabled={r.job_id === reportA}>
                        {new Date(r.crawled_at).toLocaleDateString()} — Score: {r.health_score}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button 
                onClick={handleCompare}
                disabled={comparing}
                className="btn-primary w-full mt-8 py-4 text-lg"
              >
                {comparing ? <RefreshCw className="w-6 h-6 animate-spin" /> : 'Compare Snapshot Deltas'}
              </button>
            </div>

            {/* Results Delta */}
            {delta && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  <DeltaStat label="Health Score" value={delta.health_score} />
                  <DeltaStat label="Pages Crawled" value={delta.total_pages} />
                  <DeltaStat label="Total Issues" value={delta.total_issues} inverse />
                  <DeltaStat label="Errors" value={delta.errors} inverse />
                  <DeltaStat label="Warnings" value={delta.warnings} inverse />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Fixed Links */}
                  <div className="card glass p-8">
                    <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/5">
                      <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center shadow-inner">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Fixed Broken Links</h3>
                        <p className="text-sm text-slate-400">Issues resolved since previous snapshot</p>
                      </div>
                    </div>
                    {delta.fixed_broken_links.length > 0 ? (
                      <ul className="space-y-3">
                        {delta.fixed_broken_links.map((link, idx) => (
                          <li key={idx} className="flex items-center gap-3 text-slate-300 bg-white/5 hover:bg-white/10 transition-colors p-4 rounded-xl border border-white/5">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                            <span className="truncate text-sm font-medium">{link}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-12">
                        <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto mb-4 opacity-50" />
                        <p className="text-slate-500 font-medium">No broken links fixed in this period.</p>
                      </div>
                    )}
                  </div>

                  {/* New Issues */}
                  <div className="card glass p-8">
                    <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/5">
                      <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center shadow-inner">
                        <AlertCircle className="w-6 h-6 text-rose-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">New Broken Links</h3>
                        <p className="text-sm text-slate-400">Issues detected since previous snapshot</p>
                      </div>
                    </div>
                    {delta.new_broken_links.length > 0 ? (
                      <ul className="space-y-3">
                        {delta.new_broken_links.map((link, idx) => (
                          <li key={idx} className="flex items-center gap-3 text-slate-300 bg-white/5 hover:bg-white/10 transition-colors p-4 rounded-xl border border-white/5">
                            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 drop-shadow-[0_0_8px_rgba(251,113,133,0.5)]" />
                            <span className="truncate text-sm font-medium">{link}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-12">
                        <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-4 opacity-50" />
                        <p className="text-slate-500 font-medium">No new broken links detected. Great job!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
    </div>
  );
};

export default TimeMachinePage;
