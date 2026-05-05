import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, Mail, Lock, Shield, Save, Loader2, Key, Bell, Palette, Layers, Link as LinkIcon, CheckCircle, ShoppingBag } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useProjectStore } from '../store/projectStore';
import { toast, useUIStore } from '../store/uiStore';
import api from '../services/api';
import integrationService from '../services/integrationService';
import type { Integration } from '../services/integrationService';
import IntegrationModal from '../components/modals/IntegrationModal';

/**
 * AutoSEO AI Platform — Settings Page
 * ===================================
 * User profile management, password change, and preferences.
 */

const SettingsPage: React.FC = () => {
  const currentUser = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);

  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
  const [loading, setLoading] = useState(false);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  
  const { openModal } = useUIStore();
  const currentProject = useProjectStore((state) => state.currentProject);

  useEffect(() => {
    const integration = searchParams.get('integration');
    const status = searchParams.get('status');
    if (integration === 'gsc' && status === 'success') {
      setActiveTab('integrations');
      toast.success('Google Search Console Connected', 'Your account has been successfully linked.');
      // Remove query params
      setSearchParams(new URLSearchParams());
    }
  }, [searchParams, setSearchParams]);

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

  // Profile form
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [email, setEmail] = useState(currentUser?.email || '');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/auth/me', { full_name: fullName, email });
      setAuth(res.data, accessToken || '', refreshToken || '');
      toast.success('Profile updated', 'Your changes have been saved.');
    } catch (err: any) {
      toast.error('Update failed', err.response?.data?.detail || 'Could not save profile changes.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords don\'t match', 'Please make sure both password fields match.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password too short', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await api.put('/auth/password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success('Password changed', 'Your password has been updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error('Password change failed', err.response?.data?.detail || 'Could not update password.');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'api', label: 'API Keys', icon: Key },
    { id: 'integrations', label: 'Integrations', icon: Layers },
    { id: 'team', label: 'Team', icon: User },
    { id: 'billing', label: 'Billing', icon: ShoppingBag },
  ];

  // Preferences form
  const [preferences, setPreferences] = useState(currentUser?.preferences || {
    email_notifications: true,
    security_alerts: true,
    newsletter: false,
    audit_reports: true
  });

  // API Keys state
  const [apiKeys, setApiKeys] = useState<any[]>(currentUser?.api_keys || []);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const handleTogglePreference = (key: string) => {
    setPreferences((prev: any) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSavePreferences = async () => {
    setLoading(true);
    try {
      const res = await api.put('/auth/preferences', preferences);
      setAuth(res.data, accessToken || '', refreshToken || '');
      toast.success('Preferences saved', 'Your notification settings have been updated.');
    } catch (err: any) {
      toast.error('Save failed', 'Could not update preferences.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Name required', 'Please give your API key a name.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/v1/auth/api-keys', { name: newKeyName });
      setGeneratedKey(res.data.key);
      toast.success('Key generated', 'Make sure to copy it now, it won\'t be shown again.');
      setNewKeyName('');
      // Refresh user to get updated list
      const userRes = await api.get('/auth/me');
      setAuth(userRes.data, accessToken || '', refreshToken || '');
      setApiKeys(userRes.data.api_keys || []);
    } catch (err: any) {
      toast.error('Generation failed', 'Could not create API key.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKey = async (key: string) => {
    try {
      await api.delete(`/api/v1/auth/api-keys/${key}`);
      const updatedKeys = apiKeys.filter(k => k.key !== key);
      setApiKeys(updatedKeys);
      toast.success('Key deleted');
    } catch (err: any) {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '8px' }}>
          <span className="text-gradient">Settings</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
          Manage your account preferences and security settings.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 'var(--space-xl)' }}>
        {/* Sidebar tabs */}
        <div className="card-static" style={{ padding: '8px', height: 'fit-content' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                width: '100%',
                textAlign: 'left',
                borderRadius: 'var(--radius-sm)',
                fontWeight: activeTab === tab.id ? 600 : 500,
                fontSize: '0.875rem',
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-main)',
                background: activeTab === tab.id ? 'var(--primary-soft)' : 'transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="card-static animate-fade-in">
              <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>Profile Information</h3>
              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', maxWidth: '500px' }}>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      className="input-field"
                      style={{ paddingLeft: '40px' }}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="email"
                      className="input-field"
                      style={{ paddingLeft: '40px' }}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Account Plan</label>
                  <div style={{
                    padding: '12px 16px',
                    background: 'var(--primary-soft)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{currentUser?.plan || 'Free'} Plan</span>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Current active subscription</p>
                    </div>
                    <button type="button" className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '6px 16px' }}>
                      Upgrade
                    </button>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: 'fit-content' }} disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Save Changes</>}
                </button>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="card-static animate-fade-in">
              <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>Change Password</h3>
              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', maxWidth: '500px' }}>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Current Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="password"
                      className="input-field"
                      style={{ paddingLeft: '40px' }}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="password"
                      className="input-field"
                      style={{ paddingLeft: '40px' }}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Confirm New Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="password"
                      className="input-field"
                      style={{ paddingLeft: '40px' }}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>
                  {newPassword && confirmPassword && newPassword !== confirmPassword && (
                    <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px' }}>Passwords do not match</p>
                  )}
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: 'fit-content' }} disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <><Shield size={18} /> Update Password</>}
                </button>
              </form>

              <div style={{ marginTop: '40px', padding: '24px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '16px', border: '1px dashed rgba(99, 102, 241, 0.2)' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ padding: '12px', background: 'var(--primary-soft)', borderRadius: '12px', color: 'var(--primary)' }}>
                    <Shield size={24} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>Two-Factor Authentication (2FA)</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
                      Add an extra layer of security to your account by requiring a code from your phone in addition to your password.
                    </p>
                    <button className="btn btn-secondary" style={{ fontSize: '0.8rem', opacity: 0.7 }} disabled>
                      Coming Soon to Enterprise
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="card-static animate-fade-in">
              <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>Notification Preferences</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-xl)' }}>
                Choose how you want to be notified about your SEO projects and account activity.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {[
                  { id: 'email_notifications', label: 'Email Notifications', desc: 'Receive summaries and important updates via email.', icon: Mail },
                  { id: 'security_alerts', label: 'Security Alerts', desc: 'Get notified about new logins and security-related changes.', icon: Shield },
                  { id: 'audit_reports', label: 'Audit Reports', desc: 'Automated technical SEO audit reports.', icon: Layers },
                  { id: 'newsletter', label: 'SEO Insights Newsletter', desc: 'Tips and industry news to stay ahead.', icon: Bell }
                ].map((item) => (
                  <div key={item.id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '16px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '12px',
                    border: '1px solid var(--border)'
                  }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ padding: '10px', background: 'var(--primary-soft)', borderRadius: '10px', color: 'var(--primary)' }}>
                        <item.icon size={20} />
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.label}</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.desc}</p>
                      </div>
                    </div>
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={(preferences as any)[item.id]} 
                        onChange={() => handleTogglePreference(item.id)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                ))}
                <button 
                  className="btn btn-primary" 
                  style={{ width: 'fit-content', marginTop: '12px' }} 
                  onClick={handleSavePreferences}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Save Preferences</>}
                </button>
              </div>
            </div>
          )}

          {/* API Keys Tab */}
          {activeTab === 'api' && (
            <div className="card-static animate-fade-in">
              <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>API Keys</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>
                Use API keys to access AutoSEO programmatically from your own applications or scripts.
              </p>
              
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Key name (e.g. Production Server)" 
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                  <button 
                    className="btn btn-primary" 
                    onClick={handleGenerateKey}
                    disabled={loading || !newKeyName}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    Generate Key
                  </button>
                </div>

                {generatedKey && (
                  <div style={{ 
                    padding: '16px', 
                    background: 'rgba(34, 197, 94, 0.1)', 
                    border: '1px solid rgba(34, 197, 94, 0.2)',
                    borderRadius: '12px',
                    marginBottom: '20px'
                  }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Key Generated Successfully
                    </p>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <code style={{ flex: 1, background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '4px', fontSize: '0.9rem', color: '#fff' }}>
                        {generatedKey}
                      </code>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '8px' }}
                        onClick={() => {
                          navigator.clipboard.writeText(generatedKey);
                          toast.success('Copied to clipboard');
                        }}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>Active Keys</h4>
                {apiKeys.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No active API keys found.</p>
                  </div>
                ) : (
                  apiKeys.map((key, i) => (
                    <div key={i} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      padding: '16px',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: '12px',
                      border: '1px solid var(--border)'
                    }}>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ padding: '10px', background: 'var(--bg-main)', borderRadius: '10px', color: 'var(--text-muted)' }}>
                          <Key size={20} />
                        </div>
                        <div>
                          <p style={{ fontWeight: 600 }}>{key.name}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Created on {new Date(key.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteKey(key.key)}
                        style={{ 
                          padding: '8px 12px', 
                          color: '#ef4444', 
                          fontSize: '0.8rem', 
                          fontWeight: 600,
                          background: 'rgba(239, 68, 68, 0.1)',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        Revoke
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Team Tab */}
          {activeTab === 'team' && (
            <div className="card-static animate-fade-in text-center" style={{ padding: '60px 20px' }}>
              <div style={{ 
                width: '80px', height: '80px', 
                background: 'var(--primary-soft)', 
                borderRadius: '50%', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px',
                color: 'var(--primary)'
              }}>
                <User size={40} />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px' }}>Team Management</h3>
              <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto 24px' }}>
                Collaborate with your team, assign roles, and manage permissions across projects.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button className="btn btn-primary" onClick={() => toast.info('Team features are coming soon!')}>
                  Invite Member
                </button>
                <button className="btn btn-secondary">
                  Learn More
                </button>
              </div>
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div className="card-static animate-fade-in">
              <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>Subscription & Billing</h3>
              <div style={{ 
                padding: '24px', 
                background: 'linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%)',
                borderRadius: '20px',
                color: 'white',
                marginBottom: '24px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '4px' }}>Current Plan</p>
                    <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>{currentUser?.plan || 'Free'} Edition</h2>
                  </div>
                  <div style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.2)', borderRadius: '100px', fontSize: '0.875rem', fontWeight: 600 }}>
                    Active
                  </div>
                </div>
                <p style={{ marginTop: '24px', fontSize: '0.9rem', opacity: 0.9 }}>
                  Your next billing date is <strong>June 4, 2026</strong>
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                <div style={{ padding: '20px', background: 'var(--bg-main)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                  <h4 style={{ fontWeight: 600, marginBottom: '12px' }}>Payment Method</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', background: 'white', borderRadius: '4px' }}>
                      <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" style={{ width: '40px' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Visa ending in 4242</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Expires 12/28</p>
                    </div>
                  </div>
                </div>
                <div style={{ padding: '20px', background: 'var(--bg-main)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                  <h4 style={{ fontWeight: 600, marginBottom: '12px' }}>Billing Contact</h4>
                  <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{currentUser?.full_name}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{currentUser?.email}</p>
                </div>
              </div>
              
              <button className="btn btn-secondary" style={{ marginTop: '24px' }} onClick={() => toast.info('Billing portal opening...')}>
                View Invoice History
              </button>
            </div>
          )}
        </div>
      </div>

      {currentProject?._id && (
        <IntegrationModal
          projectId={currentProject._id}
          onConnected={loadIntegrations}
        />
      )}
    </div>
  );
};

export default SettingsPage;
