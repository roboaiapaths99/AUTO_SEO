import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { useUIStore, toast } from '../../store/uiStore';
import { Search, Layout, ShoppingBag, CheckCircle, Loader2 } from 'lucide-react';
import integrationService from '../../services/integrationService';

interface IntegrationModalProps {
  projectId: string;
  onConnected: () => void;
}

const IntegrationModal: React.FC<IntegrationModalProps> = ({ projectId, onConnected }) => {
  const { closeModal } = useUIStore();
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    url: '',
    username: '',
    password: '', // For WP Application Password
    token: ''     // For Shopify Access Token
  });

  const integrations = [
    {
      id: 'gsc',
      name: 'Google Search Console',
      description: 'Import search traffic, keywords, and indexing data directly.',
      icon: <Search className="text-blue-400" size={32} />,
      color: 'rgba(66, 133, 244, 0.1)',
      comingSoon: false
    },
    {
      id: 'wordpress',
      name: 'WordPress',
      description: 'Apply SEO fixes and optimize content directly from the dashboard.',
      icon: <Layout className="text-blue-500" size={32} />,
      color: 'rgba(33, 117, 155, 0.1)',
      comingSoon: false
    },
    {
      id: 'shopify',
      name: 'Shopify',
      description: 'Automate product SEO and meta-tag optimization for your store.',
      icon: <ShoppingBag className="text-green-500" size={32} />,
      color: 'rgba(149, 191, 71, 0.1)',
      comingSoon: false
    }
  ];

  const handleConnect = async (e: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!selectedType) return;

    setLoading(true);
    try {
      const config: any = { url: formData.url };
      
      if (selectedType === 'wordpress') {
        config.username = formData.username;
        config.password = formData.password;
      } else if (selectedType === 'shopify') {
        config.token = formData.token;
      } else if (selectedType === 'gsc') {
        const data = await integrationService.getGSCAuthUrl(projectId);
        if (data.auth_url) {
          window.location.href = data.auth_url;
        }
        return;
      }
      
      await integrationService.connectIntegration(projectId, selectedType, config);
      
      toast.success(`${selectedType.toUpperCase()} connected successfully!`);
      onConnected();
      closeModal();
    } catch (error: any) {
      console.error("Connection error:", error);
      const detail = error.response?.data?.detail || error.message || 'Please check your credentials.';
      toast.error(`Failed to connect ${selectedType}`, detail);
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    const isWP = selectedType === 'wordpress';
    const isShopify = selectedType === 'shopify';
    const isGSC = selectedType === 'gsc';

    if (isGSC) {
      return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <button 
            type="button" 
            onClick={() => setSelectedType(null)}
            style={{ alignSelf: 'flex-start', fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '8px' }}
          >
            ← Back to integrations
          </button>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Connect Google Search Console</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            To import search traffic data, you'll need to authorize AutoSEO to access your Search Console properties.
          </p>
          
          <button 
            onClick={handleConnect} 
            className="btn btn-secondary" 
            style={{ 
              marginTop: 'var(--space-md)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '12px',
              padding: '12px',
              background: '#fff',
              color: '#000',
              border: '1px solid #ddd'
            }} 
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (
              <>
                <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" style={{ width: '20px' }} />
                Sign in with Google
              </>
            )}
          </button>
        </div>
      );
    }

    return (
      <form onSubmit={handleConnect} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <button 
          type="button" 
          onClick={() => setSelectedType(null)}
          style={{ alignSelf: 'flex-start', fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '8px' }}
        >
          ← Back to integrations
        </button>
        
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Connect {selectedType === 'wordpress' ? 'WordPress' : 'Shopify'}</h3>
        
        <div>
          <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
            {isWP ? 'Website URL' : 'Shop URL'}
          </label>
          <input
            type="url"
            className="input-field"
            placeholder={isWP ? 'https://yourwebsite.com' : 'https://your-store.myshopify.com'}
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            required
          />
        </div>

        {isWP && (
          <>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>WordPress Username</label>
              <input
                type="text"
                className="input-field"
                placeholder="admin"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Application Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="abcd efgh ijkl mnop"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Generate this in your WordPress profile settings (Users &gt; Profile).
              </p>
            </div>
          </>
        )}

        {isShopify && (
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Admin API Access Token</label>
            <input
              type="password"
              className="input-field"
              placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxx"
              value={formData.token}
              onChange={(e) => setFormData({ ...formData, token: e.target.value })}
              required
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Create a custom app in your Shopify Admin to get an access token.
            </p>
          </div>
        )}

        <button type="submit" className="btn btn-primary" style={{ marginTop: 'var(--space-md)' }} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" size={18} /> : 'Verify & Connect'}
        </button>
      </form>
    );
  };

  return (
    <Modal name="connect-integration" title="Connect Integration" width="600px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {selectedType ? renderForm() : (
          <>
            <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
              Link your external platforms to unlock AI-powered automated fixes and deeper data insights.
            </p>

            {integrations.map((item) => (
              <div
                key={item.id}
                className="card-hover"
                style={{
                  padding: 'var(--space-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-lg)',
                  cursor: item.comingSoon ? 'default' : 'pointer',
                  border: '1px solid rgba(255,255,255,0.05)',
                  opacity: item.comingSoon ? 0.6 : 1
                }}
                onClick={() => !item.comingSoon && setSelectedType(item.id)}
              >
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: item.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontWeight: 700, marginBottom: '4px' }}>{item.name}</h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{item.description}</p>
                </div>
                <div>
                  <button 
                    className={`btn ${item.comingSoon ? 'btn-secondary' : 'btn-primary'}`} 
                    style={{ padding: '8px 16px' }}
                    disabled={item.comingSoon}
                  >
                    {item.comingSoon ? 'Coming Soon' : 'Connect'}
                  </button>
                </div>
              </div>
            ))}

            <div style={{ 
              marginTop: 'var(--space-lg)', 
              padding: 'var(--space-md)', 
              background: 'rgba(255,255,255,0.03)', 
              borderRadius: '12px',
              display: 'flex',
              gap: 'var(--space-md)',
              alignItems: 'center'
            }}>
              <CheckCircle size={20} className="text-primary" />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Your data is encrypted and used only for SEO analysis.
              </span>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default IntegrationModal;
