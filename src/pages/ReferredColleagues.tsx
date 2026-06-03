import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Briefcase,
  X,
  Trash2,
  Edit3,
  CheckCircle2,
  XCircle,
  Link2,
  Eye,
  Phone,
  Mail,
  MapPin,
  Home,
  ExternalLink,
} from "lucide-react";
import { useRentals } from "../hooks/useRentals";
import { useDocuments } from "../hooks/useDocuments";
import { useWaitingRoom } from "../hooks/useWaitingRoom";
import { useBuyers } from "../hooks/useBuyers";
import { useReferredColleagues } from "../hooks/useReferredColleagues";
import { useActivityLogs } from "../hooks/useActivityLogs";
import { useSales } from "../hooks/useSales";
import { useTasks } from "../hooks/useTasks";
import { useEvents } from "../hooks/useEvents";
import Badge from "../components/Badge";
import Button from "../components/Button";
import { cn, normalizeSearchText } from "../lib/utils";
import { generateId } from "../lib/id";
import { validateReferredColleague } from "../lib/validators";
import { useRelationsDrawer } from "../context/RelationsDrawerContext";
import type { ReferredColleague, Client } from "../types";
import { useUIStore } from "../stores/uiStore";
import { useProperties } from "../hooks/useProperties";
import { useClients } from "../hooks/useClients";

export default function ReferredColleagues() {
  const { rentals } = useRentals();
  const { documents } = useDocuments();
  const { waitingRoom } = useWaitingRoom();
  const { buyers } = useBuyers();
  const { activityLogs, addActivityLog } = useActivityLogs();
  const {
    referredColleagues,
    isLoading,
    addReferredColleague,
    updateReferredColleague,
    deleteReferredColleague,
  } = useReferredColleagues();
  const { sales } = useSales();
  const { tasks } = useTasks();
  const { events } = useEvents();
  const { clients, updateClient } = useClients();
  const { properties } = useProperties();
  const showToast = useUIStore((state) => state.showToast);
  const { openRelations } = useRelationsDrawer();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRespondio, setFilterRespondio] = useState<string>("");
  const [filterYaRefirio, setFilterYaRefirio] = useState<string>("");
  const [filterAprobado, setFilterAprobado] = useState<string>("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingColleague, setEditingColleague] =
    useState<ReferredColleague | null>(null);
  const [viewingColleague, setViewingColleague] =
    useState<ReferredColleague | null>(null);
  const [editingReferredClient, setEditingReferredClient] =
    useState<Client | null>(null);
  const [referredClientForm, setReferredClientForm] = useState<Partial<Client>>(
    {},
  );
  const [referredClientSearchTerm, setReferredClientSearchTerm] = useState("");
  const [sortReferrals, setSortReferrals] = useState<
    "default" | "desc" | "asc"
  >("default");

  useEffect(() => {
    const colleagueId = searchParams.get("colleagueId");
    if (colleagueId) {
      const col = referredColleagues.find((c) => c.id === colleagueId);
      if (col) setViewingColleague(col);
    }
  }, [searchParams, referredColleagues]);

  const [formData, setFormData] = useState<Partial<ReferredColleague>>({
    nombreApellido: "",
    oficina: "",
    respondio: false,
    quienContacto: "",
    comoRespondio: undefined,
    yaRefirio: false,
    aQuien: "",
    primerContacto: "",
    toque1: "",
    toque2: "",
    toque3: "",
    toque4: "",
    toque5: "",
    toque6: "",
    propertyIds: [],
    referredClientIds: [],
  });

  const lowerSearch = normalizeSearchText(searchTerm);

  const getReferredClients = (colleague: ReferredColleague): Client[] => {
    const ids = new Set<string>();
    (colleague.referredClientIds || []).forEach((id) => ids.add(id));
    clients.forEach((c) => {
      if (c.referredByColleagueId === colleague.id) ids.add(c.id);
    });
    return Array.from(ids)
      .map((id) => clients.find((c) => c.id === id))
      .filter(Boolean) as Client[];
  };

  const filtered = referredColleagues
    .filter((c) => {
      const matchesSearch =
        normalizeSearchText(c.nombreApellido).includes(lowerSearch) ||
        normalizeSearchText(c.oficina).includes(lowerSearch) ||
        normalizeSearchText(c.aQuien || "").includes(lowerSearch);
      const matchesRespondio =
        filterRespondio === "" || String(c.respondio) === filterRespondio;
      const matchesYaRefirio =
        filterYaRefirio === "" || String(c.yaRefirio) === filterYaRefirio;
      const aprobado =
        typeof c.comoRespondio === "number" && c.comoRespondio >= 7;
      const matchesAprobado =
        filterAprobado === "" || String(aprobado) === filterAprobado;
      return (
        matchesSearch && matchesRespondio && matchesYaRefirio && matchesAprobado
      );
    })
    .sort((a, b) => {
      if (sortReferrals === "default") return 0;
      const countA = getReferredClients(a).length;
      const countB = getReferredClients(b).length;
      return sortReferrals === "desc" ? countB - countA : countA - countB;
    });

  const openForm = (colleague?: ReferredColleague) => {
    if (colleague) {
      setEditingColleague(colleague);
      setFormData(colleague);
    } else {
      setEditingColleague(null);
      setFormData({
        nombreApellido: "",
        oficina: "",
        respondio: false,
        quienContacto: "",
        comoRespondio: undefined,
        yaRefirio: false,
        aQuien: "",
        primerContacto: "",
        toque1: "",
        toque2: "",
        toque3: "",
        toque4: "",
        toque5: "",
        toque6: "",
        propertyIds: [],
        referredClientIds: [],
      });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateReferredColleague(formData);
    if (!validation.valid) {
      showToast(validation.message || "Error de validación", "error");
      return;
    }
    if (editingColleague) {
      updateReferredColleague({
        ...editingColleague,
        ...(formData as ReferredColleague),
        id: editingColleague.id,
        referredClientIds: editingColleague.referredClientIds || [],
      });
    } else {
      addReferredColleague({
        ...(formData as ReferredColleague),
        id: generateId("col"),
        referredClientIds:
          (formData as ReferredColleague).referredClientIds || [],
      });
    }
    setIsFormOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Eliminar este colega?")) {
      deleteReferredColleague(id);
    }
  };

  const openEditReferredClient = (client: Client) => {
    setEditingReferredClient(client);
    setReferredClientForm({
      name: client.name,
      phone: client.phone,
      email: client.email,
      notes: client.notes,
      interestZone: client.interestZone,
    });
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Colegas Referidos
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Seguimiento de colegas y referidos.
          </p>
        </div>
        <Button variant="primary" onClick={() => openForm()}>
          <Plus size={18} className="mr-2" /> Nuevo Colega
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 max-w-md w-full">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
          />
          <input
            type="text"
            placeholder="Buscar por nombre, oficina o referido..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto flex-wrap">
          <select
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none"
            value={filterRespondio}
            onChange={(e) => setFilterRespondio(e.target.value)}
          >
            <option value="">Respondió</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
          <select
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none"
            value={filterYaRefirio}
            onChange={(e) => setFilterYaRefirio(e.target.value)}
          >
            <option value="">Ya refirió</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
          <select
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none"
            value={filterAprobado}
            onChange={(e) => setFilterAprobado(e.target.value)}
          >
            <option value="">Aprobado</option>
            <option value="true">Sí (≥7)</option>
            <option value="false">No (&lt;7)</option>
          </select>
          <select
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none"
            value={sortReferrals}
            onChange={(e) => setSortReferrals(e.target.value as any)}
          >
            <option value="default">Orden normal</option>
            <option value="desc">Más referidos</option>
            <option value="asc">Menos referidos</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <Briefcase size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {searchTerm || filterRespondio || filterYaRefirio || filterAprobado
              ? "No se encontraron resultados."
              : "No hay colegas cargados."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Nombre
                </th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Oficina
                </th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Resp.
                </th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Cómo
                </th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Refirió
                </th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Clientes referidos
                </th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  A quién
                </th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  1er contacto
                </th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Toques
                </th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((c) => {
                const aprobado =
                  typeof c.comoRespondio === "number" && c.comoRespondio >= 7;
                return (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50 dark:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-bold text-slate-900 dark:text-slate-100">
                      {c.nombreApellido}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                      {c.oficina}
                    </td>
                    <td className="px-4 py-3">
                      {c.respondio ? (
                        <CheckCircle2 size={16} className="text-green-500" />
                      ) : (
                        <XCircle size={16} className="text-red-400" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span
                          className={cn(
                            "text-sm font-bold",
                            aprobado
                              ? "text-green-600"
                              : "text-slate-500 dark:text-slate-400",
                          )}
                        >
                          {c.comoRespondio ?? "-"}
                        </span>
                        {aprobado && (
                          <Badge variant="green" size="xs">
                            OK
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {c.yaRefirio ? (
                        <CheckCircle2 size={16} className="text-green-500" />
                      ) : (
                        <XCircle
                          size={16}
                          className="text-slate-300 dark:text-slate-600"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">
                          {getReferredClients(c).length}
                        </span>
                        <button
                          className="text-xs text-blue-600 hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingColleague(c);
                          }}
                        >
                          Ver referidos
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                      {c.aQuien || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                      {c.primerContacto || "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                      {
                        [
                          c.toque1,
                          c.toque2,
                          c.toque3,
                          c.toque4,
                          c.toque5,
                          c.toque6,
                        ].filter(Boolean).length
                      }
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            openRelations("colleague", c.id);
                          }}
                          title="Ver vínculos"
                        >
                          <Link2 size={16} />
                        </button>
                        <button
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          onClick={() => openForm(c)}
                          title="Editar"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          onClick={() => handleDelete(c.id)}
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {viewingColleague && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setViewingColleague(null);
              setEditingReferredClient(null);
            }}
          />
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-xl text-slate-900 dark:text-slate-100">
                  {viewingColleague.nombreApellido}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {viewingColleague.oficina} ·{" "}
                  {getReferredClients(viewingColleague).length} clientes
                  referidos
                </p>
              </div>
              <button
                onClick={() => {
                  setViewingColleague(null);
                  setEditingReferredClient(null);
                  setReferredClientSearchTerm("");
                }}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-400"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                  />
                  <input
                    type="text"
                    placeholder="Buscar referido..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={referredClientSearchTerm}
                    onChange={(e) =>
                      setReferredClientSearchTerm(e.target.value)
                    }
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigate(
                      `/clientes?newReferral=true&colleagueId=${viewingColleague.id}`,
                    );
                    setViewingColleague(null);
                    setReferredClientSearchTerm("");
                  }}
                >
                  <Plus size={14} className="mr-1" /> Añadir Referido
                </Button>
              </div>
              {(() => {
                const allReferred = getReferredClients(viewingColleague);
                const term = normalizeSearchText(referredClientSearchTerm);
                const filteredReferred = term
                  ? allReferred.filter(
                      (c) =>
                        normalizeSearchText(c.name).includes(term) ||
                        c.phone.includes(referredClientSearchTerm) ||
                        normalizeSearchText(c.email).includes(term),
                    )
                  : allReferred;
                if (filteredReferred.length === 0)
                  return (
                    <p className="text-slate-500 dark:text-slate-400 text-center py-8">
                      {referredClientSearchTerm
                        ? "No se encontraron referidos con ese criterio."
                        : "Este colega aún no tiene clientes referidos."}
                    </p>
                  );
                return filteredReferred.map((client) => {
                  const clientProperties = properties.filter(
                    (p) => p.ownerId === client.id,
                  );
                  return (
                    <div
                      key={client.id}
                      className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-sm transition-shadow"
                    >
                      {editingReferredClient?.id === client.id ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Nombre
                              </label>
                              <input
                                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                                value={referredClientForm.name || ""}
                                onChange={(e) =>
                                  setReferredClientForm({
                                    ...referredClientForm,
                                    name: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Teléfono
                              </label>
                              <input
                                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                                value={referredClientForm.phone || ""}
                                onChange={(e) =>
                                  setReferredClientForm({
                                    ...referredClientForm,
                                    phone: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Email
                              </label>
                              <input
                                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                                value={referredClientForm.email || ""}
                                onChange={(e) =>
                                  setReferredClientForm({
                                    ...referredClientForm,
                                    email: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Ubicación / Zona
                              </label>
                              <input
                                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                                value={referredClientForm.interestZone || ""}
                                onChange={(e) =>
                                  setReferredClientForm({
                                    ...referredClientForm,
                                    interestZone: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Notas
                            </label>
                            <textarea
                              rows={2}
                              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                              value={referredClientForm.notes || ""}
                              onChange={(e) =>
                                setReferredClientForm({
                                  ...referredClientForm,
                                  notes: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingReferredClient(null)}
                            >
                              Cancelar
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                if (!referredClientForm.name?.trim()) {
                                  showToast(
                                    "El nombre es obligatorio",
                                    "error",
                                  );
                                  return;
                                }
                                updateClient({
                                  ...client,
                                  ...referredClientForm,
                                } as Client);
                                addActivityLog({
                                  type: "client",
                                  action: "updated",
                                  title: `Cliente referido editado: ${referredClientForm.name}`,
                                  entityId: client.id,
                                });
                                showToast("Cliente actualizado", "success");
                                setEditingReferredClient(null);
                              }}
                            >
                              Guardar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 space-y-1">
                            <p className="font-bold text-slate-900 dark:text-slate-100">
                              {client.name}
                            </p>
                            <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                              {client.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone size={12} /> {client.phone}
                                </span>
                              )}
                              {client.email && (
                                <span className="flex items-center gap-1">
                                  <Mail size={12} /> {client.email}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {clientProperties.length > 0 ? (
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {clientProperties.map((prop) => (
                                    <span
                                      key={prop.id}
                                      className="flex items-center gap-1 text-blue-600"
                                    >
                                      <Home size={12} />
                                      {prop.title} · {prop.address}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="italic text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-1">
                                  <Home size={12} /> Sin propiedad asociada
                                </span>
                              )}
                            </div>
                            {client.notes && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 italic mt-1">
                                {client.notes}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Ver ficha"
                              onClick={() => navigate(`/clientes/${client.id}`)}
                            >
                              <ExternalLink size={14} />
                            </button>
                            {clientProperties.length > 0 && (
                              <button
                                className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="Ver propiedad"
                                onClick={() =>
                                  openRelations(
                                    "property",
                                    clientProperties[0].id,
                                  )
                                }
                              >
                                <Link2 size={14} />
                              </button>
                            )}
                            <button
                              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Editar"
                              onClick={() => openEditReferredClient(client)}
                            >
                              <Edit3 size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsFormOpen(false)}
          />
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="font-bold text-xl text-slate-900 dark:text-slate-100">
                {editingColleague ? "Editar" : "Nuevo"} Colega
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-400"
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-4 overflow-y-auto max-h-[70vh]"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre y apellido *
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={formData.nombreApellido}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nombreApellido: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Oficina
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={formData.oficina}
                    onChange={(e) =>
                      setFormData({ ...formData, oficina: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Respondió
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={String(formData.respondio)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        respondio: e.target.value === "true",
                      })
                    }
                  >
                    <option value="false">No</option>
                    <option value="true">Sí</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Quién contactó
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={formData.quienContacto}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quienContacto: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cómo respondió (1-10)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={formData.comoRespondio ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        comoRespondio: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ya refirió
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={String(formData.yaRefirio)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        yaRefirio: e.target.value === "true",
                      })
                    }
                  >
                    <option value="false">No</option>
                    <option value="true">Sí</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                    A quién refirió
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={formData.aQuien}
                    onChange={(e) =>
                      setFormData({ ...formData, aQuien: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Primer contacto
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={formData.primerContacto}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        primerContacto: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  "toque1",
                  "toque2",
                  "toque3",
                  "toque4",
                  "toque5",
                  "toque6",
                ].map((t, i) => (
                  <div key={t}>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Toque {i + 1}
                    </label>
                    <input
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={(formData as any)[t] || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, [t]: e.target.value })
                      }
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsFormOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary">
                  {editingColleague ? "Guardar" : "Crear"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
