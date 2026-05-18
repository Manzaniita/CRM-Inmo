import React, { useState, useEffect } from 'react';
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
  MessageSquare
} from 'lucide-react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Task, TaskPriority, TaskStatus } from '../types';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { cn, formatDate } from '../lib/utils';

export default function Tasks() {
  const { tasks, clients, properties, addTask, updateTask, completeTask, deleteTask } = useAppContext();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    description: '',
    priority: 'media',
    status: 'pendiente',
    dueDate: new Date().toISOString().split('T')[0],
    notes: '',
    clientId: '',
    propertyId: ''
  });

  React.useEffect(() => {
    if (location.state?.prefillClientId || location.state?.prefillPropertyId) {
      handleOpenForm();
      setFormData(prev => ({
        ...prev,
        clientId: location.state.prefillClientId || '',
        propertyId: location.state.prefillPropertyId || ''
      }));
      // Clear state to avoid reopening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  const handleOpenForm = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setFormData(task);
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        priority: 'media',
        status: 'pendiente',
        dueDate: new Date().toISOString().split('T')[0],
        notes: '',
        clientId: '',
        propertyId: ''
      });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return alert('El título es obligatorio');

    if (editingTask) {
      updateTask({ ...editingTask, ...formData } as Task);
    } else {
      const newTask: Task = {
        ...(formData as Task),
        id: `t${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      addTask(newTask);
    }
    setIsFormOpen(false);
  };

  const getPriorityVariant = (priority: string): any => {
    switch (priority) {
      case 'urgente': return 'red';
      case 'alta': return 'orange';
      case 'media': return 'blue';
      case 'baja': return 'gray';
      default: return 'gray';
    }
  };

  const getStatusVariant = (status: string): any => {
    switch (status) {
      case 'pendiente': return 'gray';
      case 'en proceso': return 'blue';
      case 'completada': return 'green';
      case 'vencida': return 'red';
      default: return 'gray';
    }
  };

  const renderTaskForm = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsFormOpen(false)}></div>
      <div className="bg-white rounded-2xl w-full max-w-lg relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-xl text-gray-900">{editingTask ? 'Editar Tarea' : 'Nueva Tarea'}</h2>
          <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Título *</label>
            <input
              required
              type="text"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Descripción</label>
            <textarea
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Prioridad *</label>
              <select
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Estado *</label>
              <select
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as TaskStatus })}
              >
                <option value="pendiente">Pendiente</option>
                <option value="en proceso">En proceso</option>
                <option value="completada">Completada</option>
                <option value="vencida">Vencida</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Fecha Límite</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
              value={formData.dueDate}
              onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Cliente (Opcional)</label>
              <select
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                value={formData.clientId}
                onChange={e => setFormData({ ...formData, clientId: e.target.value })}
              >
                <option value="">Ninguno</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Propiedad (Opcional)</label>
              <select
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                value={formData.propertyId}
                onChange={e => setFormData({ ...formData, propertyId: e.target.value })}
              >
                <option value="">Ninguna</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="primary">{editingTask ? 'Guardar Cambios' : 'Crear Tarea'}</Button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderKanban = () => {
    const statuses: TaskStatus[] = ['pendiente', 'en proceso', 'completada', 'vencida'];
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
        {statuses.map(status => (
          <div key={status} className="flex-1 min-w-[300px] flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">{status}</h3>
              <Badge variant={getStatusVariant(status)} size="sm">{filteredTasks.filter(t => t.status === status).length}</Badge>
            </div>
            <div className="flex-1 space-y-3 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
              {filteredTasks.filter(t => t.status === status).map(task => (
                <div
                  key={task.id}
                  className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 transition-all group cursor-pointer"
                  onClick={() => handleOpenForm(task)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant={getPriorityVariant(task.priority)} size="sm">{task.priority}</Badge>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm mb-1">{task.title}</h4>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{task.description}</p>
                  <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(task.dueDate)}</span>
                    <div className="flex gap-1">
                      {task.clientId && <User size={12} className="text-blue-500" />}
                      {task.propertyId && <Home size={12} className="text-purple-500" />}
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
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="divide-y divide-gray-100">
        {filteredTasks.map((task) => (
          <div key={task.id} className="p-4 hover:bg-gray-50/50 transition-colors flex items-center gap-4 group">
            <button
              onClick={() => completeTask(task.id)}
              className={cn(
                "transition-colors",
                task.status === 'completada' ? "text-green-500" : "text-gray-300 hover:text-green-600"
              )}
            >
              <CheckCircle2 size={24} />
            </button>
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleOpenForm(task)}>
              <div className="flex items-center gap-2 mb-1">
                <h4 className={cn("font-semibold text-gray-900 truncate", task.status === 'completada' && "line-through text-gray-400")}>
                  {task.title}
                </h4>
                <Badge variant={getPriorityVariant(task.priority)} size="sm">{task.priority}</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-400">
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span className={cn(task.status === 'vencida' ? "text-red-500 font-bold" : "text-gray-500")}>
                    {formatDate(task.dueDate)}
                  </span>
                </div>
                {task.clientId && (
                  <Link to={`/clientes/${task.clientId}`} className="flex items-center gap-1 hover:text-blue-600 transition-colors" onClick={e => e.stopPropagation()}>
                    <User size={14} className="text-gray-400" />
                    <span>{clients.find(c => c.id === task.clientId)?.name}</span>
                  </Link>
                )}
                {task.propertyId && (
                  <Link to={`/propiedades/${task.propertyId}`} className="flex items-center gap-1 hover:text-purple-600 transition-colors" onClick={e => e.stopPropagation()}>
                    <Home size={14} className="text-gray-400" />
                    <span>{properties.find(p => p.id === task.propertyId)?.title}</span>
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusVariant(task.status)} size="sm">{task.status}</Badge>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <button onClick={() => deleteTask(task.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg transition-colors"><Trash2 size={18} /></button>
                <button onClick={() => handleOpenForm(task)} className="p-2 text-gray-400 hover:text-gray-900 rounded-lg transition-colors"><MoreVertical size={18} /></button>
              </div>
            </div>
          </div>
        ))}
        {filteredTasks.length === 0 && (
          <div className="py-20 text-center">
            <CheckSquare size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium">No hay tareas que coincidan con tu búsqueda.</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tareas</h1>
          <p className="text-gray-500">Organiza tu trabajo diario y seguimiento de clientes.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white rounded-lg p-1 border border-gray-200 mr-2">
            <button
              onClick={() => setViewMode('list')}
              className={cn("p-1.5 rounded-md transition-all", viewMode === 'list' ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:bg-gray-50")}
            >
              <ListIcon size={18} />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={cn("p-1.5 rounded-md transition-all", viewMode === 'kanban' ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:bg-gray-50")}
            >
              <LayoutGrid size={18} />
            </button>
          </div>
          <Button variant="primary" onClick={() => handleOpenForm()}>
            <Plus size={20} className="mr-2" /> Nueva Tarea
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Pendientes</p>
          <p className="text-2xl font-bold text-gray-900">{tasks.filter(t => t.status === 'pendiente').length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">En Proceso</p>
          <p className="text-2xl font-bold text-blue-600">{tasks.filter(t => t.status === 'en proceso').length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Urgentes</p>
          <p className="text-2xl font-bold text-red-600">{tasks.filter(t => t.priority === 'urgente' && t.status !== 'completada').length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Vencidas</p>
          <p className="text-2xl font-bold text-orange-600">{tasks.filter(t => t.status === 'vencida').length}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative flex-1 max-w-md w-full">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar tareas..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white min-w-[140px]"
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
          >
            <option value="all">Todas las prioridades</option>
            <option value="urgente">Urgente</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
          <Button variant="outline" size="sm" className="h-10"><Filter size={16} className="mr-2" /> Más filtros</Button>
        </div>
      </div>

      {viewMode === 'list' ? renderList() : renderKanban()}

      {isFormOpen && renderTaskForm()}
    </div>
  );
}
