import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { WaitingRoomEntry } from "../types";
import { useAuthStore } from "../stores/authStore";
import { useUIStore } from "../stores/uiStore";

const fetchWaitingRoom = async () => {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error("No session");
  const { data, error } = await supabase
    .from("waiting_room")
    .select("*")
    .eq("user_id", user.id)
    .order("createdAt", { ascending: false });
  if (error) throw error;
  return (data ?? []) as WaitingRoomEntry[];
};

export function useWaitingRoom() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data: waitingRoom = [], isLoading } = useQuery({
    queryKey: ["waiting_room"],
    queryFn: fetchWaitingRoom,
    enabled: !!user,
  });

  const addWaitingRoomEntry = useMutation({
    mutationFn: async (entry: WaitingRoomEntry) => {
      const { data, error } = await supabase
        .from("waiting_room")
        .insert({ ...entry, user_id: user!.id })
        .select();
      if (error) throw error;
      return data![0] as WaitingRoomEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waiting_room"] });
      useUIStore
        .getState()
        .showToast("Entrada añadida a Sala de Espera", "success");
    },
    onError: (e: any) => useUIStore.getState().showToast(e.message, "error"),
  });

  const updateWaitingRoomEntry = useMutation({
    mutationFn: async (entry: WaitingRoomEntry) => {
      const { error } = await supabase
        .from("waiting_room")
        .update(entry)
        .eq("id", entry.id)
        .eq("user_id", user!.id);
      if (error) throw error;
      return entry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waiting_room"] });
      useUIStore.getState().showToast("Entrada actualizada", "success");
    },
    onError: (e: any) => useUIStore.getState().showToast(e.message, "error"),
  });

  const deleteWaitingRoomEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("waiting_room")
        .delete()
        .eq("id", id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waiting_room"] });
      useUIStore.getState().showToast("Entrada eliminada", "info");
    },
    onError: (e: any) => useUIStore.getState().showToast(e.message, "error"),
  });

  return {
    waitingRoom,
    isLoading,
    addWaitingRoomEntry: addWaitingRoomEntry.mutateAsync,
    updateWaitingRoomEntry: updateWaitingRoomEntry.mutateAsync,
    deleteWaitingRoomEntry: deleteWaitingRoomEntry.mutateAsync,
  };
}
