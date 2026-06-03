import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { ActivityLog } from "../types";
import { useAuthStore } from "../stores/authStore";
import { useUIStore } from "../stores/uiStore";
import { generateId } from "../lib/id";

const fetchActivityLogs = async () => {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error("No session");
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("user_id", user.id)
    .limit(200)
    .order("createdAt", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ActivityLog[];
};

export function useActivityLogs() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data: activityLogs = [] } = useQuery({
    queryKey: ["activity_logs"],
    queryFn: fetchActivityLogs,
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
    addActivityLog: addActivityLog.mutateAsync,
  };
}
