import React, { useState, useEffect } from "react";
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  AlertCircle,
  MoreVertical,
  CheckCircle2,
  Trash2,
  Calendar,
  LayoutGrid,
  List as ListIcon,
  X,
  User,
  Home,
  MessageSquare,
  Briefcase,
  ShoppingCart,
  Gauge,
  RotateCcw,
  Loader2,
} from "lucide-react";
import {
  useParams,
  useNavigate,
  useLocation,
  Link,
  useSearchParams,
} from "react-router-dom";

import { Task, TaskPriority, TaskStatus, TaskRelatedEntity } from "../types";
import Badge from "../components/Badge";
import Button from "../components/Button";
import SearchableSelect from "../components/SearchableSelect";
import { cn, formatDate } from "../lib/utils";
import { isOverdue } from "../lib/dates";
import { formatRecurrenceLabel, type RecurrenceFrequency } from "../lib/recurrence";
import { generateId } from "../lib/id";
import { validateTask } from "../lib/validators";
import { useUIStore } from "../stores/uiStore";
import { useProperties } from "../hooks/useProperties";
import { useClients } from "../hooks/useClients";
import { useTasks } from "../hooks/useTasks";
import { useSales } from "../hooks/useSales";
import { useActivityLogs } from "../hooks/useActivityLogs";
import { useReferredColleagues } from "../hooks/useReferredColleagues";
import { useBuyers } from "../hooks/useBuyers";

export default function Tasks() {
  const { referredColleagues } = useReferredColleagues();
  const { buyers } = useBuyers();
  const { addActivityLog } = useActivityLogs();
  const { tasks, isLoading, addTask, updateTask, completeTask, deleteTask } =
    useTasks();
  const { sales } = useSales();
  const { clients } = useClients();
  const { properties } = useProperties();
  const showToast = useUIStore((state) => state.showToast);
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterEntityType, setFilterEntityType] = useState<string>("all");
  const [showCompleted, setShowCompleted] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Task>>({
    title: "",
    description: "",
    priority: "media",
    status: "pendiente",
    dueDate: new Date().toISOString().split("T")[0],
    notes: "",
    clientId: "",
    propertyId: "",
    relatedEntities: [],
    isRecurring: false,
    recurrenceFrequency: undefined,
    recurrenceEndDate: "",
  });

  React.useEffect(() => {
    if (
      location.state?.prefillClientId ||
      location.state?.prefillPropertyId ||
      location.state?.prefillRelatedEntities
    ) {
      handleOpenForm();
      setFormData((prev) => ({
        ...prev,
        clientId: location.state.prefillClientId || "",
        propertyId: location.state.prefillPropertyId || "",
        relatedEntities:
          location.state.prefillRelatedEntities || prev.relatedEntities || [],
      }));
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  React.useEffect(() => {
    const taskId = searchParams.get("taskId");
    if (taskId) {
      const task = tasks.find((t) => t.id === taskId);
      if (task) handleOpenForm(task);
    }
  }, [searchParams, tasks]);

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesPriority =
      filterPriority === "all" || t.priority === filterPriority;
    const matchesStatus = filterStatus === "all" || t.status === filterStatus;
    const matchesEntity =
      filterEntityType === "all" ||
      (() => {
        const related = t.relatedEntities || [];
        if (filterEntityType === "client")
          return !!t.clientId || related.some((r) => r.type === "client");
        if (filterEntityType === "property")
          return !!t.propertyId || related.some((r) => r.type === "property");
        if (filterEntityType === "colleague")
          return related.some((r) => r.type === "colleague");
        if (filterEntityType === "sale")
          return related.some((r) => r.type === "sale");
        return true;
      })();
    return matchesSearch && matchesPriority && matchesStatus && matchesEntity;
  });

  const priorityRank: Record<TaskPriority, number> = {
    urgente: 0,
    alta: 1,
    media: 2,
    baja: 3,
  };

  const sortedTasks = [...filteredTasks]
    .filter((t) => showCompleted || t.status !== "completada")
    .sort((a, b) => {
      const aCompleted = a.status === "completada";
      const bCompleted = b.status === "completada";

      // Completadas siempre al final
      if (aCompleted && !bCompleted) return 1;
      if (!aCompleted && bCompleted) return -1;

      if (aCompleted && bCompleted) {
        // Entre completadas, ordenar por fecha de creación descendente
        return (b.createdAt || "").localeCompare(a.createdAt || "");
      }

      // 1. Vencidas primero
      const aOverdue = isOverdue(a.dueDate);
      const bOverdue = isOverdue(b.dueDate);
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;

      // 2. Por prioridad
      const pa = priorityRank[a.priority] ?? 99;
      const pb = priorityRank[b.priority] ?? 99;
      if (pa !== pb) return pa - pb;

      // 3. Por fecha límite más cercana
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });

  const handleOpenForm = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setFormData(task);
    } else {
      setEditingTask(null);
      setFormData({
        title: "",
        description: "",
        priority: "media",
        status: "pendiente",
        dueDate: new Date().toISOString().split("T")[0],
        notes: "",
        clientId: "",
        propertyId: "",
        isRecurring: false,
        recurrenceFrequency: undefined,
        recurrenceEndDate: "",
      });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateTask(formData);
    if (!validation.valid) {
      showToast(validation.message || "Error de validación", "error");
      return;
    }

    // Normalize relatedEntities
    const relatedEntities = (formData.relatedEntities || []).filter(
      (r) => r.id,
    );
    const data = { ...formData, relatedEntities };

    if (editingTask) {
      const updatedTask = { ...editingTask, ...data } as Task;
      const originalDueDate = new Date(editingTask.dueDate);
      const newDueDate = new Date(updatedTask.dueDate);
      const now = new Date();
      if (
        (editingTask.status === "vencida" ||
          (editingTask.status === "pendiente" && originalDueDate < now)) &&
        newDueDate > now
      ) {
        updatedTask.status = "reprogramado";
      }
      updateTask(updatedTask);
    } else {
      const newTask: Task = {
        ...(data as Task),
        id: generateId("t"),
        createdAt: new Date().toISOString(),
      };
      addTask(newTask);
      addActivityLog({
        type: "task",
        action: "created",
        title: `Tarea creada: ${newTask.title}`,
        entityId: newTask.id,
      });
    }
    setIsFormOpen(false);
  };

  const quickComplete = (task: Task) => {
    completeTask(task.id);
    addActivityLog({
      type: "task",
      action: "status_changed",
      title: `Tarea completada: ${task.title}`,
      entityId: task.id,
    });
  };

  const quickReschedule = (task: Task) => {
    const newDate = prompt(
      "Ingrese nueva fecha límite (YYYY-MM-DD):",
      task.dueDate,
    );
    if (!newDate || !/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
      showToast("Fecha inválida", "error");
      return;
    }
    updateTask({ ...task, dueDate: newDate, status: "reprogramado" });
    addActivityLog({
      type: "task",
      action: "updated",
      title: `Tarea reprogramada: ${task.title}`,
      entityId: task.id,
    });
    showToast("Tarea reprogramada", "success");
  };

  const getPriorityVariant = (priority: string): any => {
    switch (priority) {
      case "urgente":
        return "red";
      case "alta":
        return "orange";
      case "media":
        return "blue";
      case "baja":
        return "gray";
      default:
        return "gray";
    }
  };

  const getStatusVariant = (status: string): any => {
    switch (status) {
      case "pendiente":
        return "gray";
      case "en proceso":
        return "blue";
      case "completada":
        return "green";
      case "vencida":
        return "red";
      case "reprogramado":
        return "purple";
      default:
        return "gray";
    }
  };

  const renderTaskForm = () => {
    const related = formData.relatedEntities || [];
    const addRelated = (type: TaskRelatedEntity["type"], id: string) => {
      if (!id) return;
      const exists = related.some((r) => r.type === type && r.id === id);
      if (exists) return;
      setFormData({ ...formData, relatedEntities: [...related, { type, id }] });
    };
    const removeRelated = (type: TaskRelatedEntity["type"], id: string) => {
      setFormData({
        ...formData,
        relatedEntities: related.filter(
          (r) => !(r.type === type && r.id === id),
        ),
      });
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setIsFormOpen(false)}
        ></div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-bold text-xl text-slate-900 dark:text-slate-100">
              {editingTask ? "Editar Tarea" : "Nueva Tarea"}
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
            className="p-6 space-y-4 max-h-[70vh] overflow-y-auto"
          >
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                Título *
              </label>
              <input
                required
                type="text"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                Descripción
              </label>
              <textarea
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Prioridad *
                </label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: e.target.value as TaskPriority,
                    })
                  }
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Estado *
                </label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as TaskStatus,
                    })
                  }
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en proceso">En proceso</option>
                  <option value="completada">Completada</option>
                  <option value="vencida">Vencida</option>
                  <option value="reprogramado">Reprogramado</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                Fecha Límite
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
              />
            </div>
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 space-y-3">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isRecurring || false}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isRecurring: e.target.checked,
                      recurrenceFrequency: e.target.checked
                        ? formData.recurrenceFrequency || "yearly"
                        : undefined,
                    })
                  }
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Tarea recurrente
              </label>
              {formData.isRecurring && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Frecuencia
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={formData.recurrenceFrequency || "yearly"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          recurrenceFrequency:
                            e.target.value as RecurrenceFrequency,
                        })
                      }
                    >
                      <option value="daily">Diaria</option>
                      <option value="weekly">Semanal</option>
                      <option value="monthly">Mensual</option>
                      <option value="yearly">Anual</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Fin (opcional)
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={formData.recurrenceEndDate || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          recurrenceEndDate: e.target.value || undefined,
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                Vincular con
              </label>
              <div className="grid grid-cols-1 gap-3">
                <SearchableSelect
                  placeholder="Cliente..."
                  value={""}
                  onChange={(value) => addRelated("client", value)}
                  options={clients.map((c) => ({
                    value: c.id,
                    label: c.name,
                    subtitle: c.phone,
                  }))}
                  emptyLabel="Ninguno"
                  allowEmpty
                />
                <SearchableSelect
                  placeholder="Propiedad..."
                  value={""}
                  onChange={(value) => addRelated("property", value)}
                  options={properties.map((p) => ({
                    value: p.id,
                    label: p.title,
                    subtitle: p.address,
                  }))}
                  emptyLabel="Ninguna"
                  allowEmpty
                />
                <SearchableSelect
                  placeholder="Colega..."
                  value={""}
                  onChange={(value) => addRelated("colleague", value)}
                  options={referredColleagues.map((c) => ({
                    value: c.id,
                    label: c.nombreApellido,
                    subtitle: c.oficina,
                  }))}
                  emptyLabel="Ninguno"
                  allowEmpty
                />
                <SearchableSelect
                  placeholder="Reservómetro..."
                  value={""}
                  onChange={(value) => addRelated("sale", value)}
                  options={sales.map((s) => ({
                    value: s.id,
                    label: s.nombre || `Operación ${s.id}`,
                    subtitle: s.externalPropertyAddress || "",
                  }))}
                  emptyLabel="Ninguna"
                  allowEmpty
                />
                <SearchableSelect
                  placeholder="Comprador..."
                  value={""}
                  onChange={(value) => addRelated("buyer", value)}
                  options={buyers.map((b) => ({
                    value: b.id,
                    label: b.nombre,
                    subtitle: b.telefono,
                  }))}
                  emptyLabel="Ninguno"
                  allowEmpty
                />
              </div>
              {related.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {related.map((r) => {
                    let label = "";
                    if (r.type === "client")
                      label = clients.find((c) => c.id === r.id)?.name || r.id;
                    if (r.type === "property")
                      label =
                        properties.find((p) => p.id === r.id)?.title || r.id;
                    if (r.type === "colleague")
                      label =
                        referredColleagues.find((c) => c.id === r.id)
                          ?.nombreApellido || r.id;
                    if (r.type === "sale")
                      label =
                        sales.find((s) => s.id === r.id)?.nombre ||
                        `Operación ${r.id}`;
                    if (r.type === "buyer")
                      label = buyers.find((b) => b.id === r.id)?.nombre || r.id;
                    return (
                      <span
                        key={`${r.type}-${r.id}`}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100"
                      >
                        {label}
                        <button
                          type="button"
                          className="hover:text-blue-900"
                          onClick={() => removeRelated(r.type, r.id)}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsFormOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary">
                {editingTask ? "Guardar Cambios" : "Crear Tarea"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderKanban = () => {
    const statuses: TaskStatus[] = [
      "pendiente",
      "en proceso",
      "completada",
      "vencida",
      "reprogramado",
    ];
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
        {statuses.map((status) => (
          <div
            key={status}
            className="flex-1 min-w-[300px] flex flex-col gap-4"
          >
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {status}
              </h3>
              <Badge variant={getStatusVariant(status)} size="sm">
                {sortedTasks.filter((t) => t.status === status).length}
              </Badge>
            </div>
            <div className="flex-1 space-y-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              {sortedTasks
                .filter((t) => t.status === status)
                .map((task) => (
                  <div
                    key={task.id}
                    className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-blue-300 transition-all group cursor-pointer"
                    onClick={() => handleOpenForm(task)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Badge
                        variant={getPriorityVariant(task.priority)}
                        size="sm"
                      >
                        {task.priority}
                      </Badge>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm("¿Eliminar esta tarea?"))
                            deleteTask(task.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 dark:text-slate-500 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">
                      {task.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                      {task.description}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {formatDate(task.dueDate)}
                      </span>
                      <div className="flex gap-1">
                        {task.clientId && (
                          <User size={12} className="text-blue-500" />
                        )}
                        {task.propertyId && (
                          <Home size={12} className="text-purple-500" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderList = () => (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="divide-y divide-gray-100">
        {sortedTasks.map((task) => (
          <div
            key={task.id}
            className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-4 group"
          >
            <button
              onClick={() => completeTask(task.id)}
              className={cn(
                "transition-colors",
                task.status === "completada"
                  ? "text-green-500"
                  : "text-slate-300 dark:text-slate-600 hover:text-green-600",
              )}
            >
              <CheckCircle2 size={24} />
            </button>
            <div
              className="flex-1 min-w-0 cursor-pointer"
              onClick={() => handleOpenForm(task)}
            >
              <div className="flex items-center gap-2 mb-1">
                <h4
                  className={cn(
                    "font-semibold text-slate-900 dark:text-slate-100 truncate",
                    task.status === "completada" &&
                      "line-through text-slate-400 dark:text-slate-500",
                  )}
                >
                  {task.title}
                </h4>
                <Badge variant={getPriorityVariant(task.priority)} size="sm">
                  {task.priority}
                </Badge>
                {task.isRecurring && (
                  <Badge variant="purple" size="sm">
                    {formatRecurrenceLabel(
                      task.recurrenceFrequency,
                      task.recurrenceEndDate,
                    )}
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-400 dark:text-slate-500">
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span
                    className={cn(
                      task.status === "vencida"
                        ? "text-red-500 font-bold"
                        : "text-slate-500 dark:text-slate-400",
                    )}
                  >
                    {formatDate(task.dueDate)}
                  </span>
                </div>
                {task.clientId && (
                  <Link
                    to={`/clientes?clientId=${task.clientId}`}
                    className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <User
                      size={14}
                      className="text-slate-400 dark:text-slate-500"
                    />
                    <span>
                      {clients.find((c) => c.id === task.clientId)?.name}
                    </span>
                  </Link>
                )}
                {task.propertyId && (
                  <Link
                    to={`/propiedades?propertyId=${task.propertyId}`}
                    className="flex items-center gap-1 hover:text-purple-600 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Home
                      size={14}
                      className="text-slate-400 dark:text-slate-500"
                    />
                    <span>
                      {properties.find((p) => p.id === task.propertyId)?.title}
                    </span>
                  </Link>
                )}
                {task.relatedEntities &&
                  task.relatedEntities.map((r) => {
                    let label = "";
                    let icon = null;
                    if (r.type === "client") {
                      label = clients.find((c) => c.id === r.id)?.name || r.id;
                      icon = <User size={12} />;
                    }
                    if (r.type === "property") {
                      label =
                        properties.find((p) => p.id === r.id)?.title || r.id;
                      icon = <Home size={12} />;
                    }
                    if (r.type === "colleague") {
                      label =
                        referredColleagues.find((c) => c.id === r.id)
                          ?.nombreApellido || r.id;
                      icon = <Briefcase size={12} />;
                    }
                    if (r.type === "sale") {
                      label =
                        sales.find((s) => s.id === r.id)?.nombre ||
                        `Op. ${r.id.slice(0, 6)}`;
                      icon = <Gauge size={12} />;
                    }
                    if (r.type === "buyer") {
                      label = buyers.find((b) => b.id === r.id)?.nombre || r.id;
                      icon = <ShoppingCart size={12} />;
                    }
                    if (!label) return null;
                    return (
                      <span
                        key={`${r.type}-${r.id}`}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      >
                        {icon}
                        {label}
                      </span>
                    );
                  })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusVariant(task.status)} size="sm">
                {task.status}
              </Badge>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                {task.status !== "completada" &&
                  task.status !== "cancelada" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        quickComplete(task);
                      }}
                      className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      title="Completar"
                    >
                      <CheckCircle2 size={16} />
                    </button>
                  )}
                {task.status !== "completada" &&
                  task.status !== "cancelada" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        quickReschedule(task);
                      }}
                      className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      title="Reprogramar"
                    >
                      <RotateCcw size={16} />
                    </button>
                  )}
                <button
                  onClick={() => {
                    if (window.confirm("¿Eliminar esta tarea?"))
                      deleteTask(task.id);
                  }}
                  className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={() => handleOpenForm(task)}
                  className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {sortedTasks.length === 0 && (
          <div className="py-20 text-center">
            <CheckSquare size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {searchTerm ||
              filterPriority !== "all" ||
              filterStatus !== "all" ||
              filterEntityType !== "all" ||
              showCompleted
                ? "No se encontraron tareas con los filtros actuales."
                : "No hay tareas pendientes."}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Tareas
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Organiza tu trabajo diario y seguimiento de clientes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 mr-2">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === "list"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800",
              )}
            >
              <ListIcon size={18} />
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === "kanban"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800",
              )}
            >
              <LayoutGrid size={18} />
            </button>
          </div>
          <Button variant="primary" onClick={() => handleOpenForm()}>
            <Plus size={20} className="mr-2" /> Nueva Tarea
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
            Pendientes
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {tasks.filter((t) => t.status === "pendiente").length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
            En Proceso
          </p>
          <p className="text-2xl font-bold text-blue-600">
            {tasks.filter((t) => t.status === "en proceso").length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
            Urgentes
          </p>
          <p className="text-2xl font-bold text-red-600">
            {
              tasks.filter(
                (t) => t.priority === "urgente" && t.status !== "completada",
              ).length
            }
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
            Vencidas
          </p>
          <p className="text-2xl font-bold text-orange-600">
            {tasks.filter((t) => t.status === "vencida").length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
            Reprogramadas
          </p>
          <p className="text-2xl font-bold text-purple-600">
            {tasks.filter((t) => t.status === "reprogramado").length}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative flex-1 max-w-md w-full">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
          />
          <input
            type="text"
            placeholder="Buscar tareas..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <select
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none bg-white dark:bg-slate-800 min-w-[140px]"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="en proceso">En proceso</option>
            <option value="vencida">Vencidas</option>
            <option value="completada">Completadas</option>
            <option value="cancelada">Canceladas</option>
            <option value="reprogramado">Reprogramadas</option>
          </select>
          <select
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none bg-white dark:bg-slate-800 min-w-[140px]"
            value={filterEntityType}
            onChange={(e) => setFilterEntityType(e.target.value)}
          >
            <option value="all">Todas las entidades</option>
            <option value="client">Cliente</option>
            <option value="property">Propiedad</option>
            <option value="colleague">Colega</option>
            <option value="sale">Reservómetro</option>
          </select>
          <select
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none bg-white dark:bg-slate-800 min-w-[140px]"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="all">Todas las prioridades</option>
            <option value="urgente">Urgente</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Ver completadas
          </label>
        </div>
      </div>

      {viewMode === "list" ? renderList() : renderKanban()}

      {isFormOpen && renderTaskForm()}
    </div>
  );
}
