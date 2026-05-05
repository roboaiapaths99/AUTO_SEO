import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

/**
 * AutoSEO AI Platform — Project Store
 * ===================================
 * Manages the currently selected project and domain context.
 */

interface Project {
  _id: string;
  name: string;
  domain: string;
  created_at: string;
}

interface ProjectState {
  currentProject: Project | null;
  projects: Project[];
  activeDomain: string;
  loading: boolean;
  
  setProject: (project: Project) => void;
  setCurrentProject: (project: Project) => void; // Alias for compatibility
  setActiveDomain: (domain: string) => void;
  setProjects: (projects: Project[]) => void;
  fetchProjects: () => Promise<void>;
  clearProject: () => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      currentProject: null,
      projects: [],
      activeDomain: 'autoseo.ai',
      loading: false,

      setProject: (project) => {
        set({ currentProject: project, activeDomain: project.domain });
      },

      setCurrentProject: (project) => {
        set({ currentProject: project, activeDomain: project.domain });
      },

      setActiveDomain: (domain) => {
        set({ activeDomain: domain });
      },

      setProjects: (projects) => {
        set({ projects });
      },

      fetchProjects: async () => {
        set({ loading: true });
        try {
          const { data } = await api.get('/projects/');
          set({ projects: data, loading: false });
          
          // If no current project but projects exist, select first
          if (!get().currentProject && data.length > 0) {
            get().setProject(data[0]);
          }
        } catch (err) {
          console.error("Failed to fetch projects", err);
          set({ loading: false });
        }
      },

      clearProject: () => {
        set({ currentProject: null, activeDomain: 'autoseo.ai', projects: [] });
      },
    }),
    {
      name: 'autoseo-project-storage',
      // Don't persist projects list, just current selection
      partialize: (state) => ({ 
        currentProject: state.currentProject,
        activeDomain: state.activeDomain 
      }),
    }
  )
);
