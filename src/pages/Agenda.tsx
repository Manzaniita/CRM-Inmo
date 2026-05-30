import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  MapPin,
  User,
  X,
  Clock,
  Home,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trash2,
  Search,
  Filter,
  ArrowUpDown,
  AlertTriangle
} from 'lucide-react';
import { useParams, useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { CalendarEvent, EventType, EventStatus } from '../types';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { Card } from '../components/Card';
import SearchableSelect from '../components/SearchableSelect';
import { cn, formatDate, normalizeSearchText } from '../lib/utils';
import { generateId } from '../lib/id';

export default function Agenda() {
  const { events, clients, properties, addEvent, updateEvent, completeEvent, cancelEvent, deleteEvent, showToast } = useAppContext();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<'list' | 'week'>('list');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-asc' | 'date-desc' | 'status' | 'type'>('date-asc');

  // Today dynamic
  const today = new Date().toISOString().split('T')[0];

  // Mini-calendar state
  const [calendarDate, setCalendarDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();
  const monthLabel = calendarDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  // Day of week of the 1st (0=Sun..6=Sat), convert to Mon-first offset
  const firstDow = new Date(calYear, calMonth, 1).getDay();
  const startOffset = (firstDow === 0 ? 6 : firstDow - 1);

  const goToPrevMonth = () => setCalendarDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goToNextMonth = () => setCalendarDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const resetToToday = () => {
    const d = new Date();
    d.setDate(1);
    setCalendarDate(new Date(d.getFullYear(), d.getMonth(), 1));
    setSelectedDay(null);
  };

  const eventDaysInMonth = new Set(
    events
      .filter(e => {
        const d = new Date(e.date + 'T00:00:00');
        return d.getFullYear() === calYear && d.getMonth() === calMonth;
      })
      .map(e => e.date)
  );

  const [formData, setFormData] = useState<Partial<CalendarEvent>>({
    title: '',
    description: '',
    date: today,
    time: '10:00',
    type: 'visita',
    status: 'pendiente',
    clientId: '',
    propertyId: '',
    notes: ''
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

  // Handle query param eventId for deep linking
  React.useEffect(() => {
    const eventId = searchParams.get('eventId');
    if (eventId) {
      const event = events.find(e => e.id === eventId);
      if (event) {
        setSelectedDay(event.date);
        setCalendarDate(new Date(Number(event.date.split('-')[0]), Number(event.date.split('-')[1]) - 1, 1));
        // Scroll to event after render
        setTimeout(() => {
          const el = document.getElementById(`event-row-${eventId}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, events]);

  const now = new Date();
  const todayStr = today;

  const isEventOverdue = (event: CalendarEvent): boolean => {
    if (event.status !== 'pendiente') return false;
    const eventDateTime = new Date(`${event.date}T${event.time}`);
    return eventDateTime < now;
  };

  const filteredEvents = events.filter(e => {
    const matchesSearch = normalizeSearchText(e.title).includes(normalizeSearchText(searchTerm));
    const matchesType = filterType === 'all' || e.type === filterType;
    const matchesDay = !selectedDay || e.date === selectedDay;
    return matchesSearch && matchesType && matchesDay;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'date-desc':
        return `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`);
      case 'status':
        return a.status.localeCompare(b.status) || `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);
      case 'type':
        return a.type.localeCompare(b.type) || `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);
      case 'date-asc':
      default:
        return `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);
    }
  });

  const handleOpenForm = (event?: CalendarEvent) => {
    if (event) {
      setEditingEvent(event);
      setFormData(event);
    } else {
      setEditingEvent(null);
      setFormData({
        title: '',
        description: '',
        date: today,
        time: '10:00',
        type: 'visita',
        status: 'pendiente',
        clientId: '',
        propertyId: '',
        notes: ''
      });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.time) {
      showToast('Campos obligatorios faltantes', 'error');
      return;
    }

    if (editingEvent) {
      const updatedEvent = { ...editingEvent, ...formData } as CalendarEvent;
      // Reschedule logic: if original was pending and overdue, and new date/time is future -> reprogramado
      const originalDateTime = new Date(`${editingEvent.date}T${editingEvent.time}`);
      const newDateTime = new Date(`${updatedEvent.date}T${updatedEvent.time}`);
      const now = new Date();
      if (editingEvent.status === 'pendiente' && originalDateTime < now && newDateTime > now) {
        updatedEvent.status = 'reprogramado';
      }
      updateEvent(updatedEvent);
    } else {
      const newEvent: CalendarEvent = {
        ...(formData as CalendarEvent),
        id: generateId('e'),
        createdAt: new Date().toISOString()
      };
      addEvent(newEvent);
    }
    setIsFormOpen(false);
  };

  const getEventStatusVariant = (status: string): any => {
    switch (status) {
      case 'pendiente': return 'orange';
      case 'realizado': return 'green';
      case 'cancelado': return 'red';
      case 'reprogramado': return 'blue';
      default: return 'gray';
    }
  };

  const clientOptions = clients.map(c => ({
    value: c.id,
    label: c.name,
    subtitle: c.type || c.phone || undefined
  }));

  const propertyOptions = properties.map(p => ({
    value: p.id,
    label: p.title,
    subtitle: [p.address, p.zone].filter(Boolean).join(', ') || `Código: ${p.code}`
  }));

  const getEventTypeVariant = (type: string): any => {
    switch (type) {
      case 'visita': return 'green';
      case 'firma': return 'red';
      case 'tasación': return 'orange';
      case 'llamada': return 'blue';
      case 'reunión': return 'purple';
      default: return 'gray';
    }
  };

  const renderEventForm = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsFormOpen(false)}></div>
      <div className="bg-white rounded-2xl w-full max-w-lg relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-xl text-gray-900">{editingEvent ? 'Editar Evento' : 'Nuevo Evento'}</h2>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Tipo *</label>
              <select
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as EventType })}
              >
                <option value="visita">Visita</option>
                <option value="llamada">Llamada</option>
                <option value="reunión">Reunión</option>
                <option value="firma">Firma</option>
                <option value="vencimiento">Vencimiento</option>
                <option value="seguimiento">Seguimiento</option>
                <option value="tasación">Tasación</option>
                <option value="entrega_de_llaves">Entrega de llaves</option>
                <option value="recordatorio">Recordatorio</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Estado</label>
              <select
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as EventStatus })}
              >
                <option value="pendiente">Pendiente</option>
                <option value="realizado">Realizado</option>
                <option value="cancelado">Cancelado</option>
                <option value="reprogramado">Reprogramado</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Fecha *</label>
              <input
                required
                type="date"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Hora *</label>
              <input
                required
                type="time"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                value={formData.time}
                onChange={e => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Cliente (Opcional)</label>
              <SearchableSelect
                placeholder="Seleccionar cliente..."
                value={formData.clientId || ''}
                onChange={value => setFormData({ ...formData, clientId: value })}
                options={clientOptions}
                emptyLabel="Ninguno"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Propiedad (Opcional)</label>
              <SearchableSelect
                placeholder="Seleccionar propiedad..."
                value={formData.propertyId || ''}
                onChange={value => setFormData({ ...formData, propertyId: value })}
                options={propertyOptions}
                emptyLabel="Ninguna"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Notas</label>
            <textarea
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="primary">{editingEvent ? 'Guardar Cambios' : 'Crear Evento'}</Button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
          <p className="text-gray-500">Administra tus visitas, reuniones y recordatorios.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white rounded-lg p-1 border border-gray-200 mr-2">
            <button
              onClick={() => setView('list')}
              className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-all", view === 'list' ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:bg-gray-50")}
            >
              Listado
            </button>
            <button
              onClick={() => setView('week')}
              className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-all", view === 'week' ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:bg-gray-50")}
            >
              Semana
            </button>
          </div>
          <Button variant="primary" onClick={() => handleOpenForm()}>
            <Plus size={18} className="mr-2" /> Nuevo Evento
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <button onClick={goToPrevMonth} className="p-1 hover:bg-gray-200 rounded-lg text-gray-500"><ChevronLeft size={16} /></button>
              <span className="font-bold text-sm text-gray-900 capitalize">{monthLabel}</span>
              <button onClick={goToNextMonth} className="p-1 hover:bg-gray-200 rounded-lg text-gray-500"><ChevronRight size={16} /></button>
            </div>
            <div className="px-3 pt-2 pb-1">
              <button
                onClick={resetToToday}
                className="w-full text-xs font-bold py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors"
              >
                Hoy
              </button>
            </div>
            <div className="p-3 grid grid-cols-7 gap-1 text-center">
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                <span key={`${d}-${i}`} className="text-[10px] font-black text-gray-400 uppercase">{d}</span>
              ))}
              {Array.from({ length: startOffset }).map((_, i) => (
                <span key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isToday = dateStr === today;
                const isSelected = dateStr === selectedDay;
                const hasEvents = eventDaysInMonth.has(dateStr);
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDay(prev => prev === dateStr ? null : dateStr)}
                    className={cn(
                      'h-8 flex flex-col items-center justify-center text-xs rounded-lg transition-all font-semibold relative',
                      isSelected ? 'bg-blue-600 text-white shadow-sm' :
                      isToday ? 'bg-blue-100 text-blue-700 font-black' :
                      'hover:bg-gray-100 text-gray-700'
                    )}
                  >
                    {day}
                    {hasEvents && !isSelected && (
                      <span className={cn('absolute bottom-1 w-1 h-1 rounded-full', isToday ? 'bg-blue-600' : 'bg-blue-400')} />
                    )}
                  </button>
                );
              })}
            </div>
            {selectedDay && (
              <div className="px-3 pb-3">
                <button
                  onClick={() => setSelectedDay(null)}
                  className="w-full text-[10px] font-bold py-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Limpiar filtro de día
                </button>
              </div>
            )}
          </Card>

          <Card title="Filtrar por Tipo">
            <div className="space-y-2">
              {['all', 'visita', 'llamada', 'reunión', 'firma', 'seguimiento', 'tasación'].map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={cn(
                    "w-full flex items-center justify-between p-2 rounded-lg text-sm font-medium transition-colors",
                    filterType === type ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50 text-gray-700"
                  )}
                >
                  <span className="capitalize">{type === 'all' ? 'Todos' : type}</span>
                  {filterType === type && <CheckCircle2 size={14} />}
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {view === 'list' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex-wrap gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar en la agenda..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 items-center flex-wrap">
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-100">
                    <ArrowUpDown size={14} className="text-gray-400" />
                    <select
                      className="text-xs font-bold bg-transparent outline-none text-gray-700"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                    >
                      <option value="date-asc">Fecha (próxima primero)</option>
                      <option value="date-desc">Fecha (lejana primero)</option>
                      <option value="status">Por estado</option>
                      <option value="type">Por tipo</option>
                    </select>
                  </div>
                  <Badge variant="blue" size="sm">Hoy: {filteredEvents.filter(e => e.date === todayStr).length}</Badge>
                </div>
              </div>

              <div className="space-y-3">
                {filteredEvents.map(event => (
                  <div key={event.id} id={`event-row-${event.id}`} className={cn("bg-white p-4 rounded-xl border shadow-sm flex items-start gap-4 hover:border-blue-200 transition-colors group relative", isEventOverdue(event) ? "border-red-300 bg-red-50/40" : "border-gray-200")}>
                    <div className={cn("flex flex-col items-center justify-center w-14 h-14 text-gray-500 rounded-xl border shrink-0", isEventOverdue(event) ? "bg-red-100 text-red-600 border-red-200" : "bg-gray-50 border-gray-100 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100")}>
                      <span className="text-[10px] font-black uppercase">{event.time}</span>
                      <span className="text-xs font-bold leading-none mt-1">{event.date === todayStr ? 'HOY' : event.date.split('-').slice(1).reverse().join('/')}</span>
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleOpenForm(event)}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-900 truncate">{event.title}</h4>
                          {isEventOverdue(event) && <AlertTriangle size={14} className="text-red-500 shrink-0" />}
                        </div>
                        <Badge variant={isEventOverdue(event) ? 'red' : getEventStatusVariant(event.status)}>{isEventOverdue(event) ? 'VENCIDO' : event.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-500 mb-3 line-clamp-1">{event.description || event.notes || 'Sin descripción'}</p>
                      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-400">
                        {event.clientId && (
                          <Link to={`/clientes/${event.clientId}`} className="flex items-center gap-1.5 hover:text-blue-600 transition-colors" onClick={e => e.stopPropagation()}>
                            <User size={14} className="text-gray-400" />
                            <span className="text-gray-700">{clients.find(c => c.id === event.clientId)?.name}</span>
                          </Link>
                        )}
                        {event.propertyId && (
                          <Link to={`/propiedades/${event.propertyId}`} className="flex items-center gap-1.5 hover:text-purple-600 transition-colors" onClick={e => e.stopPropagation()}>
                            <Home size={14} className="text-gray-400" />
                            <span className="text-gray-700 truncate">{properties.find(p => p.id === event.propertyId)?.title}</span>
                          </Link>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge variant={getEventTypeVariant(event.type)} size="sm">{event.type}</Badge>
                      {isEventOverdue(event) ? (
                        <div className="flex items-center gap-1 mt-auto">
                          <button onClick={(e) => { e.stopPropagation(); handleOpenForm(event); }} title="Reprogramar" className="p-1.5 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-100"><RotateCcw size={16} /></button>
                          <button onClick={(e) => { e.stopPropagation(); cancelEvent(event.id); }} title="Cancelar" className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"><XCircle size={16} /></button>
                        </div>
                      ) : (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mt-auto">
                          <button onClick={(e) => { e.stopPropagation(); completeEvent(event.id); }} title="Realizado" className="p-1.5 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50"><CheckCircle2 size={16} /></button>
                          <button onClick={(e) => { e.stopPropagation(); cancelEvent(event.id); }} title="Cancelar" className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"><XCircle size={16} /></button>
                          <button onClick={(e) => { e.stopPropagation(); if (window.confirm('¿Eliminar este evento?')) deleteEvent(event.id); }} title="Eliminar" className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100"><Trash2 size={16} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {filteredEvents.length === 0 && (
                  <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                    <CalendarIcon size={48} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-gray-500">No hay eventos que coincidan con los filtros.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Card className="p-0 overflow-hidden min-h-[600px] flex items-center justify-center bg-gray-50/50">
              <div className="text-center p-12">
                <CalendarIcon size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-500 font-medium italic">Vista de calendario semanal simulada.</p>
                <p className="text-xs text-gray-400 mt-2">Pronto integraremos una grilla real de eventos.</p>
                <Button variant="outline" size="sm" className="mt-6" onClick={() => setView('list')}>Volver a lista</Button>
              </div>
            </Card>
          )}
        </div>
      </div>
      {isFormOpen && renderEventForm()}
    </div>
  );
}
