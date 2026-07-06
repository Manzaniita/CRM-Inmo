import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Buyer, Client, EntityNote } from "../types";
import { useAuthStore } from "../stores/authStore";
import { useUIStore } from "../stores/uiStore";
import { generateId } from "../lib/id";

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

function buildBuyerNote(buyer: Buyer): EntityNote | null {
  if (!buyer.notas?.trim()) return null;
  return {
    id: generateId("n"),
    content: `Nota desde Compradores: ${buyer.notas.trim()}`,
    createdAt: new Date().toISOString(),
  };
}

async function findClientByBuyer(
  buyer: Buyer,
  userId: string
): Promise<Client | null> {
  const email = buyer.email?.trim().toLowerCase();
  const phone = buyer.telefono?.trim();
  const filters: string[] = [];
  if (email) filters.push(`email.ilike.${email}`);
  if (phone) filters.push(`phone.eq.${phone}`);
  filters.push(`buyerId.eq.${buyer.id}`);

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", userId)
    .or(filters.join(","))
    .maybeSingle();

  if (error) {
    console.error("[useBuyers] Error buscando cliente:", error);
    return null;
  }
  return data as Client | null;
}

async function syncBuyerWithClient(
  buyer: Buyer,
  userId: string,
  previousNotes?: string
) {
  const client = await findClientByBuyer(buyer, userId);
  const today = new Date().toISOString().split("T")[0];
  const newNote = buildBuyerNote(buyer);
  const shouldAppendNote =
    newNote &&
    (!previousNotes || previousNotes.trim() !== buyer.notas.trim());

  if (client) {
    const historyNotes = [...(client.historyNotes || [])];
    if (shouldAppendNote) historyNotes.push(newNote);
    const { error } = await supabase
      .from("clients")
      .update({
        name: buyer.nombre,
        phone: buyer.telefono,
        email: buyer.email,
        buyerId: buyer.id,
        budget: buyer.presupuestoMax,
        currency: buyer.moneda,
        interestZone: buyer.zonaBuscada,
        propertyTypeInterest: buyer.tipoPropiedad,
        notes: buyer.notas,
        historyNotes,
        lastContact: today,
        updated_at: new Date().toISOString(),
      })
      .eq("id", client.id)
      .eq("user_id", userId);
    if (error) console.error("[useBuyers] Error actualizando cliente:", error);
  } else {
    const historyNotes: EntityNote[] = [];
    if (newNote) historyNotes.push(newNote);
    const newClient: Client = {
      id: generateId("c"),
      name: buyer.nombre,
      phone: buyer.telefono,
      email: buyer.email,
      type: "comprador",
      types: ["comprador"],
      status: "activo",
      origin: "buyer",
      lastContact: today,
      notes: buyer.notas,
      buyerId: buyer.id,
      budget: buyer.presupuestoMax,
      currency: buyer.moneda,
      interestZone: buyer.zonaBuscada,
      propertyTypeInterest: buyer.tipoPropiedad,
      historyNotes,
      createdAt: buyer.createdAt || today,
    };
    const { error } = await supabase
      .from("clients")
      .insert({ ...newClient, user_id: userId });
    if (error) console.error("[useBuyers] Error creando cliente:", error);
  }
}

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
      const inserted = data![0] as Buyer;
      await syncBuyerWithClient(inserted, user!.id);
      return inserted;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buyers"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      useUIStore.getState().showToast("Comprador añadido", "success");
    },
    onError: (e: any) => useUIStore.getState().showToast(e.message, "error"),
  });

  const updateBuyer = useMutation({
    mutationFn: async (buyer: Buyer) => {
      // Obtener notas previas para evitar duplicar notas idénticas en el historial.
      const { data: previousData, error: fetchError } = await supabase
        .from("buyers")
        .select("notas")
        .eq("id", buyer.id)
        .eq("user_id", user!.id)
        .single();
      if (fetchError) console.error("[useBuyers] Error leyendo notas previas:", fetchError);
      const previousNotes = (previousData as Buyer | null)?.notas;

      const { error } = await supabase
        .from("buyers")
        .update(buyer)
        .eq("id", buyer.id)
        .eq("user_id", user!.id);
      if (error) throw error;
      await syncBuyerWithClient(buyer, user!.id, previousNotes);
      return buyer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buyers"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
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
