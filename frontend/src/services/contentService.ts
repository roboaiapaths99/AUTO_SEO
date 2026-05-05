import api from './api';

/**
 * AutoSEO AI Platform — Content Service
 * =====================================
 * Handles SEO writing assistant and AI content generation.
 */

export const contentService = {
  analyzeContent: async (text: string, keyword: string) => {
    const { data } = await api.post('/content/analyze', { text, keyword });
    return data;
  },

  generateBrief: async (keyword: string) => {
    const { data } = await api.post('/content/brief', { keyword });
    return data;
  },

  generateContent: async (keyword: string, contentType: string = 'blog_post') => {
    const { data } = await api.post('/content/generate', { keyword, content_type: contentType });
    return data;
  },
};
