import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  ChevronRight,
  Link2,
  Activity,
  User,
  Home,
  Briefcase,
  ShoppingCart,
  Key,
  CheckSquare,
  Calendar,
  FileText,
  Store,
  ClipboardList,
  Plus,
  ChevronDown,
  History,
} from "lucide-react";
import { useRelationsDrawer } from "../context/RelationsDrawerContext";
import { useDocuments } from "../hooks/useDocuments";
import { useReferredColleagues } from "../hooks/useReferredColleagues";
import { useWaitingRoom } from "../hooks/useWaitingRoom";
import { useBuyers } from "../hooks/useBuyers";
import { useActivityLogs } from "../hooks/useActivityLogs";
import { useClients } from "../hooks/useClients";
import { useSales } from "../hooks/useSales";
import { useTasks } from "../hooks/useTasks";
import { useEvents } from "../hooks/useEvents";
import {
  getClientRelations,
  getPropertyRelations,
  getColleagueRelations,
  getBuyerRelations,
  getSaleRelations,
  type RelationEntityType,
  type RelationGroup,
  type RelationItem,
} from "../lib/relations";
import { cn, formatDate } from "../lib/utils";
import { Link } from "react-router-dom";
import { generateId } from "../lib/id";
import Button from "./Button";
import { useUIStore } from "../stores/uiStore";
import { useProperties } from "../hooks/useProperties";

const typeIcons: Record<RelationEntityType, React.ElementType> = {
  client: User,
  property: Home,
  colleague: Briefcase,
  buyer: ShoppingCart,
  sale: Key,
  task: CheckSquare,
  event: Calendar,
  document: FileText,
  marketplace: Store,
  waitingRoom: ClipboardList,
};

function RelationItemCard({ item }: { item: RelationItem }) {
  const Icon = typeIcons[item.type] || Activity;
  const isLog = !!item.metadata?.action;
  return (
    <div className="flex items-start justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 hover:shadow-sm transition-all group">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-center shrink-0">
          <Icon size={14} className="text-slate-400 dark:text-slate-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
            {item.title}
          </p>
          {item.subtitle &&
            (isLog ? (
              <div className="mt-1.5 px-2.5 py-1.5 bg-slate-50/80 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/50 rounded-lg text-[11px] text-slate-600 dark:text-slate-300 break-words leading-relaxed backdrop-blur-sm">
                {item.subtitle}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {item.subtitle}
              </p>
            ))}
          {item.status && !isLog && (
            <span
              className={cn(
                "inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                item.status === "disponible" ||
                  item.status === "completada" ||
                  item.status === "realizado"
                  ? "bg-green-100 text-green-700"
                  : item.status === "reservada" || item.status === "en proceso"
                    ? "bg-blue-100 text-blue-700"
                    : item.status === "vendida" ||
                        item.status === "vencida" ||
                        item.status === "caída"
                      ? "bg-red-100 text-red-700"
                      : item.status === "alquilada"
                        ? "bg-orange-100 text-orange-700"
                        : item.status === "pausada"
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          : item.status === "en_seguimiento"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
              )}
            >
              {item.status}
            </span>
          )}
          {item.date && (
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              {formatDate(item.date)}
            </p>
          )}
        </div>
      </div>
      {item.route && (
        <Link
          to={item.route}
          className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all shrink-0"
          onClick={() => {
            /* drawer stays open, user can navigate */
          }}
        >
          <ChevronRight size={16} />
        </Link>
      )}
    </div>
  );
}

function EmptyGroupState({ title }: { title: string }) {
  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
      <p className="text-xs text-slate-400 dark:text-slate-500 italic">
        Sin {title.toLowerCase()}
      </p>
    </div>
  );
}

type TimelineEntry = {
  id: string;
  type: "log" | "event" | "task";
  date: string;
  title: string;
  subtitle?: string;
  status?: string;
  route?: string;
};

function TimelineView({ items }: { items: TimelineEntry[] }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-10">
        <History size={40} className="mx-auto text-gray-200 mb-3" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No hay interacciones registradas.
        </p>
      </div>
    );
  }

  return (
    <div className="relative pl-4 space-y-6">
      <div className="absolute left-[21px] top-2 bottom-2 w-[2px] bg-slate-200 dark:bg-slate-700" />
      {items.map((item) => {
        const Icon =
          item.type === "log"
            ? Activity
            : item.type === "event"
              ? Calendar
              : CheckSquare;
        return (
          <div key={item.id} className="relative pl-8">
            <div className="absolute left-0 top-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 bg-blue-500 shadow-sm flex items-center justify-center">
              <Icon size={8} className="text-white" />
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 p-3 hover:shadow-sm transition-all">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {item.title}
              </p>
              {item.subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {item.subtitle}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  {formatDate(item.date)}
                </span>
                {item.status && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {item.status}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function EntityRelationsDrawer() {
  const { isOpen, entityType, entityId, closeRelations } = useRelationsDrawer();
  const { referredColleagues } = useReferredColleagues();
  const { documents } = useDocuments();
  const { waitingRoom } = useWaitingRoom();
  const { buyers } = useBuyers();
  const { activityLogs, addActivityLog } = useActivityLogs(entityId);
  const { sales } = useSales();
  const { tasks, addTask } = useTasks();
  const { events } = useEvents();
  const { clients } = useClients();
  const { properties } = useProperties();
  const showToast = useUIStore((state) => state.showToast);
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"relations" | "timeline">(
    "relations",
  );
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    dueDate: new Date().toISOString().split("T")[0],
    priority: "media" as "baja" | "media" | "alta" | "urgente",
  });

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRelations();
    };
    if (isOpen) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, closeRelations]);

  const groups = useMemo<RelationGroup[]>(() => {
    if (!entityType || !entityId) return [];
    const appData = {
      clients,
      properties,
      sales,
      tasks,
      events,
      documents,
      referredColleagues,
      waitingRoom,
      buyers,
      activityLogs,
    };
    switch (entityType) {
      case "client":
        return getClientRelations(entityId, appData);
      case "property":
        return getPropertyRelations(entityId, appData);
      case "colleague":
        return getColleagueRelations(entityId, appData);
      case "buyer":
        return getBuyerRelations(entityId, appData);
      case "sale":
        return getSaleRelations(entityId, appData);
      default:
        return [];
    }
  }, [
    entityType,
    entityId,
    clients,
    properties,
    sales,
    tasks,
    events,
    documents,
    referredColleagues,
    waitingRoom,
    buyers,
    activityLogs,
  ]);

  const timelineItems = useMemo<TimelineEntry[]>(() => {
    if (!entityType || !entityId) return [];

    const relatedSale =
      entityType === "sale"
        ? sales.find((s) => s.id === entityId)
        : undefined;

    const logs: TimelineEntry[] = activityLogs.map((log) => ({
      id: `log-${log.id}`,
      type: "log",
      date: log.createdAt,
      title: log.title,
      subtitle: log.description,
    }));

    const relatedEvents = events.filter((e) => {
      if (entityType === "client") return e.clientId === entityId;
      if (entityType === "property") return e.propertyId === entityId;
      if (entityType === "sale" && relatedSale) {
        return (
          e.clientId === relatedSale.clientCompradorId ||
          e.propertyId === relatedSale.propiedadId
        );
      }
      return false;
    });

    const eventItems: TimelineEntry[] = relatedEvents.map((e) => ({
      id: `event-${e.id}`,
      type: "event",
      date: e.date,
      title: e.title,
      subtitle: e.description || e.notes,
      status: e.type,
      route: "/agenda",
    }));

    const relatedTasks = tasks.filter((t) => {
      if (t.status !== "completada") return false;
      const direct =
        (entityType === "client" && t.clientId === entityId) ||
        (entityType === "property" && t.propertyId === entityId);
      if (direct) return true;
      if (entityType === "sale" && relatedSale) {
        const matchesSale =
          t.clientId === relatedSale.clientCompradorId ||
          t.propertyId === relatedSale.propiedadId;
        if (matchesSale) return true;
      }
      return (t.relatedEntities || []).some(
        (r) => r.type === entityType && r.id === entityId,
      );
    });

    const taskItems: TimelineEntry[] = relatedTasks.map((t) => ({
      id: `task-${t.id}`,
      type: "task",
      date: t.createdAt,
      title: t.title,
      subtitle: t.description,
      status: t.status,
      route: "/tareas",
    }));

    return [...logs, ...eventItems, ...taskItems].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [entityType, entityId, activityLogs, events, tasks, sales]);

  const entityName = useMemo(() => {
    if (!entityType || !entityId) return "";
    if (entityType === "client") {
      return clients.find((c) => c.id === entityId)?.name || "Cliente";
    }
    if (entityType === "property") {
      return properties.find((p) => p.id === entityId)?.title || "Propiedad";
    }
    if (entityType === "colleague") {
      return (
        referredColleagues.find((c) => c.id === entityId)?.nombreApellido ||
        "Colega"
      );
    }
    if (entityType === "buyer") {
      return buyers.find((b) => b.id === entityId)?.nombre || "Comprador";
    }
    if (entityType === "sale") {
      return sales.find((s) => s.id === entityId)?.nombre || "Operación";
    }
    return "";
  }, [
    entityType,
    entityId,
    clients,
    properties,
    referredColleagues,
    buyers,
    sales,
  ]);

  if (!isOpen) return null;

  const hasLinks = groups.some((g) => g.count > 0);

  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={closeRelations}
      />
      {/* Drawer */}
      <div className="relative w-full sm:w-[420px] md:w-[480px] bg-white dark:bg-slate-800 shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Link2 size={18} className="text-blue-600" />
                Vista 360°
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-[280px]">
                {entityName}
              </p>
            </div>
          <button
            onClick={closeRelations}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <X size={20} />
          </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setDrawerTab("relations")}
              className={cn(
                "flex-1 text-xs font-black uppercase tracking-widest py-2 rounded-lg transition-colors",
                drawerTab === "relations"
                  ? "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400"
                  : "text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800",
              )}
            >
              Relaciones
            </button>
            <button
              onClick={() => setDrawerTab("timeline")}
              className={cn(
                "flex-1 text-xs font-black uppercase tracking-widest py-2 rounded-lg transition-colors flex items-center justify-center gap-1",
                drawerTab === "timeline"
                  ? "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400"
                  : "text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800",
              )}
            >
              <History size={14} />
              Línea de Tiempo
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!entityType || !entityId ? (
            <div className="text-center py-10">
              <Activity size={40} className="mx-auto text-gray-200 mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No se encontró información relacionada.
              </p>
            </div>
          ) : drawerTab === "timeline" ? (
            <TimelineView items={timelineItems} />
          ) : !hasLinks ? (
            <div className="text-center py-10">
              <Activity size={40} className="mx-auto text-gray-200 mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No se encontraron vínculos para este objeto.
              </p>
            </div>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setShowTaskForm((s) => !s)}
              >
                <Plus size={14} className="mr-2" /> Crear tarea relacionada
              </Button>
              {showTaskForm && (
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Título
                    </label>
                    <input
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={taskForm.title}
                      onChange={(e) =>
                        setTaskForm({ ...taskForm, title: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Descripción
                    </label>
                    <textarea
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={taskForm.description}
                      onChange={(e) =>
                        setTaskForm({
                          ...taskForm,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Fecha límite
                      </label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                        value={taskForm.dueDate}
                        onChange={(e) =>
                          setTaskForm({ ...taskForm, dueDate: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Prioridad
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                        value={taskForm.priority}
                        onChange={(e) =>
                          setTaskForm({
                            ...taskForm,
                            priority: e.target.value as any,
                          })
                        }
                      >
                        <option value="baja">Baja</option>
                        <option value="media">Media</option>
                        <option value="alta">Alta</option>
                        <option value="urgente">Urgente</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowTaskForm(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        if (!taskForm.title.trim()) {
                          showToast("El título es obligatorio", "error");
                          return;
                        }
                        const newTask = {
                          id: generateId("t"),
                          title: taskForm.title,
                          description: taskForm.description,
                          dueDate: taskForm.dueDate,
                          priority: taskForm.priority,
                          status: "pendiente" as const,
                          relatedEntities: [
                            { type: entityType as any, id: entityId },
                          ],
                          createdAt: new Date().toISOString(),
                        };
                        addTask(newTask);
                        addActivityLog({
                          type: "task",
                          action: "created",
                          title: `Tarea creada desde Vista 360: ${newTask.title}`,
                          entityId: newTask.id,
                        });
                        showToast("Tarea creada", "success");
                        setShowTaskForm(false);
                        setTaskForm({
                          title: "",
                          description: "",
                          dueDate: new Date().toISOString().split("T")[0],
                          priority: "media",
                        });
                      }}
                    >
                      Crear
                    </Button>
                  </div>
                </div>
              )}
              {groups.map((group) => (
                <div key={group.id} className="space-y-3">
                  <button
                    className="flex items-center justify-between w-full"
                    onClick={() => toggleGroup(group.id)}
                  >
                    <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      {group.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
                        {group.count}
                      </span>
                      <ChevronDown
                        size={14}
                        className={cn(
                          "text-slate-400 dark:text-slate-500 transition-transform",
                          collapsedGroups[group.id] ? "-rotate-90" : "",
                        )}
                      />
                    </div>
                  </button>
                  {!collapsedGroups[group.id] &&
                    (group.count > 0 ? (
                      <div className="space-y-2">
                        {group.items.slice(0, 5).map((item) => (
                          <React.Fragment key={`${item.type}-${item.id}`}>
                            <RelationItemCard item={item} />
                          </React.Fragment>
                        ))}
                        {group.items.length > 5 && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
                            + {group.items.length - 5} más
                          </p>
                        )}
                      </div>
                    ) : (
                      <EmptyGroupState title={group.title} />
                    ))}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
