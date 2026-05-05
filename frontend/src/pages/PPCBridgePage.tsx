import React, { useState, useEffect } from 'react';
import { 
    Zap, 
    Target, 
    DollarSign, 
    TrendingUp, 
    Search,
    ShieldAlert,
    ArrowRight,
    Loader2,
    Users
} from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { useUIStore } from '../store/uiStore';
import api from '../services/api';

interface PPCOpportunity {
    keyword: string;
    est_cpc: string;
    intent: string;
    strategy: string;
    potential_savings: string;
}

const PPCBridgePage: React.FC = () => {
    const { currentProject } = useProjectStore();
    const { addToast } = useUIStore();
    
    const [opportunities, setOpportunities] = useState<PPCOpportunity[]>([]);
    const [competitors, setCompetitors] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    
    const [inputDomain, setInputDomain] = useState(currentProject?.domain || '');
    const [inputCompetitors, setInputCompetitors] = useState('');

    useEffect(() => {
        if (currentProject?.domain) {
            setInputDomain(currentProject.domain);
        }
    }, [currentProject]);

    const fetchOpportunities = async () => {
        if (!inputDomain) return;
        setLoading(true);
        try {
            const params: any = { 
                domain: inputDomain 
            };
            if (currentProject?._id) {
                params.project_id = currentProject._id;
            }
            if (inputCompetitors) {
                params.competitors = inputCompetitors.split(',').map(c => c.trim()).filter(c => c);
            }
            
            const response = await api.get('/competitors/ppc-bridge', { params });
            setOpportunities(response.data.opportunities || []);
            setCompetitors(response.data.competitors_analyzed || []);
        } catch (error) {
            addToast({ type: 'error', title: "Failed to fetch PPC opportunities." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
            {/* Header */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Users size={36} style={{ color: 'var(--danger)' }} />
                        PPC-to-SEO "War Room"
                    </h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
                        Stealing competitor paid traffic by outranking them organically for their most expensive keywords.
                    </p>
                </div>
            </div>
            
            {/* Input Form */}
            <div className="card glass" style={{ padding: '24px', display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Target Domain</label>
                    <input 
                        type="text" 
                        placeholder="e.g. yourdomain.com"
                        value={inputDomain}
                        onChange={(e) => setInputDomain(e.target.value)}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }}
                    />
                </div>
                <div style={{ flex: '2 1 300px' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Competitors (Comma Separated)</label>
                    <input 
                        type="text" 
                        placeholder="e.g. competitor1.com, competitor2.com"
                        value={inputCompetitors}
                        onChange={(e) => setInputCompetitors(e.target.value)}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }}
                    />
                </div>
                <button 
                    onClick={fetchOpportunities}
                    disabled={loading || !inputDomain}
                    className="btn btn-primary"
                    style={{ padding: '12px 24px', height: '48px', opacity: loading || !inputDomain ? 0.7 : 1 }}
                >
                    {loading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                    Scan Competitors
                </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {competitors.map((comp, i) => (
                    <span key={i} style={{ padding: '4px 12px', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.75rem', borderRadius: '100px', border: '1px solid var(--border)' }}>
                        {comp}
                    </span>
                ))}
            </div>

            {loading ? (
                <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                    <Loader2 size={40} className="animate-spin" style={{ color: 'var(--danger)' }} />
                    <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontStyle: 'italic' }}>Analyzing competitor ad spend and organic gaps...</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {opportunities.length === 0 ? (
                        <div className="card glass" style={{ textAlign: 'center', padding: '48px 24px' }}>
                            <Target size={64} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>No Opportunities Found Yet</h3>
                            <p style={{ color: 'var(--text-muted)', marginTop: '8px', maxWidth: '500px', margin: '8px auto 0' }}>
                                Run a competitor scan to identify where they are bidding on keywords you could win organically.
                            </p>
                            <button 
                                onClick={fetchOpportunities}
                                className="btn btn-primary"
                                style={{ marginTop: '24px' }}
                            >
                                Start Competitor Scan
                            </button>
                        </div>
                    ) : (
                        opportunities.map((opp, i) => (
                            <div key={i} className="card glass" style={{ padding: '32px', display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'center' }}>
                                {/* Keyword Info */}
                                <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)' }}>
                                            <Search size={24} />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>{opp.keyword}</h3>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{opp.intent} Intent</span>
                                        </div>
                                    </div>
                                    <div style={{ padding: '16px', background: 'var(--bg-main)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.6' }}>
                                            <span style={{ color: 'var(--text-main)', fontWeight: 800 }}>Organic Strategy:</span> {opp.strategy}
                                        </p>
                                    </div>
                                </div>

                                {/* Stats Card */}
                                <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: '16px', width: '250px' }}>
                                    <div style={{ background: 'var(--bg-main)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ padding: '8px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px' }}>
                                            <DollarSign size={20} style={{ color: 'var(--warning)' }} />
                                        </div>
                                        <div>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.1em' }}>Est. CPC</p>
                                            <p style={{ color: 'var(--text-main)', fontWeight: 800, fontSize: '1.125rem' }}>{opp.est_cpc}</p>
                                        </div>
                                    </div>
                                    <div style={{ background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>
                                            <TrendingUp size={20} style={{ color: 'var(--success)' }} />
                                        </div>
                                        <div>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.1em' }}>Monthly Value</p>
                                            <p style={{ color: 'var(--success)', fontWeight: 800, fontSize: '1.125rem' }}>{opp.potential_savings}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Action */}
                                <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <button 
                                        onClick={async () => {
                                            const originalText = document.getElementById(`btn-text-${i}`)?.innerText;
                                            const btn = document.getElementById(`btn-${i}`) as HTMLButtonElement;
                                            const textSpan = document.getElementById(`btn-text-${i}`);
                                            if (btn && textSpan) {
                                                btn.disabled = true;
                                                textSpan.innerText = 'Generating...';
                                            }
                                            try {
                                                const res = await api.post('/content/generate', { 
                                                    keyword: opp.keyword,
                                                    content_type: 'landing_page'
                                                });
                                                // Create a blob and download it or just alert the first 500 chars
                                                const content = res.data.content;
                                                alert(`Successfully generated content for "${opp.keyword}"!\n\nPreview:\n${content.substring(0, 500)}...`);
                                            } catch (err) {
                                                alert(`Failed to generate content for ${opp.keyword}`);
                                            } finally {
                                                if (btn && textSpan) {
                                                    btn.disabled = false;
                                                    textSpan.innerText = originalText || 'Generate SEO Page';
                                                }
                                            }
                                        }}
                                        id={`btn-${i}`}
                                        className="btn btn-secondary"
                                        style={{ width: '100%', padding: '16px 24px', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                    >
                                        <span id={`btn-text-${i}`}>Generate SEO Page</span>
                                        <ArrowRight size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Bottom Tip */}
            <div className="premium-gradient" style={{ borderRadius: 'var(--radius-lg)', padding: '32px', display: 'flex', alignItems: 'center', gap: '24px', color: 'white', marginTop: '16px' }}>
                <ShieldAlert size={48} style={{ opacity: 0.8 }} />
                <div>
                    <h4 style={{ fontWeight: 800, fontSize: '1.125rem' }}>Why this matters?</h4>
                    <p style={{ fontSize: '0.875rem', marginTop: '8px', opacity: 0.9, lineHeight: '1.6' }}>
                        By identifying high-CPC keywords your competitors are bidding on, you can target those same users with high-quality organic content. This doesn't just save you money on ads; it captures the same high-intent traffic permanently.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PPCBridgePage;
