import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { ActivityLog } from "../types";
import { useAuthStore } from "../stores/authStore";
import { useUIStore } from "../stores/uiStore";
import { generateId } from "../lib/id";

const fetchActivityLogs = async (entityId?: string) => {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error("No session");
  let query = supabase
    .from("activity_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("createdAt", { ascending: false });

  if (entityId) {
    query = query.eq("entityId", entityId);
  } else {
    query = query.limit(200);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ActivityLog[];
};

export function useActivityLogs(entityId?: string) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data: activityLogs = [], isLoading } = useQuery({
    queryKey: ["activity_logs", entityId ?? "all"],
    queryFn: () => fetchActivityLogs(entityId),
    enabled: !!user,
  });

  const addActivityLog = useMutation({
    mutationFn: async (log: Omit<ActivityLog, "id" | "createdAt">) => {
      const newLog: ActivityLog = {
        ...log,
        id: generateId("log"),
        createdAt: new Date().toISOString(),
      };
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        const { createdAt, ...rest } = newLog;
        const { error } = await supabase
          .from("activity_logs")
          .insert({ ...rest, user_id: currentUser.id });
        if (error)
          console.error("[EstateCRM] Activity log insert error:", error);
      }
      return newLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity_logs"] });
    },
  });

  return {
    activityLogs,
    isLoading,
    addActivityLog: addActivityLog.mutateAsync,
  };
}
