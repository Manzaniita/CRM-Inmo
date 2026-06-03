import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Sale } from "../types";
import { useAuthStore } from "../stores/authStore";
import { useUIStore } from "../stores/uiStore";

const fetchSales = async () => {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error("No session");
  const { data, error } = await supabase
    .from("sales")
    .select("*")
    .eq("user_id", user.id)
    .order("createdAt", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Sale[];
};

export function useSales() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["sales"],
    queryFn: fetchSales,
    enabled: !!user,
  });

  const addSale = useMutation({
    mutationFn: async (sale: Sale) => {
      const { data, error } = await supabase
        .from("sales")
        .insert({ ...sale, user_id: user!.id })
        .select();
      if (error) throw error;
      const inserted = data![0] as Sale;
      if (inserted.estado === "vendida") {
        await supabase
          .from("properties")
          .update({ status: "vendida" })
          .eq("id", inserted.propiedadId)
          .eq("user_id", user!.id);
      }
      return inserted;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      useUIStore
        .getState()
        .showToast("Operación de venta registrada", "success");
    },
    onError: (e: any) => useUIStore.getState().showToast(e.message, "error"),
  });

  const updateSale = useMutation({
    mutationFn: async (sale: Sale) => {
      const { error } = await supabase
        .from("sales")
        .update(sale)
        .eq("id", sale.id)
        .eq("user_id", user!.id);
      if (error) throw error;
      if (sale.estado === "vendida") {
        await supabase
          .from("properties")
          .update({ status: "vendida" })
          .eq("id", sale.propiedadId)
          .eq("user_id", user!.id);
      }
      return sale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      useUIStore.getState().showToast("Venta actualizada", "success");
    },
    onError: (e: any) => useUIStore.getState().showToast(e.message, "error"),
  });

  const deleteSale = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("sales")
        .delete()
        .eq("id", id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      useUIStore.getState().showToast("Venta eliminada", "info");
    },
    onError: (e: any) => useUIStore.getState().showToast(e.message, "error"),
  });

  return {
    sales,
    isLoading,
    addSale: addSale.mutateAsync,
    updateSale: updateSale.mutateAsync,
    deleteSale: deleteSale.mutateAsync,
  };
}
