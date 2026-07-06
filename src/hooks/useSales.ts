import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Sale, Task } from "../types";
import { useAuthStore } from "../stores/authStore";
import { useUIStore } from "../stores/uiStore";
import { generateId } from "../lib/id";

const fetchSales = async () => {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error("No session");
  const { data, error } = await supabase
    .from("sales")
    .select("*")
    .eq("user_id", user.id)
    .order("fechaCreacion", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Sale[];
};

function getFutureDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

export function useSales() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["sales"],
    queryFn: fetchSales,
    enabled: !!user,
  });

  const createPostSaleTask = async (sale: Sale) => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) return;

    const autoKey = `post-sale-${sale.id}`;
    const { data: existing } = await supabase
      .from("tasks")
      .select("id")
      .eq("user_id", currentUser.id)
      .eq("autoKey", autoKey)
      .limit(1);

    if (existing && existing.length > 0) return;

    // Obtener nombres de propiedad y comprador desde Supabase
    const { data: propertyData } = await supabase
      .from("properties")
      .select("title")
      .eq("id", sale.propiedadId)
      .eq("user_id", currentUser.id)
      .single();
    const { data: clientData } = await supabase
      .from("clients")
      .select("name")
      .eq("id", sale.clientCompradorId)
      .eq("user_id", currentUser.id)
      .single();

    const propertyTitle = propertyData?.title || sale.externalPropertyAddress || "propiedad";
    const clientName = clientData?.name || sale.comprador || "cliente";

    const task: Task = {
      id: generateId("t"),
      title: `Llamar al cliente para post-venta - ${clientName}`,
      description: `Seguimiento post-venta de ${propertyTitle}. Contactar a ${clientName} para verificar satisfacción y resolver dudas.`,
      dueDate: getFutureDate(30),
      priority: "media",
      status: "pendiente",
      clientId: sale.clientCompradorId || undefined,
      propertyId: sale.propiedadId || undefined,
      createdAt: new Date().toISOString(),
      source: "auto_post_sale",
      autoKey,
      relatedEntities: [
        ...(sale.clientCompradorId ? [{ type: "client" as const, id: sale.clientCompradorId }] : []),
        ...(sale.propiedadId ? [{ type: "property" as const, id: sale.propiedadId }] : []),
        { type: "sale" as const, id: sale.id },
      ],
    };

    const { createdAt, ...rest } = task;
    await supabase.from("tasks").insert({ ...rest, user_id: currentUser.id });
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
  };

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
        await createPostSaleTask(inserted);
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
        await createPostSaleTask(sale);
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
