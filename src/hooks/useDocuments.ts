import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Document } from "../types";
import { useAuthStore } from "../stores/authStore";
import { useUIStore } from "../stores/uiStore";

const fetchDocuments = async () => {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error("No session");
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", user.id)
    .order("createdAt", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Document[];
};

export function useDocuments() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: fetchDocuments,
    enabled: !!user,
  });

  const addDocument = useMutation({
    mutationFn: async (doc: Document) => {
      const { data, error } = await supabase
        .from("documents")
        .insert({ ...doc, user_id: user!.id })
        .select();
      if (error) throw error;
      return data![0] as Document;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      useUIStore.getState().showToast("Documento añadido", "success");
    },
    onError: (e: any) => useUIStore.getState().showToast(e.message, "error"),
  });

  const updateDocument = useMutation({
    mutationFn: async (doc: Document) => {
      const { error } = await supabase
        .from("documents")
        .update(doc)
        .eq("id", doc.id)
        .eq("user_id", user!.id);
      if (error) throw error;
      return doc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      useUIStore.getState().showToast("Documento actualizado", "success");
    },
    onError: (e: any) => useUIStore.getState().showToast(e.message, "error"),
  });

  const deleteDocument = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      useUIStore.getState().showToast("Documento eliminado", "info");
    },
    onError: (e: any) => useUIStore.getState().showToast(e.message, "error"),
  });

  return {
    documents,
    isLoading,
    addDocument: addDocument.mutateAsync,
    updateDocument: updateDocument.mutateAsync,
    deleteDocument: deleteDocument.mutateAsync,
  };
}
