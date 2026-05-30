import React from 'react';
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
  FileText,
  Bell,
  Star
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { StatCard, Card } from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { useAppContext } from '../context/AppContext';
import { formatDate, formatCurrency } from '../lib/utils';
import { cn } from '../lib/utils';
import { isOverdue, isToday, isWithinNextDays, daysUntil } from '../lib/dates';

export default function Dashboard() {
  const { clients, properties, events, tasks, sales, rentals, documents, activityLogs, completeTask, profile } = useAppContext();
  const navigate = useNavigate();

  const today = new Date().toISOString().split('T')[0];

  // Stats
  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.status !== 'perdido' && c.status !== 'cerrado').length;
  const totalProperties = properties.length;
  const availableProperties = properties.filter(p => p.status === 'disponible').length;
  const soldProperties = properties.filter(p => p.status === 'vendida').length;
  const rentedProperties = properties.filter(p => p.status === 'alquilada').length;
  const activeSales = sales.filter(s => !['vendida', 'caída'].includes(s.estado)).length;
  const activeRentals = rentals.filter(r => r.estado === 'en curso').length;
  const pendingTasks = tasks.filter(t => t.status === 'pendiente' || t.status === 'en proceso').length;
  const pendingDocs = documents.filter(d => d.status === 'pendiente' || d.status === 'vencido').length;

  // Alertas
  const overdueTasks = tasks.filter(t => isOverdue(t.dueDate) && t.status !== 'completada');
  const todayTasks = tasks.filter(t => isToday(t.dueDate) && t.status !== 'completada');
  const expiringRentals = rentals.filter(
    r => r.estado === 'en curso' && isWithinNextDays(r.fechaFin, 30)
  );
  const pendingDocuments = documents.filter(d => d.status === 'pendiente');
  const overdueDocuments = documents.filter(d => d.status === 'vencido');

  const todayEvents = events.filter(e => e.date === today && e.status !== 'cancelado');
  const urgentTasks = tasks.filter(t => (t.priority === 'urgente' || t.status === 'vencida') && t.status !== 'completada');

  const pendingTasksList = tasks
    .filter(t => !['completada', 'cancelada'].includes(t.status))
    .sort((a, b) => {
      const score = (t: typeof tasks[0]) => {
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

  const pinnedClients = clients.filter(c => c.dashboardPinned && !c.dashboardArchived).slice(0, 5);

  const allMovements = activityLogs.slice(0, 10);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bienvenido{profile.name ? ', ' + profile.name : '/a'}</h1>
          <p className="text-gray-500">Este es el resumen de tu actividad inmobiliaria para hoy.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="md" onClick={() => navigate('/reportes')}>Ver Reportes</Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Clientes" value={totalClients} icon={Users} color="blue" />
        <StatCard label="Total Propiedades" value={totalProperties} icon={Home} color="green" />
        <StatCard label="Prop. Disponibles" value={availableProperties} icon={Home} color="green" />
        <StatCard label="Prop. Vendidas" value={soldProperties} icon={TrendingUp} color="purple" />
        <StatCard label="Prop. Alquiladas" value={rentedProperties} icon={Key} color="orange" />
        <StatCard label="Ventas en Curso" value={activeSales} icon={TrendingUp} color="blue" />
        <StatCard label="Alquileres Activos" value={activeRentals} icon={Key} color="green" />
        <StatCard label="Tareas Pendientes" value={pendingTasks} icon={CheckSquare} color="orange" />
      </div>

      {/* Alertas importantes */}
      {(overdueTasks.length > 0 || todayTasks.length > 0 || expiringRentals.length > 0 || pendingDocuments.length > 0 || overdueDocuments.length > 0) && (
        <Card title="Alertas Importantes" subtitle="Requiere atención" className="border-red-100">
          <div className="space-y-3 pt-2">
            {overdueTasks.length > 0 && (
              <AlertRow
                icon={AlertTriangle}
                color="red"
                text={`${overdueTasks.length} tarea${overdueTasks.length > 1 ? 's' : ''} vencida${overdueTasks.length > 1 ? 's' : ''}`}
                actionText="Ver tareas"
                onAction={() => navigate('/tareas')}
              />
            )}
            {todayTasks.length > 0 && (
              <AlertRow
                icon={Bell}
                color="orange"
                text={`${todayTasks.length} tarea${todayTasks.length > 1 ? 's' : ''} para hoy`}
                actionText="Ver tareas"
                onAction={() => navigate('/tareas')}
              />
            )}
            {expiringRentals.length > 0 && (
              <AlertRow
                icon={Clock}
                color="purple"
                text={`${expiringRentals.length} alquiler${expiringRentals.length > 1 ? 'es' : ''} por vencer en 30 días`}
                actionText="Ver alquileres"
                onAction={() => navigate('/alquileres')}
              />
            )}
            {overdueDocuments.length > 0 && (
              <AlertRow
                icon={FileText}
                color="red"
                text={`${overdueDocuments.length} documento${overdueDocuments.length > 1 ? 's' : ''} vencido${overdueDocuments.length > 1 ? 's' : ''}`}
                actionText="Ver documentos"
                onAction={() => navigate('/documentos')}
              />
            )}
            {pendingDocuments.length > 0 && (
              <AlertRow
                icon={FileText}
                color="blue"
                text={`${pendingDocuments.length} documento${pendingDocuments.length > 1 ? 's' : ''} pendiente${pendingDocuments.length > 1 ? 's' : ''}`}
                actionText="Ver documentos"
                onAction={() => navigate('/documentos')}
              />
            )}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Agenda para hoy" subtitle={formatDate(today)}>
            <div className="space-y-4">
              {todayEvents.map(event => (
                <div
                  key={event.id}
                  className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group cursor-pointer"
                  onClick={() => navigate('/agenda')}
                >
                  <div className="flex flex-col items-center justify-center w-12 h-12 bg-blue-50 text-blue-600 rounded-xl shrink-0 font-bold border border-blue-100">
                    <span className="text-[10px] uppercase font-black">{event.time}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-gray-900 truncate">{event.title}</h4>
                      <Badge variant={event.type === 'visita' ? 'green' : 'blue'} size="sm">{event.type}</Badge>
                    </div>
                    <p className="text-sm text-gray-500 truncate mt-0.5">{event.description || event.notes}</p>
                    <div className="flex items-center gap-3 mt-2">
                      {event.propertyId && (
                        <div className="flex items-center text-[10px] text-blue-600 font-black uppercase">
                          <Home size={12} className="mr-1" />
                          {properties.find(p => p.id === event.propertyId)?.title}
                        </div>
                      )}
                      {event.clientId && (
                        <div className="flex items-center text-[10px] text-purple-600 font-black uppercase">
                          <Users size={12} className="mr-1" />
                          {clients.find(c => c.id === event.clientId)?.name}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-1 opacity-0 group-hover:opacity-100 transition-opacity self-center">
                    <ChevronRight size={18} className="text-gray-400" />
                  </div>
                </div>
              ))}
              {todayEvents.length === 0 && (
                <div className="text-center py-10">
                  <Calendar size={40} className="mx-auto text-gray-200 mb-3" />
                  <p className="text-gray-400 text-sm italic">No hay eventos para hoy.</p>
                </div>
              )}
            </div>
          </Card>

          <Card title="Tareas pendientes" subtitle="Ordenadas por fecha">
            <div className="space-y-3">
              {pendingTasksList.slice(0, 8).map(task => (
                <div key={task.id} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:shadow-sm transition-shadow group">
                  <div className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    task.status === 'vencida' || isOverdue(task.dueDate) ? "bg-red-500" :
                    task.status === 'en proceso' ? "bg-blue-500" : "bg-amber-500"
                  )} />
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate('/tareas')}>
                    <h4 className="font-bold text-sm truncate text-gray-900">
                      {task.title}
                    </h4>
                    <div className="flex items-center mt-1 gap-2">
                      <span className="text-xs text-gray-400 flex items-center font-medium">
                        <Clock size={12} className="mr-1" />
                        {formatDate(task.dueDate)}
                        {isOverdue(task.dueDate) && <span className="ml-1 text-red-600 font-bold">(Vencida)</span>}
                        {isToday(task.dueDate) && <span className="ml-1 text-orange-600 font-bold">(Hoy)</span>}
                        {task.status === 'reprogramado' && <span className="ml-1 text-purple-600 font-bold">(Reprogramada)</span>}
                      </span>
                      <Badge size="xs" variant={task.priority === 'urgente' ? 'red' : task.priority === 'alta' ? 'orange' : 'blue'}>{task.priority}</Badge>
                    </div>
                  </div>
                  <button
                    onClick={() => completeTask(task.id)}
                    className="p-2 text-gray-300 hover:text-green-600 transition-colors"
                    title="Marcar como completada"
                  >
                    <CheckCircle2 size={24} />
                  </button>
                </div>
              ))}
              {pendingTasksList.length > 8 && (
                <div className="text-center pt-2">
                  <button onClick={() => navigate('/tareas')} className="text-xs font-bold text-blue-600 hover:underline">Ver todas las tareas ({pendingTasksList.length})</button>
                </div>
              )}
              {pendingTasksList.length === 0 && (
                <div className="text-center py-8">
                  <CheckSquare size={40} className="mx-auto text-gray-200 mb-3" />
                  <p className="text-gray-400 text-sm italic">¡Todo al día por aquí!</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Clientes destacados" subtitle="Enviados al panel">
            <div className="space-y-4">
              {pinnedClients.map(client => (
                <Link key={client.id} to={`/clientes/${client.id}`} className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-xl transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-bold shrink-0 border border-yellow-200">
                    {client.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{client.name}</h4>
                    <p className="text-[10px] text-gray-500 font-black uppercase">{client.type} • {client.origin}</p>
                  </div>
                </Link>
              ))}
              {pinnedClients.length === 0 && (
                <div className="text-center py-6">
                  <Star size={32} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-gray-400 text-sm italic">No hay clientes destacados.</p>
                </div>
              )}
            </div>
          </Card>

          <Card title="Seguimiento de Clientes" subtitle="Nuevos contactos">
            <div className="space-y-4">
              {clients.filter(c => c.status === 'nuevo' || c.status === 'contactado').slice(0, 4).map(client => (
                <Link key={client.id} to={`/clientes/${client.id}`} className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-xl transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0 border border-blue-200">
                    {client.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{client.name}</h4>
                    <p className="text-[10px] text-gray-500 font-black uppercase">{client.type} • {client.origin}</p>
                  </div>
                  <div className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                    <MessageCircle size={18} />
                  </div>
                </Link>
              ))}
              {clients.filter(c => c.status === 'nuevo' || c.status === 'contactado').length === 0 && (
                <div className="text-center py-6">
                  <Users size={32} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-gray-400 text-sm italic">No hay clientes nuevos.</p>
                </div>
              )}
            </div>
          </Card>

          <Card title="Últimos movimientos" className="bg-gray-50/50">
            <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-200">
              {allMovements.map(mov => (
                <div key={mov.id} className="relative">
                  <div className={cn(
                    "absolute -left-7 top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm",
                    mov.type === 'sale' || mov.type === 'property' ? "bg-blue-600" :
                    mov.type === 'client' ? "bg-purple-500" :
                    mov.type === 'task' ? "bg-orange-500" :
                    mov.type === 'event' ? "bg-green-500" : "bg-gray-400"
                  )} />
                  <p className="text-[10px] text-gray-400 font-black uppercase">{formatDate(mov.createdAt)}</p>
                  <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                    <span className="font-bold text-gray-900">{mov.title}</span>
                    {mov.description && <><br /><span className="text-xs text-gray-500">{mov.description}</span></>}
                  </p>
                </div>
              ))}
              {allMovements.length === 0 && (
                <div className="text-center py-4">
                  <Activity size={24} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-xs text-gray-400 italic">No hay movimientos recientes.</p>
                </div>
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
  onAction
}: {
  icon: React.ElementType;
  color: string;
  text: string;
  actionText: string;
  onAction: () => void;
}) {
  const colorMap: Record<string, string> = {
    red: 'text-red-600 bg-red-50',
    orange: 'text-orange-600 bg-orange-50',
    purple: 'text-purple-600 bg-purple-50',
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
  };
  const classes = colorMap[color] || colorMap.blue;

  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", classes)}>
          <Icon size={18} />
        </div>
        <p className="text-sm font-semibold text-gray-800">{text}</p>
      </div>
      <Button variant="ghost" size="sm" className="text-xs font-bold" onClick={onAction}>
        {actionText}
      </Button>
    </div>
  );
}
