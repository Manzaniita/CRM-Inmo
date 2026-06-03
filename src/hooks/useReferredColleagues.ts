import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { ReferredColleague } from "../types";
import { useAuthStore } from "../stores/authStore";
import { useUIStore } from "../stores/uiStore";

const fetchReferredColleagues = async () => {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error("No session");
  const { data, error } = await supabase
    .from("referred_colleagues")
    .select("*")
    .eq("user_id", user.id)
    .order("createdAt", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((c) => ({
    ...c,
    referredClientIds: c.referredClientIds ?? [],
  })) as ReferredColleague[];
};

export function useReferredColleagues() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data: referredColleagues = [], isLoading } = useQuery({
    queryKey: ["referred_colleagues"],
    queryFn: fetchReferredColleagues,
    enabled: !!user,
  });

  const addReferredColleague = useMutation({
    mutationFn: async (colleague: ReferredColleague) => {
      const { data, error } = await supabase
        .from("referred_colleagues")
        .insert({ ...colleague, user_id: user!.id })
        .select();
      if (error) throw error;
      return data![0] as ReferredColleague;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referred_colleagues"] });
      useUIStore.getState().showToast("Colega referido añadido", "success");
    },
    onError: (e: any) => useUIStore.getState().showToast(e.message, "error"),
  });

  const updateReferredColleague = useMutation({
    mutationFn: async (colleague: ReferredColleague) => {
      const { error } = await supabase
        .from("referred_colleagues")
        .update(colleague)
        .eq("id", colleague.id)
        .eq("user_id", user!.id);
      if (error) throw error;
      return colleague;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referred_colleagues"] });
      useUIStore.getState().showToast("Colega actualizado", "success");
    },
    onError: (e: any) => useUIStore.getState().showToast(e.message, "error"),
  });

  const deleteReferredColleague = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("referred_colleagues")
        .delete()
        .eq("id", id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referred_colleagues"] });
      useUIStore.getState().showToast("Colega eliminado", "info");
    },
    onError: (e: any) => useUIStore.getState().showToast(e.message, "error"),
  });

  return {
    referredColleagues,
    isLoading,
    addReferredColleague: addReferredColleague.mutateAsync,
    updateReferredColleague: updateReferredColleague.mutateAsync,
    deleteReferredColleague: deleteReferredColleague.mutateAsync,
  };
}
