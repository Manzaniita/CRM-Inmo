import React, { useState } from "react";
import {
  Plus,
  Search,
  Sofa,
  X,
  Trash2,
  Edit3,
  CheckCircle2,
} from "lucide-react";
import { useWaitingRoom } from "../hooks/useWaitingRoom";
import Badge from "../components/Badge";
import Button from "../components/Button";
import { Card } from "../components/Card";
import { cn, normalizeSearchText } from "../lib/utils";
import { generateId } from "../lib/id";
import { validateWaitingRoom } from "../lib/validators";
import type { WaitingRoomEntry, WaitingRoomStatus } from "../types";
import { useUIStore } from "../stores/uiStore";

const STATUS_VARIANT: Record<WaitingRoomStatus, string> = {
  pendiente: "orange",
  contactado: "blue",
  descartado: "gray",
  convertido: "green",
};

export default function WaitingRoom() {
  const {
    waitingRoom,
    isLoading,
    addWaitingRoomEntry,
    updateWaitingRoomEntry,
    deleteWaitingRoomEntry,
  } = useWaitingRoom();
  const showToast = useUIStore((state) => state.showToast);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WaitingRoomEntry | null>(
    null,
  );

  const [formData, setFormData] = useState<Partial<WaitingRoomEntry>>({
    nombre: "",
    telefono: "",
    email: "",
    interes: "",
    estado: "pendiente",
    fechaIngreso: new Date().toISOString().split("T")[0],
    notas: "",
  });

  const lowerSearch = normalizeSearchText(searchTerm);

  const filtered = waitingRoom
    .filter((e) => {
      const matchesSearch =
        normalizeSearchText(e.nombre).includes(lowerSearch) ||
        e.telefono.includes(searchTerm) ||
        normalizeSearchText(e.email).includes(lowerSearch);
      const matchesStatus = !filterStatus || e.estado === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort(
      (a, b) =>
        new Date(b.fechaIngreso).getTime() - new Date(a.fechaIngreso).getTime(),
    );

  const openForm = (entry?: WaitingRoomEntry) => {
    if (entry) {
      setEditingEntry(entry);
      setFormData(entry);
    } else {
      setEditingEntry(null);
      setFormData({
        nombre: "",
        telefono: "",
        email: "",
        interes: "",
        estado: "pendiente",
        fechaIngreso: new Date().toISOString().split("T")[0],
        notas: "",
      });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateWaitingRoom(formData);
    if (!validation.valid) {
      showToast(validation.message || "Error de validación", "error");
      return;
    }
    if (editingEntry) {
      updateWaitingRoomEntry({
        ...(formData as WaitingRoomEntry),
        id: editingEntry.id,
      });
    } else {
      addWaitingRoomEntry({
        ...(formData as WaitingRoomEntry),
        id: generateId("w"),
      });
    }
    setIsFormOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Eliminar esta entrada?")) {
      deleteWaitingRoomEntry(id);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Sala de Espera
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Interesados y personas pendientes de atención.
          </p>
        </div>
        <Button variant="primary" onClick={() => openForm()}>
          <Plus size={18} className="mr-2" /> Nuevo Ingreso
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative flex-1 max-w-md w-full">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
          />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o email..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="contactado">Contactado</option>
            <option value="descartado">Descartado</option>
            <option value="convertido">Convertido</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <Sofa size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {searchTerm || filterStatus
              ? "No se encontraron resultados."
              : "La sala de espera está vacía."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((entry) => (
            <div key={entry.id}>
              <Card className="hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100">
                      {entry.nombre}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {entry.telefono} • {entry.email}
                    </p>
                  </div>
                  <Badge variant={STATUS_VARIANT[entry.estado] as any}>
                    {entry.estado}
                  </Badge>
                </div>
                <div className="mt-3 space-y-1 text-sm">
                  <p className="text-slate-600 dark:text-slate-400">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Interés:
                    </span>{" "}
                    {entry.interes || "-"}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Ingreso:
                    </span>{" "}
                    {entry.fechaIngreso}
                  </p>
                  {entry.notas && (
                    <p className="text-slate-500 dark:text-slate-400 text-xs italic">
                      {entry.notas}
                    </p>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                  <button
                    className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    onClick={() => openForm(entry)}
                    title="Editar"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    onClick={() => handleDelete(entry.id)}
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsFormOpen(false)}
          />
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="font-bold text-xl text-slate-900 dark:text-slate-100">
                {editingEntry ? "Editar" : "Nuevo"} Ingreso
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
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre *
                </label>
                <input
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={formData.telefono}
                    onChange={(e) =>
                      setFormData({ ...formData, telefono: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Interés
                </label>
                <input
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.interes}
                  onChange={(e) =>
                    setFormData({ ...formData, interes: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Estado
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={formData.estado}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estado: e.target.value as WaitingRoomStatus,
                      })
                    }
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="contactado">Contactado</option>
                    <option value="descartado">Descartado</option>
                    <option value="convertido">Convertido</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Fecha de ingreso
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={formData.fechaIngreso}
                    onChange={(e) =>
                      setFormData({ ...formData, fechaIngreso: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notas
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.notas}
                  onChange={(e) =>
                    setFormData({ ...formData, notas: e.target.value })
                  }
                />
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
                  {editingEntry ? "Guardar" : "Crear"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
