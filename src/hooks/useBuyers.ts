import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Buyer } from "../types";
import { useAuthStore } from "../stores/authStore";
import { useUIStore } from "../stores/uiStore";

const fetchBuyers = async () => {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error("No session");
  const { data, error } = await supabase
    .from("buyers")
    .select("*")
    .eq("user_id", user.id)
    .order("createdAt", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Buyer[];
};

export function useBuyers() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data: buyers = [], isLoading } = useQuery({
    queryKey: ["buyers"],
    queryFn: fetchBuyers,
    enabled: !!user,
  });

  const addBuyer = useMutation({
    mutationFn: async (buyer: Buyer) => {
      const { createdAt, ...rest } = buyer;
      const { data, error } = await supabase
        .from("buyers")
        .insert({ ...rest, user_id: user!.id })
        .select();
      if (error) throw error;
      return data![0] as Buyer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buyers"] });
      useUIStore.getState().showToast("Comprador añadido", "success");
    },
    onError: (e: any) => useUIStore.getState().showToast(e.message, "error"),
  });

  const updateBuyer = useMutation({
    mutationFn: async (buyer: Buyer) => {
      const { error } = await supabase
        .from("buyers")
        .update(buyer)
        .eq("id", buyer.id)
        .eq("user_id", user!.id);
      if (error) throw error;
      return buyer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buyers"] });
      useUIStore.getState().showToast("Comprador actualizado", "success");
    },
    onError: (e: any) => useUIStore.getState().showToast(e.message, "error"),
  });

  const deleteBuyer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("buyers")
        .delete()
        .eq("id", id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buyers"] });
      useUIStore.getState().showToast("Comprador eliminado", "info");
    },
    onError: (e: any) => useUIStore.getState().showToast(e.message, "error"),
  });

  return {
    buyers,
    isLoading,
    addBuyer: addBuyer.mutateAsync,
    updateBuyer: updateBuyer.mutateAsync,
    deleteBuyer: deleteBuyer.mutateAsync,
  };
}
