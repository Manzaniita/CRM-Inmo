import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { CustomOptions } from "../types";
import { useAuthStore } from "../stores/authStore";
import { useUIStore } from "../stores/uiStore";
import { DEFAULT_CUSTOM_OPTIONS } from "../types";

const fetchCustomOptions = async () => {
  const user = useAuthStore.getState().user;
  if (!user) return DEFAULT_CUSTOM_OPTIONS;
  const { data, error } = await supabase
    .from("custom_options")
    .select("*")
    .eq("user_id", user.id)
    .single();
  if (error || !data) return DEFAULT_CUSTOM_OPTIONS;
  return ((data as any).options as CustomOptions) ?? DEFAULT_CUSTOM_OPTIONS;
};

export function useCustomOptions() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data: customOptions = DEFAULT_CUSTOM_OPTIONS } = useQuery({
    queryKey: ["custom_options"],
    queryFn: fetchCustomOptions,
    enabled: !!user,
  });

  const updateCustomOptions = useMutation({
    mutationFn: async (opts: CustomOptions) => {
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        const { error } = await supabase
          .from("custom_options")
          .upsert(
            { user_id: currentUser.id, options: opts },
            { onConflict: "user_id" },
          );
        if (error) {
          console.error("[EstateCRM] custom_options save error:", error);
          useUIStore.getState().showToast("Error al guardar opciones", "error");
          throw error;
        }
      }
      return opts;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom_options"] });
    },
  });

  return {
    customOptions,
    updateCustomOptions: updateCustomOptions.mutateAsync,
  };
}
