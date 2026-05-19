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
  Activity
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { StatCard, Card } from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { useAppContext } from '../context/AppContext';
import { formatDate, formatCurrency } from '../lib/utils';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const { clients, properties, events, tasks, sales, rentals, completeTask } = useAppContext();
  const navigate = useNavigate();

  // Dynamic Date for "Today"
  const today = new Date().toISOString().split('T')[0];

  const activeClients = clients.filter(c => c.status !== 'perdido' && c.status !== 'cerrado').length;
  const totalProperties = properties.length;
  const pendingTasks = tasks.filter(t => t.status === 'pendiente' || t.status === 'en proceso').length;
  const activeOperations = sales.filter(s => !['vendida', 'caída'].includes(s.estado)).length + 
                           rentals.filter(r => !['finalizado', 'cancelado'].includes(r.estado)).length;

  const todayEvents = events.filter(e => e.date === today && e.status !== 'cancelado');
  const urgentTasks = tasks.filter(t => (t.priority === 'urgente' || t.status === 'vencida') && t.status !== 'completada');

    const pendingTasksList = tasks
      .filter(t => t.status === 'pendiente' || t.status === 'en proceso')
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });

    // Combined recent movements
  const allMovements = [
    ...sales.map(s => ({ 
      id: s.id, 
      type: 'venta', 
      date: s.fechaActualizacion, 
      title: `Venta: ${s.estado}`, 
      desc: properties.find(p => p.id === s.propiedadId)?.address || 'Propiedad' 
    })),
    ...rentals.map(r => ({ 
      id: r.id, 
      type: 'alquiler', 
      date: r.fechaActualizacion, 
      title: `Alquiler: ${r.estado}`, 
      desc: properties.find(p => p.id === r.propiedadId)?.address || 'Propiedad' 
    })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bienvenido, Martin</h1>
          <p className="text-gray-500">Este es el resumen de tu actividad inmobiliaria para hoy.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="md">Descargar Reporte</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Clientes Activos" value={activeClients} icon={Users} trend="+12%" color="blue" />
        <StatCard label="Operaciones en Curso" value={activeOperations} icon={Activity} trend="+4" color="purple" />
        <StatCard label="Visitas para Hoy" value={todayEvents.filter(e => e.type === 'visita').length} icon={Calendar} trend="+2" color="green" />
        <StatCard label="Tareas Pendientes" value={pendingTasks} icon={CheckSquare} trend="-3" color="orange" />
      </div>

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

          <Card title="Tareas pendientes" subtitle="Próximas a vencer">
                      <div className="space-y-3">
                        {pendingTasksList.slice(0, 5).map(task => (
                          <div key={task.id} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:shadow-sm transition-shadow group">
                            <div className={cn(
                              "w-2 h-2 rounded-full shrink-0",
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
            </div>
          </Card>

          <Card title="Últimos movimientos" className="bg-gray-50/50">
            <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-200">
              {allMovements.map(mov => (
                <div key={mov.id} className="relative">
                  <div className={cn(
                    "absolute -left-7 top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm",
                    mov.type === 'venta' ? "bg-blue-600" : "bg-green-500"
                  )} />
                  <p className="text-[10px] text-gray-400 font-black uppercase">{formatDate(mov.date)}</p>
                  <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                    <span className="font-bold text-gray-900">{mov.title}</span> <br />
                    <span className="text-xs text-gray-500">{mov.desc}</span>
                  </p>
                </div>
              ))}
              {allMovements.length === 0 && <p className="text-xs text-gray-400 italic">No hay movimientos recientes.</p>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
