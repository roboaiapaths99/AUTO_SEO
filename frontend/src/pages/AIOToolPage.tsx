import React, { useState, useEffect } from 'react';
import { 
    ShieldCheck, 
    AlertTriangle, 
    Search, 
    CheckCircle2, 
    RefreshCcw, 
    Info, 
    Code,
    Cpu,
    ExternalLink,
    Clock
} from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { useUIStore } from '../store/uiStore';
import aioService, { type AIMention, type AIOCorrection, type VerifiedBrandData } from '../services/aioService';

const AIOToolPage: React.FC = () => {
    const { currentProject } = useProjectStore();
    const { addToast } = useUIStore();
    
    const [mentions, setMentions] = useState<AIMention[]>([]);
    const [corrections, setCorrections] = useState<AIOCorrection[]>([]);
    const [verifiedData, setVerifiedData] = useState<VerifiedBrandData | null>(null);
    const [loading, setLoading] = useState(false);
    const [showIdentityModal, setShowIdentityModal] = useState(false);
    const [probes, setProbes] = useState<any[]>([]);
    const [probing, setProbing] = useState(false);
    const [testPrompt, setTestPrompt] = useState('What is the pricing for ' + (currentProject?.name || 'our company') + '?');
    const [editForm, setEditForm] = useState<VerifiedBrandData>({
        official_name: '',
        key_products: [],
        founder_ceo: '',
        mission_statement: ''
    });

    useEffect(() => {
        if (currentProject?._id) {
            fetchData();
        }
    }, [currentProject]);

    const fetchData = async () => {
        if (!currentProject?._id) return;
        setLoading(true);
        try {
            const [m, c, v, p] = await Promise.all([
                aioService.getMentions(currentProject._id),
                aioService.getCorrections(currentProject._id),
                aioService.getVerifiedData(currentProject._id).catch(() => null),
                aioService.getAIProbes(currentProject._id).catch(() => [])
            ]);
            setMentions(m);
            setCorrections(c);
            setProbes(p);
            if (v) {
                setVerifiedData(v);
                setEditForm(v);
            }
        } catch (error) {
            console.error("Error fetching AIO data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateIdentity = async () => {
        if (!currentProject?._id) return;
        try {
            await aioService.updateVerifiedData(currentProject._id, editForm);
            setVerifiedData(editForm);
            setShowIdentityModal(false);
            addToast({ title: "Brand Identity updated.", type: "success" });
        } catch (error) {
            addToast({ title: "Failed to update identity.", type: "error" });
        }
    };

    const handleRunProbe = async () => {
        if (!currentProject) return;
        try {
            setProbing(true);
            await aioService.probeAI(currentProject._id, testPrompt);
            const updatedProbes = await aioService.getAIProbes(currentProject._id);
            setProbes(updatedProbes);
            addToast({ title: 'Probe Complete', type: 'success' });
        } catch (error) {
            addToast({ title: 'Probe Failed', type: 'error' });
        } finally {
            setProbing(false);
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <ShieldCheck className="w-10 h-10 text-indigo-500" />
                        AI Hallucination Guard <span className="text-xs font-bold bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full uppercase tracking-widest border border-indigo-500/30">Enterprise</span>
                    </h1>
                    <p className="text-slate-400 mt-2 max-w-2xl text-sm">
                        Monitor what AI models (ChatGPT, Gemini, Claude) are saying about your brand and automatically generate JSON-LD schema corrections to feed accurate data back to AI crawlers.
                    </p>
                </div>
            </div>

            {/* Identity Modal */}
            {showIdentityModal && (
                <div className="modal-overlay" onClick={() => setShowIdentityModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <ShieldCheck className="text-indigo-400" />
                                Brand Identity (Source of Truth)
                            </h2>
                        </div>
                        <div className="modal-body space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Official Brand Name</label>
                                <input 
                                    className="input-field" 
                                    value={editForm.official_name} 
                                    onChange={e => setEditForm({...editForm, official_name: e.target.value})}
                                    placeholder="e.g. Acme Corp Inc."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Founder / CEO</label>
                                    <input 
                                        className="input-field" 
                                        value={editForm.founder_ceo} 
                                        onChange={e => setEditForm({...editForm, founder_ceo: e.target.value})}
                                        placeholder="e.g. John Doe"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Key Products (Comma Separated)</label>
                                <input 
                                    className="input-field" 
                                    value={editForm.key_products.join(', ')} 
                                    onChange={e => setEditForm({...editForm, key_products: e.target.value.split(',').map(s => s.trim())})}
                                    placeholder="Product A, Product B"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Mission Statement</label>
                                <textarea 
                                    className="input-field" 
                                    rows={3}
                                    value={editForm.mission_statement} 
                                    onChange={e => setEditForm({...editForm, mission_statement: e.target.value})}
                                    placeholder="Our goal is to..."
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowIdentityModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleUpdateIdentity}>Save Identity</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reality Check Action Bar */}
            <div className="card glass p-6 border-indigo-500/10 mb-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Test AI Perception</label>
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl blur opacity-20 group-focus-within:opacity-40 transition-opacity"></div>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input 
                                    type="text" 
                                    value={testPrompt}
                                    onChange={(e) => setTestPrompt(e.target.value)}
                                    placeholder="Ask the AI something about your brand..."
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-end gap-3 w-full md:w-auto h-full">
                        <button 
                            className="btn-primary whitespace-nowrap h-[54px] px-8" 
                            onClick={handleRunProbe} 
                            disabled={probing || !currentProject}
                        >
                            {probing ? (
                                <>
                                    <RefreshCcw className="w-5 h-5 animate-spin mr-2" />
                                    Analyzing Reality...
                                </>
                            ) : (
                                <>
                                    <Cpu className="w-5 h-5 mr-2" />
                                    Run Reality Check
                                </>
                            )}
                        </button>
                        <button 
                            className="btn-secondary h-[54px] px-6" 
                            onClick={() => setShowIdentityModal(true)}
                        >
                            <ShieldCheck className="w-5 h-5 mr-2" />
                            Update Truth
                        </button>
                    </div>
                </div>
            </div>

            {/* Reality Check History Feed */}
            {probes.length > 0 && (
                <div className="mb-8 animate-in fade-in duration-500">
                    <div className="flex items-center gap-2 mb-4">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recent Reality Checks</h3>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
                        {probes.map((probe: any, i: number) => (
                            <div key={i} className="min-w-[300px] bg-slate-900/40 border border-white/5 rounded-xl p-4 flex flex-col gap-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">{new Date(probe.detected_at).toLocaleTimeString()}</span>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${probe.is_accurate ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                        {probe.is_accurate ? 'Truth Match' : 'Hallucination'}
                                    </span>
                                </div>
                                <p className="text-xs text-white font-medium line-clamp-2 italic">"{probe.query}"</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Accuracy Status */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="card glass overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Cpu className="w-5 h-5 text-indigo-400" />
                                Latest AI Mentions
                            </h2>
                            <span className="text-xs text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded uppercase tracking-widest font-bold">Live Feed</span>
                        </div>
                        
                        <div className="divide-y divide-white/5">
                            {mentions.length === 0 ? (
                                <div className="p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                                    <AlertTriangle className="w-12 h-12 text-slate-600 mb-4" />
                                    <h3 className="text-lg font-medium text-slate-300 mb-2">No AI Mentions Detected</h3>
                                    <p className="text-slate-500 max-w-sm">We haven't scanned AI models for this project yet. Click "Scan AI Perception" to begin the analysis.</p>
                                </div>
                            ) : (
                                mentions.map((mention, i) => (
                                    <div key={i} className="p-6 hover:bg-white/5 transition-colors">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-white/10 flex items-center justify-center text-xl text-indigo-400 font-bold shadow-inner">
                                                    {mention.model_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-white text-lg">{mention.model_name}</h3>
                                                    <p className="text-xs text-slate-400 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(mention.detected_at).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm ${mention.is_accurate ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                                {mention.is_accurate ? 'Accurate' : 'Hallucination Detected'}
                                            </div>
                                        </div>
                                        
                                        <div className="pl-16 relative">
                                            <div className="absolute left-6 top-0 bottom-0 w-px bg-white/10"></div>
                                            <p className="text-slate-300 text-sm leading-relaxed mb-4">
                                                <span className="text-slate-500 text-2xl leading-none absolute -left-2 top-0">"</span>
                                                {mention.response_text}
                                                <span className="text-slate-500 text-2xl leading-none absolute -bottom-2 ml-1">"</span>
                                            </p>
                                            
                                            {!mention.is_accurate && (
                                                <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl relative overflow-hidden mt-4">
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500/50"></div>
                                                    <p className="text-xs font-bold text-red-400 uppercase mb-2 flex items-center gap-1">
                                                        <AlertTriangle className="w-3 h-3" /> 
                                                        Correction Required:
                                                    </p>
                                                    <p className="text-sm text-red-200/80 leading-relaxed">{mention.hallucination_details}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar: Corrections & Schema */}
                <div className="space-y-6">
                    <div className="card glass p-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Code className="w-5 h-5 text-emerald-400" />
                            <h2 className="text-lg font-bold text-white">Schema Injector</h2>
                        </div>
                        <p className="text-sm text-slate-400 mb-6 border-b border-white/5 pb-4">
                            Generated JSON-LD to feed correct information directly to AI crawlers and search engines.
                        </p>

                        <div className="space-y-4">
                            {corrections.map((c, i) => (
                                <div key={i} className="bg-slate-900/80 rounded-xl p-4 border border-white/5 shadow-inner">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded uppercase tracking-widest">{c.type} Schema</span>
                                        <CheckCircle2 className={`w-5 h-5 ${c.pushed_to_cms ? 'text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'text-slate-600'}`} />
                                    </div>
                                    <div className="bg-black/40 rounded-lg p-3 border border-white/5 mb-4">
                                        <pre className="text-[10px] text-slate-300 font-mono overflow-x-auto max-h-32 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                            {JSON.stringify(c.schema_json, null, 2)}
                                        </pre>
                                    </div>
                                    <button 
                                        onClick={async () => {
                                            if (!currentProject?._id) return;
                                            try {
                                                await aioService.applyFixes(currentProject._id, c.type);
                                                addToast({ title: `Successfully pushed ${c.type} schema to live site!`, type: 'success' });
                                                fetchData();
                                            } catch (e) {
                                                addToast({ title: `Failed to push schema`, type: 'error' });
                                            }
                                        }}
                                        disabled={c.pushed_to_cms}
                                        className="btn-secondary w-full text-xs font-bold uppercase tracking-wider py-2"
                                    >
                                        {c.pushed_to_cms ? 'Active on Live Site' : 'Deploy to CMS'}
                                    </button>
                                </div>
                            ))}
                            {corrections.length === 0 && (
                                <div className="text-center py-8">
                                    <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                                    <p className="text-xs text-slate-500 font-medium">No active corrections needed.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card bg-gradient-to-br from-indigo-900/40 to-slate-900/40 border-indigo-500/20 p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 text-indigo-300">
                            <ShieldCheck className="w-24 h-24" />
                        </div>
                        <h3 className="text-white font-bold flex items-center gap-2 mb-3 relative z-10">
                            <Info className="w-5 h-5 text-indigo-400" />
                            How AIO Works
                        </h3>
                        <p className="text-sm text-slate-300 leading-relaxed relative z-10">
                            AI Optimization (AIO) is the evolution of SEO. Instead of just ranking for keywords, it ensures that Large Language Models (ChatGPT, Gemini, Perplexity) perceive your brand authority accurately and cite you as the source of truth.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIOToolPage;
