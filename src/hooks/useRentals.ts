import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Rental } from "../types";
import { useAuthStore } from "../stores/authStore";
import { useUIStore } from "../stores/uiStore";

// Mapeo DB → Tipo (la tabla usa nombres en inglés / createdAt)
const fromDbRental = (db: any): Rental => ({
  id: db.id,
  clientId: db.clientId,
  propertyId: db.propertyId,
  propietarioId: db.ownerId,
  locadorId: db.locadorId,
  monto: db.monto,
  deposito: db.deposito,
  comision: db.comision,
  moneda: db.moneda,
  fechaInicio: db.fechaInicio,
  fechaFin: db.fechaFin,
  diaPago: db.diaPago,
  estado: db.estado,
  notas: db.notas,
  createdAt: db.createdAt,
  fechaActualizacion: db.updatedAt,
});

// Mapeo Tipo → DB
const toDbRental = (rental: Rental): any => {
  const {
    createdAt,
    fechaActualizacion,
    propietarioId,
    ...rest
  } = rental;
  return {
    ...rest,
    ownerId: propietarioId,
    createdAt,
    updatedAt: fechaActualizacion,
  };
};

const fetchRentals = async () => {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error("No session");
  const { data, error } = await supabase
    .from("rentals")
    .select("*")
    .eq("user_id", user.id)
    .order("createdAt", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromDbRental);
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
      const payload = toDbRental(rental);
      const { data, error } = await supabase
        .from("rentals")
        .insert({ ...payload, user_id: user!.id })
        .select();
      if (error) throw error;
      const inserted = fromDbRental(data![0]);
      if (inserted.estado === "firmado" || inserted.estado === "en curso") {
        await supabase
          .from("properties")
          .update({ status: "alquilada" })
          .eq("id", inserted.propertyId)
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
      const { id, ...payload } = toDbRental(rental);
      const { error } = await supabase
        .from("rentals")
        .update(payload)
        .eq("id", rental.id)
        .eq("user_id", user!.id);
      if (error) throw error;
      if (rental.estado === "firmado" || rental.estado === "en curso") {
        await supabase
          .from("properties")
          .update({ status: "alquilada" })
          .eq("id", rental.propertyId)
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
