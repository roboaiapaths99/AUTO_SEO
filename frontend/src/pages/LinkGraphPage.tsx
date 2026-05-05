import React, { useState, useEffect, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { 
    GitBranch, 
    Zap, 
    Info, 
    Maximize2, 
    RefreshCw,
    Search,
    TrendingUp,
    CheckCircle2
} from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { useUIStore } from '../store/uiStore';
import { seoService } from '../services/seoService';

const LinkGraphPage: React.FC = () => {
    const { currentProject } = useProjectStore();
    const [graphData, setGraphData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedNode, setSelectedNode] = useState<any>(null);
    const [optimizationPlan, setOptimizationPlan] = useState<{url: string, plan: string} | null>(null);
    const [optimizing, setOptimizing] = useState(false);
    const [applying, setApplying] = useState(false);
    const fgRef = useRef<any>(null);

    useEffect(() => {
        if (currentProject?._id) {
            fetchGraph();
        }
    }, [currentProject?._id]);

    const fetchGraph = async () => {
        if (!currentProject?._id) return;
        setLoading(true);
        try {
            const response = await seoService.getLinkGraph(currentProject._id);
            setGraphData(response);
        } catch (error) {
            console.error("Error fetching link graph:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleNodeClick = (node: any) => {
        setSelectedNode(node);
        if (fgRef.current) {
            fgRef.current.centerAt(node.x, node.y, 1000);
            fgRef.current.zoom(2, 1000);
        }
    };

    const handleOptimize = async () => {
        if (!currentProject?._id || !selectedNode) return;
        setOptimizing(true);
        try {
            const res = await seoService.optimizeLinkFlow(currentProject._id, selectedNode.id);
            setOptimizationPlan({
                url: selectedNode.id,
                plan: res.optimization_plan
            });
        } catch (err) {
            console.error(err);
        } finally {
            setOptimizing(false);
        }
    };

    const handleApplyStrategy = async () => {
        if (!currentProject?._id || !optimizationPlan) return;
        setApplying(true);
        try {
            await seoService.applyLinkStrategy(currentProject._id, optimizationPlan.url, optimizationPlan.plan);
            useUIStore.getState().addToast({ 
                title: "Strategy Deployed", 
                message: "Internal link restructuring has been queued for your CMS.",
                type: "success" 
            });
            setOptimizationPlan(null);
        } catch (err) {
            console.error(err);
            useUIStore.getState().addToast({ title: "Deployment Failed", type: "error" });
        } finally {
            setApplying(false);
        }
    };

    const getNodeColor = (node: any) => {
        if (graphData?.stats?.orphan_pages?.includes(node.id)) return '#EF4444'; // Red for orphans
        if (graphData?.stats?.diluted_pages?.includes(node.id)) return '#F59E0B'; // Orange for diluted
        if (node.authority > 20) return '#10B981'; // Green for high authority
        return '#6366F1'; // Blue for normal
    };

    return (
        <div className="animate-fade-in" style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
            {/* Optimization Modal */}
            {optimizationPlan && (
                <div className="modal-overlay" onClick={() => setOptimizationPlan(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Zap size={24} style={{ color: 'var(--warning)' }} />
                                AI Optimization Roadmap
                            </h2>
                            <button onClick={() => setOptimizationPlan(null)} style={{ color: 'var(--text-muted)' }}>
                                <Maximize2 size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid var(--border)' }}>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, marginBottom: '4px' }}>Target URL</p>
                                <p style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600 }}>{optimizationPlan.url}</p>
                            </div>
                            <div className="card glass" style={{ padding: '24px', whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '1.1rem', color: 'var(--text-main)' }}>
                                {optimizationPlan.plan}
                            </div>
                            <div style={{ marginTop: '24px', display: 'flex', gap: '12px', alignItems: 'center', padding: '16px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                                <CheckCircle2 size={24} style={{ color: 'var(--success)' }} />
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>
                                    Implementing these changes could increase this page's relative authority by up to <strong>35%</strong> within the internal link structure.
                                </p>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setOptimizationPlan(null)}>Dismiss</button>
                            <button 
                                className="btn btn-primary" 
                                onClick={handleApplyStrategy}
                                disabled={applying}
                                style={{ background: 'var(--success)', border: 'none' }}
                            >
                                {applying ? <RefreshCw size={18} className="animate-spin" /> : <Zap size={18} />}
                                {applying ? "Deploying..." : "Apply Strategy"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <GitBranch size={36} style={{ color: 'var(--success)' }} />
                        Semantic Link-Juice Simulator
                    </h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontStyle: 'italic' }}>
                        Visualizing authority flow and identifying "Dead End" pages across your domain.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button 
                        onClick={fetchGraph}
                        className="btn btn-secondary"
                        style={{ padding: '10px' }}
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '8px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <TrendingUp size={20} style={{ color: 'var(--success)' }} />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.65rem', color: 'var(--success)', fontWeight: 600, textTransform: 'uppercase' }}>Avg Authority</span>
                                <span style={{ color: 'var(--success)', fontWeight: 800 }}>{graphData?.stats?.avg_authority || 0}</span>
                            </div>
                        </div>
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '8px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Info size={20} style={{ color: '#EF4444' }} />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.65rem', color: '#EF4444', fontWeight: 600, textTransform: 'uppercase' }}>Orphans</span>
                                <span style={{ color: '#EF4444', fontWeight: 800 }}>{graphData?.stats?.orphan_pages?.length || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Visualizer Area */}
            <div style={{ flex: 1, display: 'flex', gap: '24px', minHeight: 0 }}>
                {/* Graph Canvas */}
                <div className="card glass" style={{ flex: 1, padding: 0, position: 'relative', overflow: 'hidden', display: 'flex', border: '1px solid var(--border)' }}>
                    {loading ? (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                            <div style={{ width: '48px', height: '48px', border: '4px solid rgba(16, 185, 129, 0.3)', borderTopColor: 'var(--success)', borderRadius: '50%' }} className="animate-spin"></div>
                            <p style={{ color: 'var(--text-muted)', fontWeight: 600 }} className="animate-pulse">Running PageRank Simulation...</p>
                        </div>
                    ) : graphData ? (
                        <ForceGraph2D
                            ref={fgRef}
                            graphData={graphData}
                            nodeLabel={(node: any) => `
                                <div class="premium-tooltip" style="
                                    background: rgba(15, 23, 42, 0.95);
                                    border: 1px solid rgba(99, 102, 241, 0.3);
                                    padding: 16px;
                                    border-radius: 12px;
                                    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
                                    backdrop-filter: blur(8px);
                                    min-width: 200px;
                                    font-family: 'Inter', sans-serif;
                                ">
                                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                                        <div style="font-weight: 800; color: #fff; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 150px;">
                                            ${node.id.split('/').pop() || 'index'}
                                        </div>
                                        <div style="font-size: 10px; color: ${node.authority > 20 ? '#10B981' : '#6366F1'}; font-weight: 900; background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px;">
                                            AUTH: ${node.authority}
                                        </div>
                                    </div>
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px;">
                                        <div>
                                            <div style="color: #64748b; font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em;">In-Links</div>
                                            <div style="color: #fff; font-weight: 700;">${node.in_links}</div>
                                        </div>
                                        <div>
                                            <div style="color: #64748b; font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em;">Out-Links</div>
                                            <div style="color: #fff; font-weight: 700;">${node.out_links}</div>
                                        </div>
                                    </div>
                                    <div style="margin-top: 12px; font-size: 10px; color: #94a3b8; font-style: italic;">
                                        Click to open AI Optimizer
                                    </div>
                                </div>
                            `}
                            nodeColor={getNodeColor}
                            nodeRelSize={6}
                            nodeVal={(node: any) => Math.sqrt(node.authority + 1) * 2}
                            onNodeClick={handleNodeClick}
                            linkColor={() => 'rgba(255,255,255,0.08)'}
                            linkWidth={1}
                            linkDirectionalArrowLength={3}
                            linkDirectionalArrowRelPos={1}
                            backgroundColor="#0b0f1a"
                        />
                    ) : (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            No graph data available. Run an audit first.
                        </div>
                    )}
                    
                    {/* Controls Overlay */}
                    <div style={{ position: 'absolute', bottom: '24px', left: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div className="card glass" style={{ padding: '16px', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '0.1em' }}>
                                Link Architecture Legend
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--success)' }}></div>
                                    <span style={{ color: 'var(--text-main)', fontSize: '0.75rem' }}>High Authority Hub</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#6366F1' }}></div>
                                    <span style={{ color: 'var(--text-main)', fontSize: '0.75rem' }}>Standard Content Page</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#F59E0B' }}></div>
                                    <span style={{ color: 'var(--text-main)', fontSize: '0.75rem' }}>Diluted Hub (&gt;50 links)</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#EF4444' }}></div>
                                    <span style={{ color: 'var(--text-main)', fontSize: '0.75rem' }}>Orphan Page (No In-links)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Details */}
                <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '24px', flexShrink: 0, overflowY: 'auto' }}>
                    {selectedNode ? (
                        <div className="card glass animate-slide-in-right" style={{ padding: '24px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                            <h3 style={{ color: 'var(--success)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem', marginBottom: '16px', letterSpacing: '-0.02em' }}>Page Intelligence</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '4px' }}>URL Path</p>
                                    <p style={{ color: 'var(--text-main)', fontFamily: 'monospace', fontSize: '0.875rem', wordBreak: 'break-all', fontWeight: 600 }}>{selectedNode.id}</p>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase' }}>In-Links</p>
                                        <p style={{ color: 'var(--text-main)', fontSize: '1.25rem', fontWeight: 800 }}>{selectedNode.in_links}</p>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase' }}>Out-Links</p>
                                        <p style={{ color: 'var(--text-main)', fontSize: '1.25rem', fontWeight: 800 }}>{selectedNode.out_links}</p>
                                    </div>
                                </div>
                                <div>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '4px' }}>Relative Authority</p>
                                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                                        <span style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1 }}>{selectedNode.authority}</span>
                                        <span style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>/ 100</span>
                                    </div>
                                    <div style={{ width: '100%', background: 'var(--bg-main)', height: '8px', borderRadius: '100px', marginTop: '12px', overflow: 'hidden' }}>
                                        <div 
                                            style={{ 
                                                background: selectedNode.authority > 20 ? 'var(--success)' : '#6366F1', 
                                                height: '100%', 
                                                width: `${Math.min(selectedNode.authority * 5, 100)}%`, 
                                                transition: 'width 1s ease' 
                                            }}
                                        ></div>
                                    </div>
                                </div>
                                <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border)', marginTop: '8px' }}>
                                    <button 
                                        onClick={handleOptimize}
                                        disabled={optimizing}
                                        className="btn btn-primary"
                                        style={{ width: '100%', background: 'var(--success)', border: 'none', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}
                                    >
                                        {optimizing ? (
                                            <RefreshCw size={16} className="animate-spin" />
                                        ) : (
                                            <Zap size={16} />
                                        )}
                                        {optimizing ? "Generating Plan..." : "Optimize Flow"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="card glass" style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                            <Info size={40} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Select a page node to view detailed link-juice metrics and AI-powered redistribution plans.</p>
                        </div>
                    )}

                    <div className="card" style={{ padding: '24px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                        <h3 style={{ color: 'var(--text-main)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '0.875rem' }}>
                            <Zap size={16} style={{ color: 'var(--warning)' }} />
                            AI Insight
                        </h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-main)', lineHeight: '1.6', fontStyle: 'italic', opacity: 0.9 }}>
                            {graphData?.stats?.orphan_pages?.length > 0 
                                ? `Found ${graphData.stats.orphan_pages.length} orphan pages. These pages have zero internal links and are not receiving any authority.`
                                : "Link structure appears healthy. Most pages are well-connected to the core hierarchy."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LinkGraphPage;
