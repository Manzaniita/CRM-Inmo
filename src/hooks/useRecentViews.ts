import { useCallback } from 'react';
import { useRecentViewsStore, RecentView, RecentViewType } from '../stores/recentViewsStore';

export type { RecentView, RecentViewType };

export function useRecentViews() {
  const recentViews = useRecentViewsStore((state) => state.recentViews);
  const recordViewAction = useRecentViewsStore((state) => state.recordView);
  const clearViewsAction = useRecentViewsStore((state) => state.clearViews);

  const recordView = useCallback(
    (view: Omit<RecentView, 'timestamp'>) => recordViewAction(view),
    [recordViewAction]
  );

  const clearViews = useCallback(() => clearViewsAction(), [clearViewsAction]);

  return { recentViews, recordView, clearViews };
}
