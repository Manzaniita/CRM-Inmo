import React, { useState, useEffect } from "react";
import {
  User,
  Save,
  CheckCircle2,
  RotateCcw,
  Download,
  Upload,
  AlertTriangle,
  Trash2,
  Database,
  MessageSquare,
  Users,
  Plus,
  X,
  Loader2,
  Key,
  RefreshCw,
  List,
  Tag,
} from "lucide-react";
import Button from "../components/Button";
import { Card } from "../components/Card";
import Badge from "../components/Badge";
import { cn } from "../lib/utils";
import { updateProfile } from "../hooks/useUpdateProfile";
import { useCustomOptions } from "../hooks/useCustomOptions";
import type { Profile, CustomOptions, CustomOptionItem } from "../types";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { useUIStore } from "../stores/uiStore";
import { useAuthStore } from "../stores/authStore";

interface UserProfile {
  user_id: string;
  name: string;
  email: string;
  role: "agent" | "superadmin";
  must_change_password?: boolean;
}

type ConfigTabId = "perfil" | "plantillas" | "datos" | "usuarios" | "listas";

export default function Configuration() {
  const showToast = useUIStore((state) => state.showToast);
  const profile = useAuthStore((state) => state.profile);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ConfigTabId>("perfil");
  const [saveStatus, setSaveStatus] = useState(false);
  const { customOptions, updateCustomOptions } = useCustomOptions();

  const [form, setForm] = useState<Profile>(profile);

  // Superadmin state
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    name: "",
    role: "agent",
  });
  const [creatingUser, setCreatingUser] = useState(false);
  const [serverRole, setServerRole] = useState<string | null>(null);

  const verifyRole = async () => {
    const { data, error } = await supabase.rpc("get_my_role");
    if (!error && data) {
      setServerRole(data as string);
    } else {
      setServerRole(null);
    }
  };

  useEffect(() => {
    verifyRole();
  }, []);

  useEffect(() => {
    if (activeTab === "usuarios" && serverRole === "superadmin") {
      console.log("AUDITORIA: Cargando usuarios como", serverRole);
      fetchUsers();
    }
  }, [activeTab, serverRole]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    console.log("AUDITORIA: Cargando usuarios como", profile?.role);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("name");
    if (error) {
      showToast(`Error de permisos: ${error.message}`, "error");
    } else if (data) {
      setUsersList(data as UserProfile[]);
    }
    setLoadingUsers(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.password || !newUser.name) {
      showToast("Completá todos los campos", "warning");
      return;
    }
    setCreatingUser(true);

    // Intento 1: crear usuario nuevo en Auth
    const { data, error } = await supabase.auth.signUp({
      email: newUser.email,
      password: newUser.password,
    });

    if (error) {
      const errMsg = error.message.toLowerCase();
      const isAlreadyRegistered =
        errMsg.includes("already registered") ||
        errMsg.includes("user already registered") ||
        errMsg.includes("user already exists");

      if (isAlreadyRegistered) {
        // Intento 2: el usuario ya existe en Auth. Intentamos loguearnos
        // con la contraseña provista para obtener su user_id y crear/actualizar el perfil.
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: newUser.email,
            password: newUser.password,
          });

        if (signInError || !signInData.user) {
          showToast(
            "El usuario ya existe en el sistema de autenticación. Intenta restablecer su contraseña.",
            "error",
          );
          setCreatingUser(false);
          return;
        }

        // Upsert del perfil para el usuario existente
        const { error: upsertError } = await supabase.from("profiles").upsert({
          user_id: signInData.user.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          must_change_password: true,
        });

        if (upsertError) {
          showToast(
            "Error al crear el perfil: " + upsertError.message,
            "error",
          );
          setCreatingUser(false);
          return;
        }

        setShowUserModal(false);
        setCreatingUser(false);
        setNewUser({ email: "", password: "", name: "", role: "agent" });

        // Cerramos sesión porque signInWithPassword nos logueó como el usuario existente
        await logout();
        showToast(
          "Perfil creado/actualizado para usuario existente. Por seguridad, re-ingresa como Administrador.",
          "info",
        );
        navigate("/login");
        return;
      }

      showToast(error.message, "error");
      setCreatingUser(false);
      return;
    }

    if (data.user) {
      // Upsert profile para usuario recién creado
      await supabase.from("profiles").upsert({
        user_id: data.user.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        must_change_password: true,
      });

      setShowUserModal(false);
      setCreatingUser(false);
      setNewUser({ email: "", password: "", name: "", role: "agent" });

      // Auto-login happens here, so we force sign out and redirect
      await logout();
      showToast(
        "Usuario creado con éxito. Por seguridad del sistema, por favor re-ingresa a tu cuenta de Administrador.",
        "info",
      );
      navigate("/login");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === profile.user_id) {
      showToast("No podés eliminarte a vos mismo.", "warning");
      return;
    }
    if (
      window.confirm(
        "¿Estás seguro de eliminar este usuario? Esto solo lo borrará de la lista de agentes. Para impedir el acceso, debes eliminarlo manualmente desde Supabase Auth (o vía Edge Function).",
      )
    ) {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("user_id", userId);
      if (error) {
        showToast("Error al eliminar usuario", "error");
      } else {
        setUsersList((prev) => prev.filter((u) => u.user_id !== userId));
        showToast("Usuario eliminado de la base de datos", "success");
      }
    }
  };

  const handleForceReset = async (userId: string) => {
    if (userId === profile.user_id) {
      showToast("No podés restablecer tu propia clave desde aquí.", "warning");
      return;
    }
    if (
      window.confirm(
        "¿Forzar reseteo de clave para este usuario en su próximo ingreso?",
      )
    ) {
      const { error } = await supabase
        .from("profiles")
        .update({ must_change_password: true })
        .eq("user_id", userId);
      if (error) {
        showToast("Error al forzar reset", "error");
      } else {
        setUsersList((prev) =>
          prev.map((u) =>
            u.user_id === userId ? { ...u, must_change_password: true } : u,
          ),
        );
        showToast("Reset forzado activado", "success");
      }
    }
  };

  const handleSave = () => {
    updateProfile(form);
    setSaveStatus(true);
    setTimeout(() => setSaveStatus(false), 2000);
  };

  const initials = form.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Configuración
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Personaliza tu espacio de trabajo y perfil profesional.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Tabs */}
        <div className="lg:col-span-1 space-y-1">
          <ConfigTab
            icon={User}
            label="Perfil Profesional"
            active={activeTab === "perfil"}
            onClick={() => setActiveTab("perfil")}
          />

          <ConfigTab
            icon={List}
            label="Personalización de Listas"
            active={activeTab === "listas"}
            onClick={() => setActiveTab("listas")}
          />
          {(profile.role === "superadmin" || serverRole === "superadmin") && (
            <ConfigTab
              icon={Users}
              label="Gestión de Usuarios"
              active={activeTab === "usuarios"}
              onClick={() => setActiveTab("usuarios")}
            />
          )}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6 animate-in fade-in duration-500">
          {activeTab === "perfil" && (
            <>
              <Card
                title="Perfil Profesional"
                subtitle="Esta información se usará para tus reportes y tarjetas de contacto."
              >
                <div className="space-y-6 pt-4">
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-full bg-blue-100 border-2 border-white shadow flex items-center justify-center text-blue-700 text-3xl font-black">
                        {initials}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {form.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {form.email}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        Nombre Completo
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, name: e.target.value }))
                        }
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        Email Profesional
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, email: e.target.value }))
                        }
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        WhatsApp / Teléfono
                      </label>
                      <input
                        type="text"
                        value={form.phone}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, phone: e.target.value }))
                        }
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        Matrícula / Registro
                      </label>
                      <input
                        type="text"
                        value={form.license}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, license: e.target.value }))
                        }
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </Card>

              <Card
                title="Plantillas de Mensajes"
                subtitle="Personalizá los mensajes que se envían por WhatsApp."
              >
                <div className="space-y-6 pt-4">
                  <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                    <p className="text-xs font-bold text-blue-800 mb-1">
                      Placeholders disponibles
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "{name}",
                        "{title}",
                        "{address}",
                        "{price}",
                        "{link}",
                        "{agentName}",
                      ].map((p) => (
                        <span key={p}>
                          <Badge variant="blue" size="sm">
                            {p}
                          </Badge>
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-blue-600/70 mt-1">
                      Se reemplazan automáticamente al enviar el mensaje.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      Mensaje para Propiedades
                    </label>
                    <textarea
                      rows={4}
                      value={form.templateProperty}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          templateProperty: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      Mensaje para Clientes
                    </label>
                    <textarea
                      rows={3}
                      value={form.templateClient}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          templateClient: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      Mensaje para Compradores
                    </label>
                    <textarea
                      rows={3}
                      value={form.templateBuyer}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          templateBuyer: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm resize-none"
                    />
                  </div>
                </div>
              </Card>

              <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-2">
                  <Save
                    size={18}
                    className="text-slate-400 dark:text-slate-500"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Los cambios se guardan automáticamente en el navegador.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleSave}
                  isLoading={saveStatus}
                >
                  {saveStatus ? (
                    <CheckCircle2 size={18} className="mr-2" />
                  ) : (
                    <Save size={18} className="mr-2" />
                  )}
                  {saveStatus ? "Guardado" : "Guardar Perfil"}
                </Button>
              </div>
            </>
          )}

          {activeTab === "listas" && (
            <Card
              title="Personalización de Listas"
              subtitle="Gestioná las opciones disponibles en los formularios de clientes y propiedades."
            >
              <CustomOptionsManager
                options={customOptions}
                onChange={updateCustomOptions}
              />
            </Card>
          )}

          {activeTab === "usuarios" && serverRole === "superadmin" && (
            <Card
              title="Gestión de Usuarios"
              subtitle="Administra los agentes y superadmins del sistema."
            >
              <div className="pt-4 space-y-4">
                <div className="flex justify-end mb-4 gap-2">
                  <Button variant="outline" onClick={fetchUsers}>
                    <RefreshCw size={16} className="mr-2" /> Refrescar Lista
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => setShowUserModal(true)}
                  >
                    <Plus size={18} className="mr-2" /> Crear Nuevo Usuario
                  </Button>
                </div>

                {loadingUsers ? (
                  <div className="flex justify-center py-10">
                    <Loader2
                      className="animate-spin text-slate-400"
                      size={32}
                    />
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/40 backdrop-blur-xl shadow-sm">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-100/50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/5">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Nombre</th>
                          <th className="px-4 py-3 font-semibold">Email</th>
                          <th className="px-4 py-3 font-semibold">Rol</th>
                          <th className="px-4 py-3 font-semibold text-center">
                            Seguridad
                          </th>
                          <th className="px-4 py-3 font-semibold text-right">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/60 dark:divide-white/5">
                        {usersList.map((u) => (
                          <tr
                            key={u.user_id}
                            className="hover:bg-white/60 dark:hover:bg-white/5 transition-colors"
                          >
                            <td className="px-4 py-4 font-medium text-slate-900 dark:text-slate-100">
                              {u.name}
                            </td>
                            <td className="px-4 py-4 text-slate-600 dark:text-slate-400">
                              {u.email}
                            </td>
                            <td className="px-4 py-4">
                              <Badge
                                variant={
                                  u.role === "superadmin" ? "purple" : "blue"
                                }
                              >
                                {u.role === "superadmin"
                                  ? "Superadmin"
                                  : "Agent"}
                              </Badge>
                            </td>
                            <td className="px-4 py-4 text-center">
                              {u.must_change_password ? (
                                <Badge variant="orange" size="sm">
                                  Reset Pendiente
                                </Badge>
                              ) : (
                                <Badge variant="green" size="sm">
                                  Actualizada
                                </Badge>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleForceReset(u.user_id)}
                                  title="Forzar reseteo de clave"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                                >
                                  <Key size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u.user_id)}
                                  title="Eliminar usuario"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {usersList.length === 0 && (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-4 py-8 text-center text-slate-500"
                            >
                              No se encontraron usuarios.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {showUserModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                Crear Nuevo Usuario
              </h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser((p) => ({ ...p, name: e.target.value }))
                  }
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser((p) => ({ ...p, email: e.target.value }))
                  }
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contraseña Provisoria
                </label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser((p) => ({ ...p, password: e.target.value }))
                  }
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Rol
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser((p) => ({ ...p, role: e.target.value }))
                  }
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100"
                >
                  <option value="agent">Agente</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>
              <div className="pt-2 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowUserModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  isLoading={creatingUser}
                >
                  {creatingUser ? "Creando..." : "Crear Usuario"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function CustomOptionsManager({
  options,
  onChange,
}: {
  options: CustomOptions;
  onChange: (opts: CustomOptions) => void;
}) {
  const categories: {
    key: keyof CustomOptions;
    title: string;
    icon: React.ElementType;
  }[] = [
    { key: "clientTypes", title: "Tipos de Cliente", icon: Tag },
    { key: "clientStatuses", title: "Estados de Cliente", icon: Tag },
    { key: "clientOrigins", title: "Orígenes de Cliente", icon: Tag },
    { key: "propertyTypes", title: "Tipos de Propiedad", icon: Tag },
    { key: "propertyStatuses", title: "Estados de Propiedad", icon: Tag },
    { key: "propertyOperations", title: "Operaciones de Propiedad", icon: Tag },
  ];

  const [newLabel, setNewLabel] = useState<Record<string, string>>({});
  const [newColor, setNewColor] = useState<Record<string, string>>({});

  const colors = ["green", "blue", "orange", "purple", "yellow", "gray", "red"];

  const addOption = (key: keyof CustomOptions) => {
    const label = newLabel[key]?.trim();
    if (!label) return;
    const id = label.toLowerCase().replace(/\s+/g, "_");
    const list = options[key];
    if (list.some((i) => i.id === id)) {
      alert("Ya existe una opción con ese identificador.");
      return;
    }
    const item: CustomOptionItem = {
      id,
      label,
      color: newColor[key] || undefined,
    };
    onChange({ ...options, [key]: [...list, item] });
    setNewLabel((prev) => ({ ...prev, [key]: "" }));
  };

  const removeOption = (key: keyof CustomOptions, id: string) => {
    if (!window.confirm("¿Eliminar esta opción?")) return;
    onChange({ ...options, [key]: options[key].filter((i) => i.id !== id) });
  };

  return (
    <div className="space-y-6 pt-4">
      {categories.map((cat) => (
        <div
          key={cat.key}
          className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm"
        >
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
            <cat.icon size={16} className="text-blue-600" /> {cat.title}
          </h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {options[cat.key].map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                {item.color && (
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      item.color === "green"
                        ? "bg-green-500"
                        : item.color === "blue"
                          ? "bg-blue-500"
                          : item.color === "orange"
                            ? "bg-orange-500"
                            : item.color === "purple"
                              ? "bg-purple-500"
                              : item.color === "yellow"
                                ? "bg-yellow-500"
                                : item.color === "red"
                                  ? "bg-red-500"
                                  : "bg-gray-500",
                    )}
                  />
                )}
                {item.label}
                <button
                  onClick={() => removeOption(cat.key, item.id)}
                  className="ml-1 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder={`Nuevo ${cat.title.toLowerCase()}...`}
              className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
              value={newLabel[cat.key] || ""}
              onChange={(e) =>
                setNewLabel((prev) => ({ ...prev, [cat.key]: e.target.value }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") addOption(cat.key);
              }}
            />
            <div className="flex items-center gap-1">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() =>
                    setNewColor((prev) => ({ ...prev, [cat.key]: c }))
                  }
                  className={cn(
                    "w-6 h-6 rounded-full border-2 transition-all",
                    c === "green"
                      ? "bg-green-500 border-green-500"
                      : c === "blue"
                        ? "bg-blue-500 border-blue-500"
                        : c === "orange"
                          ? "bg-orange-500 border-orange-500"
                          : c === "purple"
                            ? "bg-purple-500 border-purple-500"
                            : c === "yellow"
                              ? "bg-yellow-500 border-yellow-500"
                              : c === "red"
                                ? "bg-red-500 border-red-500"
                                : "bg-gray-500 border-gray-500",
                    newColor[cat.key] === c
                      ? "ring-2 ring-offset-1 ring-slate-400 dark:ring-offset-slate-800"
                      : "opacity-60 hover:opacity-100",
                  )}
                  title={c}
                />
              ))}
              <button
                type="button"
                onClick={() =>
                  setNewColor((prev) => ({ ...prev, [cat.key]: "" }))
                }
                className={cn(
                  "w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 bg-transparent text-[8px] font-bold text-slate-500 flex items-center justify-center transition-all",
                  !newColor[cat.key]
                    ? "ring-2 ring-offset-1 ring-slate-400 dark:ring-offset-slate-800"
                    : "opacity-60 hover:opacity-100",
                )}
                title="Sin color"
              >
                -
              </button>
            </div>
            <button
              type="button"
              onClick={() => addOption(cat.key)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={14} className="inline mr-1" /> Agregar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ConfigTab({
  icon: Icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm",
        active
          ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
          : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:text-slate-100",
      )}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}
