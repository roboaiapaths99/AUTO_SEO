import api from './api';

/**
 * AutoSEO AI Platform — Site Audit Service
 * ========================================
 * Handles site crawls and audit reports.
 */

export const auditService = {
  startCrawl: async (projectId: string, domain: string) => {
    const { data } = await api.post('/audit/crawl', { project_id: projectId, domain });
    return data; // Returns { job_id }
  },

  getCrawlStatus: async (jobId: string) => {
    const { data } = await api.get(`/audit/status/${jobId}`);
    return data;
  },

  getLatestReport: async (projectIdOrDomain: string) => {
    const { data } = await api.get(`/audit/report/${projectIdOrDomain}`);
    return data;
  },

  generateRoadmap: async (projectId: string) => {
    const { data } = await api.get(`/audit/roadmap/${projectId}`);
    return data;
  },

  getActiveJob: async (projectId: string) => {
    const { data } = await api.get(`/audit/active-job/${projectId}`);
    return data;
  },
};
