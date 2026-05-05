import api from './api';

/**
 * AutoSEO AI Platform — SEO Data Service
 * =====================================
 * Handles domain overview, keyword research, and backlinks.
 */

export const seoService = {
  // ── Domain Overview ───────────────────────────────────
  getDomainOverview: async (domain: string) => {
    const { data } = await api.get('/domains/overview', { params: { domain } });
    return data;
  },

  // ── Keyword Research ──────────────────────────────────
  researchKeyword: async (keyword: string) => {
    const { data } = await api.post('/keywords/research', { keyword });
    return data;
  },

  keywordMagic: async (seed: string) => {
    const { data } = await api.post('/keywords/magic', { seed });
    return data;
  },

  generateStrategy: async (projectId: string, keywords: string[]) => {
    const { data } = await api.post('/keywords/strategy', { project_id: projectId, keywords });
    return data;
  },

  // ── Backlinks ─────────────────────────────────────────
  // ── Rank Tracking ───
  trackKeywords: async (projectId: string, domain: string, keywords: string[]) => {
    const response = await api.post('/tracking/track', { project_id: projectId, domain, keywords });
    return response.data;
  },

  getLatestRankings: async (projectId: string) => {
    const response = await api.get(`/tracking/latest/${projectId}`);
    return response.data;
  },

  getRankingHistory: async (projectId: string, keyword: string) => {
    const response = await api.get(`/tracking/history/${projectId}`, { params: { keyword } });
    return response.data;
  },

  getBacklinkProfile: async (domain: string) => {
    const { data } = await api.get('/backlinks/profile', { params: { domain } });
    return data;
  },

  getNewLostBacklinks: async (domain: string) => {
    const { data } = await api.get('/backlinks/new-lost', { params: { domain } });
    return data;
  },

  getBacklinkGap: async (primary: string, competitor: string) => {
    const { data } = await api.get('/backlinks/gap', { params: { primary, competitor } });
    return data;
  },

  // ── Competitors ───────────────────────────────────────
  compareDomains: async (domains: string[]) => {
    const { data } = await api.post('/competitors/compare', { domains });
    return data;
  },

  compareTwoDomains: async (domainA: string, domainB: string) => {
    const { data } = await api.get('/competitors/compare', { params: { domain_a: domainA, domain_b: domainB } });
    return data;
  },

  getKeywordGap: async (primaryDomain: string, competitors: string[]) => {
    const { data } = await api.post('/competitors/gap', { primary_domain: primaryDomain, competitors });
    return data;
  },

  getAIVisibility: async (projectId: string, brandName: string, domain: string, force: boolean = false) => {
    const { data } = await api.get(`/ai-visibility/${projectId}`, { 
      params: { brand_name: brandName, domain, force } 
    });
    return data.data;
  },

  applyFixes: async (projectId: string, type: string) => {
    const { data } = await api.post(`/ai-visibility/${projectId}/apply-fixes`, null, { 
      params: { type } 
    });
    return data;
  },

  getLinkGraph: async (projectId: string) => {
    const { data } = await api.get(`/audit/graph/${projectId}`);
    return data;
  },

  listAuditReports: async (projectId: string) => {
    const { data } = await api.get(`/audit/reports/${projectId}`);
    return data;
  },

  getAuditDelta: async (projectId: string, reportA: string, reportB: string) => {
    const { data } = await api.get('/audit/delta', {
      params: { project_id: projectId, report_a: reportA, report_b: reportB }
    });
    return data;
  },
  
  optimizeLinkFlow: async (projectId: string, pageUrl: string) => {
    const { data } = await api.post(`/audit/graph/${projectId}/optimize`, { page_url: pageUrl });
    return data;
  },

  applyLinkStrategy: async (projectId: string, url: string, plan: string) => {
    const { data } = await api.post(`/audit/graph/${projectId}/apply-strategy`, { url, plan });
    return data;
  },
};
