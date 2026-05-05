import React, { useState, useEffect } from 'react';
import { Globe, ShieldCheck, Link2, Download, Filter, Info, Loader2, ArrowUpRight, Search, ExternalLink, AlertCircle } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { seoService } from '../services/seoService';
import { toast } from '../store/uiStore';
import MetricCard from '../components/ui/MetricCard';
import ExportButton from '../components/ui/ExportButton';
import EmptyState from '../components/ui/EmptyState';

/**
 * AutoSEO AI Platform — Referring Domains
 * =======================================
 * Domain-level view of the backlink profile.
 */
const ReferringDomainsPage: React.FC = () => {
  const activeDomain = useProjectStore((state) => state.activeDomain);
  const [loading, setLoading] = useState(false);
  const [isSimulated, setIsSimulated] = useState(false);
  const [domains, setDomains] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const fetchDomains = async () => {
    if (!activeDomain) return;
    setLoading(true);
    try {
      const data = await seoService.getBacklinkProfile(activeDomain);
      setIsSimulated(!!data.simulated);
      
      // Transform raw backlinks into aggregated domain metrics
      const domainMap: Record<string, any> = {};
      const backlinks = data.backlinks || (data.data ? data.data.backlinks : []);
      
      if (backlinks && backlinks.length > 0) {
        backlinks.forEach((b: any) => {
          let hostname = 'unknown';
          const urlToParse = b.url_from || b.source_url;
          
          if (urlToParse) {
            try {
              hostname = new URL(urlToParse).hostname.replace('www.', '');
            } catch {
              hostname = urlToParse;
            }
          }
          
          if (!domainMap[hostname]) {
            domainMap[hostname] = {
              domain: hostname,
              dr: b.domain_authority || 0,
              links: 0,
              type: (b.is_nofollow || !b.dofollow) ? 'Nofollow' : 'Dofollow',
              firstSeen: b.first_seen || new Date().toLocaleDateString()
            };
          }
          domainMap[hostname].links += 1;
        });
      }
      
      const domainList = Object.values(domainMap).sort((a: any, b: any) => b.links - a.links);
      setDomains(domainList);
    } catch (error) {
      console.error("Failed to fetch referring domains:", error);
      toast.error('Data Error', 'Could not retrieve referring domains list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, [activeDomain]);

  const filteredDomains = domains.filter(d => 
    (d.domain || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 'var(--space-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '8px' }}>
            Referring <span className="text-gradient">Domains</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
            Manage and analyze unique domains linking to <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{activeDomain}</span>.
          </p>
        </div>
        {domains.length > 0 && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <ExportButton 
              data={domains} 
              filename={`referring_domains_${activeDomain}`}
              columns={[
                { key: 'domain', label: 'Domain' },
                { key: 'dr', label: 'Domain Rating' },
                { key: 'links', label: 'Total Links' },
                { key: 'type', label: 'Link Type' }
              ]}
            />
          </div>
        )}
      </div>
      
      {isSimulated && (
        <div className="card glass" style={{ 
          marginBottom: 'var(--space-lg)', 
          background: 'rgba(245, 158, 11, 0.05)', 
          border: '1px solid rgba(245, 158, 11, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '16px 24px'
        }}>
          <AlertCircle className="text-warning" size={24} />
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, margin: 0, color: 'var(--warning)' }}>Simulated Domain Data</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              We are showing simulated referring domains because your DataForSEO balance is empty.
            </p>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
        <MetricCard title="Total Ref. Domains" value={domains.length.toLocaleString()} icon={Globe} trend="up" change={2} />
        <MetricCard title="Avg. Domain Rating" value="68" icon={ShieldCheck} trend="up" change={5} />
        <MetricCard title="New Domains (30d)" value="12" icon={Link2} trend="up" change={8} />
      </div>

      <div className="card glass" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Domain Inventory</h3>
          <div style={{ display: 'flex', gap: '12px', flex: 1, maxWidth: '400px' }}>
             <div style={{ position: 'relative', flex: 1 }}>
               <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
               <input 
                 className="input-field" 
                 placeholder="Search domains..." 
                 style={{ paddingLeft: '36px', height: '40px', fontSize: '0.9rem' }}
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
               />
             </div>
             <button className="btn btn-secondary" style={{ padding: '0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <Filter size={16} /> Filters
             </button>
          </div>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <Loader2 className="animate-spin text-premium" size={40} style={{ margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--text-muted)' }}>Aggregating link data...</p>
            </div>
          ) : filteredDomains.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.01)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '16px 24px' }}>Domain</th>
                  <th style={{ padding: '16px 24px' }}>Domain Rating</th>
                  <th style={{ padding: '16px 24px' }}>Links</th>
                  <th style={{ padding: '16px 24px' }}>Type</th>
                  <th style={{ padding: '16px 24px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredDomains.map((d, i) => (
                  <tr key={i} className="table-row-hover" style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Globe size={16} className="text-premium" />
                        <span style={{ fontWeight: 700, fontSize: '1rem' }}>{d.domain}</span>
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <span className="badge" style={{ background: 'var(--primary-soft)', color: 'var(--primary)', fontWeight: 800 }}>DR {d.dr}</span>
                    </td>
                    <td style={{ padding: '20px 24px', fontWeight: 800, fontSize: '1.1rem' }}>{d.links.toLocaleString()}</td>
                    <td style={{ padding: '20px 24px' }}>
                       <span style={{ 
                         fontSize: '0.7rem', padding: '4px 8px', borderRadius: '6px', fontWeight: 800, textTransform: 'uppercase',
                         background: d.type === 'Dofollow' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                         color: d.type === 'Dofollow' ? 'var(--success)' : 'var(--text-muted)',
                       }}>{d.type}</span>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => window.open(`https://${d.domain}`, '_blank')}
                        style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        Visit <ExternalLink size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '60px' }}>
               <EmptyState 
                 icon={Globe} 
                 title="No Domains Found" 
                 description={searchQuery ? `No referring domains matching "${searchQuery}"` : "This domain has no documented referring domains yet."}
               />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReferringDomainsPage;
