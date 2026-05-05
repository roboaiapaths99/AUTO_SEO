import api from './api';

export interface VerifiedBrandData {
    official_name: string;
    founded_year?: number;
    headquarters?: string;
    key_products: string[];
    founder_ceo?: string;
    mission_statement?: string;
}

export interface AIMention {
    model_name: string;
    query: string;
    response_text: string;
    sentiment: string;
    is_accurate: boolean;
    hallucination_details?: string;
    detected_at: string;
}

export interface AIOCorrection {
    type: string;
    schema_json: any;
    pushed_to_cms: boolean;
    generated_at: string;
}

const aioService = {
    getMentions: async (projectId: string) => {
        const response = await api.get<AIMention[]>(`/aio/${projectId}/mentions`);
        return response.data;
    },

    probeAI: async (projectId: string, query: string) => {
        const response = await api.post(`/aio/${projectId}/probe`, { query });
        return response.data;
    },

    getVerifiedData: async (projectId: string) => {
        const response = await api.get<VerifiedBrandData>(`/aio/${projectId}/verified`);
        return response.data;
    },

    updateVerifiedData: async (projectId: string, data: VerifiedBrandData) => {
        const response = await api.post(`/aio/${projectId}/verified`, data);
        return response.data;
    },

    getCorrections: async (projectId: string) => {
        const response = await api.get<AIOCorrection[]>(`/aio/${projectId}/corrections`);
        return response.data;
    },

    getAIProbes: async (projectId: string) => {
        const response = await api.get<any[]>(`/aio/${projectId}/mentions`); // Using the mentions endpoint which returns probes
        return response.data;
    },

    applyFixes: async (projectId: string, type: string) => {
        const response = await api.post(`/aio/${projectId}/apply-fixes`, null, {
            params: { type }
        });
        return response.data;
    }
};

export default aioService;
