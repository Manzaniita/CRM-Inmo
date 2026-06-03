import { supabase } from "../lib/supabase";
import type { Profile } from "../types";
import { useAuthStore } from "../stores/authStore";
import { useUIStore } from "../stores/uiStore";

export async function updateProfile(newProfile: Profile) {
  const user = useAuthStore.getState().user;
  if (!user) {
    useUIStore.getState().showToast("No hay sesión activa", "error");
    return;
  }
  const payload = {
    user_id: user.id,
    name: newProfile.name,
    email: newProfile.email,
    phone: newProfile.phone,
    license: newProfile.license,
    templateProperty: newProfile.templateProperty,
    templateClient: newProfile.templateClient,
    templateBuyer: newProfile.templateBuyer,
    role: newProfile.role ?? "agent",
    must_change_password: newProfile.must_change_password ?? false,
  };
  const { error } = await supabase.from("profiles").upsert(payload);
  if (error) {
    console.error("[EstateCRM Supabase] updateProfile:", error);
    const msg = error?.message || "Error desconocido";
    useUIStore.getState().showToast(`updateProfile: ${msg}`, "error");
    return;
  }
  useAuthStore.getState().setProfile(newProfile);
  useUIStore.getState().showToast("Perfil guardado correctamente", "success");
}
