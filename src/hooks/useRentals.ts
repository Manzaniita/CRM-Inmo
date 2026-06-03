import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Rental } from "../types";
import { useAuthStore } from "../stores/authStore";
import { useUIStore } from "../stores/uiStore";

const fetchRentals = async () => {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error("No session");
  const { data, error } = await supabase
    .from("rentals")
    .select("*")
    .eq("user_id", user.id)
    .order("createdAt", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Rental[];
};

export function useRentals() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data: rentals = [], isLoading } = useQuery({
    queryKey: ["rentals"],
    queryFn: fetchRentals,
    enabled: !!user,
  });

  const addRental = useMutation({
    mutationFn: async (rental: Rental) => {
      const { data, error } = await supabase
        .from("rentals")
        .insert({ ...rental, user_id: user!.id })
        .select();
      if (error) throw error;
      const inserted = data![0] as Rental;
      if (inserted.estado === "firmado" || inserted.estado === "en curso") {
        await supabase
          .from("properties")
          .update({ status: "alquilada" })
          .eq("id", inserted.propiedadId)
          .eq("user_id", user!.id);
      }
      return inserted;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rentals"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      useUIStore
        .getState()
        .showToast("Operación de alquiler registrada", "success");
    },
    onError: (e: any) => useUIStore.getState().showToast(e.message, "error"),
  });

  const updateRental = useMutation({
    mutationFn: async (rental: Rental) => {
      const { error } = await supabase
        .from("rentals")
        .update(rental)
        .eq("id", rental.id)
        .eq("user_id", user!.id);
      if (error) throw error;
      if (rental.estado === "firmado" || rental.estado === "en curso") {
        await supabase
          .from("properties")
          .update({ status: "alquilada" })
          .eq("id", rental.propiedadId)
          .eq("user_id", user!.id);
      }
      return rental;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rentals"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      useUIStore.getState().showToast("Alquiler actualizado", "success");
    },
    onError: (e: any) => useUIStore.getState().showToast(e.message, "error"),
  });

  const deleteRental = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("rentals")
        .delete()
        .eq("id", id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rentals"] });
      useUIStore.getState().showToast("Alquiler eliminado", "info");
    },
    onError: (e: any) => useUIStore.getState().showToast(e.message, "error"),
  });

  return {
    rentals,
    isLoading,
    addRental: addRental.mutateAsync,
    updateRental: updateRental.mutateAsync,
    deleteRental: deleteRental.mutateAsync,
  };
}
