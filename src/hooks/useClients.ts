import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Client } from "../types";
import { useAuthStore } from "../stores/authStore";
import { useUIStore } from "../stores/uiStore";
import { generateId } from "../lib/id";

const fetchClients = async () => {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error("No session");
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", user.id)
    .order("createdAt", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Client[];
};

export function useClients() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
    enabled: !!user,
  });

  const addClient = useMutation({
    mutationFn: async (client: Client) => {
      const { data, error } = await supabase
        .from("clients")
        .insert({ ...client, user_id: user!.id })
        .select();
      if (error) throw error;
      return data![0] as Client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      useUIStore.getState().showToast("Cliente creado con éxito", "success");
    },
    onError: (e: any) => useUIStore.getState().showToast(e.message, "error"),
  });

  const updateClient = useMutation({
    mutationFn: async (client: Client) => {
      const { error } = await supabase
        .from("clients")
        .update(client)
        .eq("id", client.id)
        .eq("user_id", user!.id);
      if (error) throw error;
      return client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      useUIStore.getState().showToast("Cliente actualizado", "success");
    },
    onError: (e: any) => useUIStore.getState().showToast(e.message, "error"),
  });

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      useUIStore.getState().showToast("Cliente eliminado", "info");
    },
    onError: (e: any) => useUIStore.getState().showToast(e.message, "error"),
  });

  return {
    clients,
    isLoading,
    addClient: addClient.mutateAsync,
    updateClient: updateClient.mutateAsync,
    deleteClient: deleteClient.mutateAsync,
  };
}
