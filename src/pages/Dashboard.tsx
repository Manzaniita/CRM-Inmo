import React from "react";
import {
  Users,
  Home,
  Calendar,
  CheckSquare,
  Clock,
  ChevronRight,
  MessageCircle,
  CheckCircle2,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Key,
  Activity,
  AlertTriangle,
  Bell,
  Star,
  User,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import { StatCard, Card } from "../components/Card";
import Badge from "../components/Badge";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import { Skeleton, SkeletonStat, SkeletonCard, SkeletonList } from "../components/Skeleton";
import { useActivityLogs } from "../hooks/useActivityLogs";
import { useSales } from "../hooks/useSales";
import { useTasks } from "../hooks/useTasks";
import { useEvents } from "../hooks/useEvents";
import { formatDate, formatCurrency } from "../lib/utils";
import { cn } from "../lib/utils";
import { isOverdue, isToday, isWithinNextDays } from "../lib/dates";
import { useAuthStore } from "../stores/authStore";
import { useProperties } from "../hooks/useProperties";
import { useClients } from "../hooks/useClients";

function CircularProgress({
  percentage,
  size = 80,
  strokeWidth = 6,
  color = "blue",
  label,
  sublabel,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: "blue" | "cyan" | "green" | "purple";
  label: string;
  sublabel?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset =
    circumference - (Math.min(percentage, 100) / 100) * circumference;

  const colorClasses = {
    blue: "stroke-accent dark:stroke-dark-accent",
    cyan: "stroke-cyan-500 dark:stroke-cyan-400",
    green: "stroke-emerald-500 dark:stroke-emerald-400",
    purple: "stroke-violet-500 dark:stroke-violet-400",
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className="stroke-slate-100 dark:stroke-slate-700"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className={cn(colorClasses[color])}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
            strokeDasharray={circumference}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {label}
        </p>
        {sublabel && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );
}

function LinearProgress({
  percentage,
  color = "blue",
  label,
  value,
}: {
  percentage: number;
  color?: "blue" | "cyan" | "green" | "purple";
  label: string;
  value: string;
}) {
  const colorClasses = {
    blue: "bg-accent dark:bg-dark-accent",
    cyan: "bg-cyan-500 dark:bg-cyan-400",
    green: "bg-emerald-500 dark:bg-emerald-400",
    purple: "bg-violet-500 dark:bg-violet-400",
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </span>
        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
          {value}
        </span>
      </div>
      <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", colorClasses[color])}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { activityLogs, isLoading: isLoadingLogs } = useActivityLogs();
  const { sales, isLoading: isLoadingSales } = useSales();
  const { tasks, completeTask, isLoading: isLoadingTasks } = useTasks();
  const { events, isLoading: isLoadingEvents } = useEvents();
  const { clients, isLoading: isLoadingClients } = useClients();
  const { properties, isLoading: isLoadingProperties } = useProperties();

  const isLoading =
    isLoadingLogs ||
    isLoadingSales ||
    isLoadingTasks ||
    isLoadingEvents ||
    isLoadingClients ||
    isLoadingProperties;
  const profile = useAuthStore((state) => state.profile);
  const navigate = useNavigate();

  const today = new Date().toISOString().split("T")[0];

  // Stats
  const totalClients = clients.length;
  const activeClients = clients.filter(
    (c) => c.status !== "perdido" && c.status !== "cerrado",
  ).length;
  const totalProperties = properties.length;
  const availableProperties = properties.filter(
    (p) => p.status === "disponible",
  ).length;
  const soldProperties = properties.filter(
    (p) => p.status === "vendida",
  ).length;
  const activeSales = sales.filter(
    (s) => !["vendida", "caída"].includes(s.estado),
  ).length;
  const pendingTasks = tasks.filter(
    (t) => t.status === "pendiente" || t.status === "en proceso",
  ).length;

  // Alertas
  const overdueTasks = tasks.filter(
    (t) =>
      isOverdue(t.dueDate) &&
      !["completada", "cancelada"].includes(t.status),
  );
  const todayTasks = tasks.filter(
    (t) => isToday(t.dueDate) && t.status !== "completada",
  );

  const todayEvents = events.filter(
    (e) => e.date === today && e.status !== "cancelado",
  );
  const pendingTasksList = tasks
    .filter((t) => !["completada", "cancelada"].includes(t.status))
    .sort((a, b) => {
      const score = (t: (typeof tasks)[0]) => {
        if (!t.dueDate) return 4;
        if (isOverdue(t.dueDate)) return 0;
        if (isToday(t.dueDate)) return 1;
        return 2;
      };
      const sa = score(a);
      const sb = score(b);
      if (sa !== sb) return sa - sb;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });

  const pinnedClients = clients
    .filter((c) => c.dashboardPinned && !c.dashboardArchived)
    .slice(0, 5);

  const allMovements = activityLogs.slice(0, 10);

  // Progress calculations
  const totalSalesForGoal = sales.filter((s) => s.estado !== "caída").length;
  const closedSales = sales.filter((s) => s.estado === "vendida").length;
  const salesGoalPercent =
    totalSalesForGoal > 0 ? (closedSales / totalSalesForGoal) * 100 : 0;

  const totalTasksForProgress = tasks.length || 1;
  const completedTasks = tasks.filter((t) => t.status === "completada").length;
  const tasksCompletedPercent = (completedTasks / totalTasksForProgress) * 100;

  if (isLoading) {
    return (
      <div className="space-y-8 pb-10 page-enter">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonStat key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <SkeletonCard lines={4} />
            <SkeletonList count={4} />
          </div>
          <div className="space-y-6">
            <SkeletonCard lines={3} />
            <SkeletonCard lines={3} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 page-enter">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
            Bienvenido{profile?.name ? ", " + profile?.name : "/a"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Este es el resumen de tu actividad inmobiliaria para hoy.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate("/reportes")}
          >
            Ver Reportes
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Total Clientes"
          value={totalClients}
          icon={Users}
          color="blue"
        />
        <StatCard
          label="Total Propiedades"
          value={totalProperties}
          icon={Home}
          color="green"
        />
        <StatCard
          label="Prop. Disponibles"
          value={availableProperties}
          icon={Home}
          color="green"
        />
        <StatCard
          label="Prop. Vendidas"
          value={soldProperties}
          icon={TrendingUp}
          color="purple"
        />
        <StatCard
          label="Ventas en Curso"
          value={activeSales}
          icon={TrendingUp}
          color="cyan"
        />
        <StatCard
          label="Tareas Pendientes"
          value={pendingTasks}
          icon={CheckSquare}
          color="orange"
        />
      </div>

      {/* Progress Goals Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          title="Objetivos de Venta"
          subtitle="Rendimiento del período"
          className="lg:col-span-2"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-2">
            <CircularProgress
              percentage={salesGoalPercent}
              label="Tasa de Cierre"
              sublabel={`${closedSales} de ${totalSalesForGoal} operaciones`}
              color="blue"
              size={90}
            />
            <CircularProgress
              percentage={tasksCompletedPercent}
              label="Tareas Completadas"
              sublabel={`${completedTasks} de ${tasks.length} tareas`}
              color="green"
              size={90}
            />
          </div>
          <div className="mt-6 space-y-4">
            <LinearProgress
              percentage={
                totalClients > 0 ? (activeClients / totalClients) * 100 : 0
              }
              label="Clientes Activos"
              value={`${activeClients} / ${totalClients}`}
              color="cyan"
            />
            <LinearProgress
              percentage={
                totalProperties > 0
                  ? (availableProperties / totalProperties) * 100
                  : 0
              }
              label="Inventario Disponible"
              value={`${availableProperties} / ${totalProperties}`}
              color="purple"
            />
          </div>
        </Card>

        <Card title="Alertas Rápidas" subtitle="Requieren atención">
          <div className="space-y-4 py-2">
            {overdueTasks.length > 0 && (
              <AlertRow
                icon={AlertTriangle}
                color="red"
                text={`${overdueTasks.length} tarea${overdueTasks.length > 1 ? "s" : ""} vencida${overdueTasks.length > 1 ? "s" : ""}`}
                actionText="Ver"
                onAction={() => navigate("/tareas?status=vencida")}
              />
            )}
            {todayTasks.length > 0 && (
              <AlertRow
                icon={Bell}
                color="orange"
                text={`${todayTasks.length} tarea${todayTasks.length > 1 ? "s" : ""} para hoy`}
                actionText="Ver"
                onAction={() => navigate("/tareas")}
              />
            )}
            {overdueTasks.length === 0 && todayTasks.length === 0 && (
              <EmptyState
                icon={CheckCircle2}
                title="¡Todo bajo control!"
                description="No tenés tareas vencidas ni pendientes para hoy."
              />
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Agenda para hoy" subtitle={formatDate(today)}>
            <div className="space-y-3 pt-2">
              {todayEvents.map((event) => (
                <motion.div
                  key={event.id}
                  whileHover={{ x: 4 }}
                  className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-white/5 group cursor-pointer"
                  onClick={() => navigate("/agenda")}
                >
                  <div className="flex flex-col items-center justify-center w-12 h-12 bg-accent/10 dark:bg-dark-accent/15 text-accent dark:text-dark-accent rounded-xl shrink-0 font-bold border border-accent/10 dark:border-dark-accent/20">
                    <span className="text-[10px] uppercase font-black">
                      {event.time}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate">
                        {event.title}
                      </h4>
                      <Badge
                        variant={event.type === "visita" ? "green" : "blue"}
                        size="sm"
                      >
                        {event.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {event.description || event.notes}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      {event.propertyId && (
                        <div className="flex items-center text-[10px] text-accent dark:text-dark-accent font-black uppercase">
                          <Home size={12} className="mr-1" strokeWidth={1.5} />
                          {
                            properties.find((p) => p.id === event.propertyId)
                              ?.title
                          }
                        </div>
                      )}
                      {event.clientId && (
                        <div className="flex items-center text-[10px] text-violet-500 dark:text-violet-400 font-black uppercase">
                          <Users size={12} className="mr-1" strokeWidth={1.5} />
                          {clients.find((c) => c.id === event.clientId)?.name}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-1 opacity-0 group-hover:opacity-100 transition-opacity self-center">
                    <ChevronRight
                      size={18}
                      className="text-slate-300 dark:text-slate-600"
                      strokeWidth={1.5}
                    />
                  </div>
                </motion.div>
              ))}
              {todayEvents.length === 0 && (
                <EmptyState
                  icon={Calendar}
                  title="Sin eventos para hoy"
                  description="Tu agenda está libre. Aprovechá para contactar clientes."
                  action={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/agenda")}
                    >
                      Ir a Agenda
                    </Button>
                  }
                />
              )}
            </div>
          </Card>

          <Card title="Tareas pendientes" subtitle="Ordenadas por fecha">
            <div className="space-y-2 pt-2">
              {pendingTasksList.slice(0, 8).map((task, idx) => {
                const relatedBadges = [
                  ...(task.clientId
                    ? [
                        {
                          label: clients.find((c) => c.id === task.clientId)
                            ?.name,
                          icon: User,
                          variant: "purple" as const,
                        },
                      ]
                    : []),
                  ...(task.propertyId
                    ? [
                        {
                          label: properties.find(
                            (p) => p.id === task.propertyId,
                          )?.title,
                          icon: Home,
                          variant: "blue" as const,
                        },
                      ]
                    : []),
                  ...(task.relatedEntities || [])
                    .map((r) => {
                      if (r.type === "client") {
                        return {
                          label: clients.find((c) => c.id === r.id)?.name,
                          icon: User,
                          variant: "purple" as const,
                        };
                      }
                      if (r.type === "property") {
                        return {
                          label: properties.find((p) => p.id === r.id)?.title,
                          icon: Home,
                          variant: "blue" as const,
                        };
                      }
                      if (r.type === "sale") {
                        const sale = sales.find((s) => s.id === r.id);
                        return {
                          label: sale?.nombre || "Operación",
                          icon: TrendingUp,
                          variant: "green" as const,
                        };
                      }
                      return null;
                    })
                    .filter(Boolean),
                ].filter((b) => b?.label) as {
                  label: string;
                  icon: React.ElementType;
                  variant: "blue" | "green" | "purple";
                }[];

                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    onClick={() => navigate(`/tareas?taskId=${task.id}`)}
                    className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 dark:border-white/5 hover:shadow-soft-md dark:hover:shadow-none transition-all group bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm cursor-pointer"
                  >
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        task.status === "vencida" || isOverdue(task.dueDate)
                          ? "bg-rose-500"
                          : task.status === "en proceso"
                            ? "bg-accent dark:bg-dark-accent"
                            : "bg-amber-500",
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate text-slate-900 dark:text-slate-100">
                        {task.title}
                      </h4>
                      <div className="flex flex-wrap items-center mt-1 gap-2">
                        {relatedBadges.map((b, i) => (
                          <Badge
                            key={i}
                            size="xs"
                            variant={b.variant}
                            className="gap-1"
                          >
                            <b.icon size={10} strokeWidth={1.5} />
                            <span className="truncate max-w-[120px]">
                              {b.label}
                            </span>
                          </Badge>
                        ))}
                        <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center font-medium">
                          <Clock size={12} className="mr-1" strokeWidth={1.5} />
                          {formatDate(task.dueDate)}
                          {isOverdue(task.dueDate) && (
                            <span className="ml-1 text-rose-500 font-bold">
                              (Vencida)
                            </span>
                          )}
                          {isToday(task.dueDate) && (
                            <span className="ml-1 text-amber-500 font-bold">
                              (Hoy)
                            </span>
                          )}
                          {task.status === "reprogramado" && (
                            <span className="ml-1 text-violet-500 font-bold">
                              (Reprogramada)
                            </span>
                          )}
                        </span>
                        <Badge
                          size="xs"
                          variant={
                            task.priority === "urgente"
                              ? "red"
                              : task.priority === "alta"
                                ? "orange"
                                : "blue"
                          }
                        >
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        completeTask(task.id);
                      }}
                      className="p-2 text-slate-300 dark:text-slate-600 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
                      title="Marcar como completada"
                    >
                      <CheckCircle2 size={22} strokeWidth={1.5} />
                    </motion.button>
                  </motion.div>
                );
              })}
              {pendingTasksList.length > 8 && (
                <div className="text-center pt-2">
                  <button
                    onClick={() => navigate("/tareas")}
                    className="text-xs font-bold text-accent dark:text-dark-accent hover:underline"
                  >
                    Ver todas las tareas ({pendingTasksList.length})
                  </button>
                </div>
              )}
              {pendingTasksList.length === 0 && (
                <EmptyState
                  icon={CheckSquare}
                  title="¡Todo al día!"
                  description="No tenés tareas pendientes."
                  action={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/tareas")}
                    >
                      Nueva tarea
                    </Button>
                  }
                />
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Clientes destacados" subtitle="Enviados al panel">
            <div className="space-y-3 pt-2">
              {pinnedClients.map((client) => (
                <Link
                  key={client.id}
                  to={`/clientes/${client.id}`}
                  className="flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 rounded-xl transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center text-amber-700 dark:text-amber-400 font-bold shrink-0 border border-amber-200 dark:border-amber-500/20">
                    {client.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-accent dark:group-hover:text-dark-accent transition-colors">
                      {client.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase">
                      {client.type} • {client.origin}
                    </p>
                  </div>
                </Link>
              ))}
              {pinnedClients.length === 0 && (
                <EmptyState
                  icon={Star}
                  title="Sin clientes destacados"
                  description="Marcá clientes importantes para verlos aquí."
                />
              )}
            </div>
          </Card>

          <Card title="Seguimiento de Clientes" subtitle="Nuevos contactos">
            <div className="space-y-3 pt-2">
              {clients
                .filter(
                  (c) => c.status === "nuevo" || c.status === "contactado",
                )
                .slice(0, 4)
                .map((client) => (
                  <Link
                    key={client.id}
                    to={`/clientes/${client.id}`}
                    className="flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 rounded-xl transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-accent/10 dark:bg-dark-accent/15 flex items-center justify-center text-accent dark:text-dark-accent font-bold shrink-0 border border-accent/10 dark:border-dark-accent/20">
                      {client.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-accent dark:group-hover:text-dark-accent transition-colors">
                        {client.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase">
                        {client.type} • {client.origin}
                      </p>
                    </div>
                    <div className="p-2 text-emerald-500 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors">
                      <MessageCircle size={18} strokeWidth={1.5} />
                    </div>
                  </Link>
                ))}
              {clients.filter(
                (c) => c.status === "nuevo" || c.status === "contactado",
              ).length === 0 && (
                <EmptyState
                  icon={Users}
                  title="Sin clientes nuevos"
                  description="Todos tus clientes están en seguimiento avanzado."
                />
              )}
            </div>
          </Card>

          <Card
            title="Últimos movimientos"
            className="bg-slate-50/50 dark:bg-slate-900/30"
          >
            <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200 dark:before:bg-slate-700">
              {allMovements.map((mov) => (
                <div key={mov.id} className="relative">
                  <div
                    className={cn(
                      "absolute -left-7 top-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 shadow-sm",
                      mov.type === "sale" || mov.type === "property"
                        ? "bg-accent dark:bg-dark-accent"
                        : mov.type === "client"
                          ? "bg-violet-500 dark:bg-violet-400"
                          : mov.type === "task"
                            ? "bg-amber-500 dark:bg-amber-400"
                            : mov.type === "event"
                              ? "bg-emerald-500 dark:bg-emerald-400"
                              : "bg-slate-400 dark:bg-slate-500",
                    )}
                  />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase">
                    {formatDate(mov.createdAt)}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {mov.title}
                    </span>
                    {mov.description && (
                      <>
                        <br />
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {mov.description}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              ))}
              {allMovements.length === 0 && (
                <EmptyState
                  icon={Activity}
                  title="Sin movimientos recientes"
                  description="Las acciones que realices aparecerán aquí."
                />
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function AlertRow({
  icon: Icon,
  color,
  text,
  actionText,
  onAction,
}: {
  icon: React.ElementType;
  color: string;
  text: string;
  actionText: string;
  onAction: () => void;
}) {
  const colorMap: Record<string, string> = {
    red: "text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400",
    orange:
      "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400",
    purple:
      "text-violet-600 bg-violet-50 dark:bg-violet-500/10 dark:text-violet-400",
    blue: "text-accent bg-blue-50 dark:bg-dark-accent/10 dark:text-dark-accent",
    green:
      "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400",
  };
  const classes = colorMap[color] || colorMap.blue;

  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center",
            classes,
          )}
        >
          <Icon size={18} strokeWidth={1.5} />
        </div>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {text}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="text-xs font-bold"
        onClick={onAction}
      >
        {actionText}
      </Button>
    </div>
  );
}
