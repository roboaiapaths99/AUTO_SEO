import api from './api';

export interface Integration {
  _id: string;
  project_id: string;
  type: 'gsc' | 'wordpress' | 'shopify';
  account_name: string;
  connected_at: string;
  status: 'active' | 'error';
  metadata: any;
}

const integrationService = {
  getIntegrations: async (projectId: string): Promise<Integration[]> => {
    const response = await api.get(`/integrations/${projectId}`);
    return response.data;
  },

  connectIntegration: async (projectId: string, type: string, config: any): Promise<Integration> => {
    const response = await api.post(`/integrations/${projectId}/connect`, {
      project_id: projectId, // Optional as backend handles it from URL, but good for completeness
      type,
      config
    });
    return response.data;
  },

  disconnectIntegration: async (projectId: string, type: string): Promise<void> => {
    await api.delete(`/integrations/${projectId}/${type}`);
  },

  verifyIntegration: async (projectId: string, type: string, config: any): Promise<any> => {
    const response = await api.post(`/integrations/${projectId}/verify/${type}`, config);
    return response.data;
  },

  getGSCAuthUrl: async (projectId: string): Promise<{ auth_url: string }> => {
    const response = await api.get(`/integrations/${projectId}/gsc/auth-url`);
    return response.data;
  },

  getGSCPerformance: async (projectId: string, days: number = 30): Promise<any> => {
    const response = await api.get(`/integrations/gsc/performance/${projectId}?days=${days}`);
    return response.data;
  }
};

export default integrationService;
