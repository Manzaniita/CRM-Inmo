import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type RecentViewType = 'client' | 'property';

export interface RecentView {
  id: string;
  type: RecentViewType;
  name: string;
  timestamp: number;
}

interface RecentViewsState {
  recentViews: RecentView[];
  recordView: (view: Omit<RecentView, 'timestamp'>) => void;
  clearViews: () => void;
}

const MAX_ITEMS = 5;

export const useRecentViewsStore = create<RecentViewsState>()(
  persist(
    (set) => ({
      recentViews: [],
      recordView: (view) =>
        set((state) => {
          const filtered = state.recentViews.filter(
            (v) => !(v.id === view.id && v.type === view.type)
          );
          return {
            recentViews: [{ ...view, timestamp: Date.now() }, ...filtered].slice(0, MAX_ITEMS),
          };
        }),
      clearViews: () => set({ recentViews: [] }),
    }),
    {
      name: 'estatecrm_recent_views',
      partialize: (state) => ({ recentViews: state.recentViews }),
    }
  )
);
