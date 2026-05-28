import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  ArrowLeft,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Calendar,
  MessageCircle,
  Globe,
  UserPlus,
  X,
  FileText,
  Clock,
  ListTodo
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Client, ClientType, ClientStatus, ClientOrigin, EntityNote, Document, Sale, Rental, Task, CalendarEvent, TaskStatus, TaskPriority, EventType, EventStatus, Property, ReferredColleague } from '../types';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { Card } from '../components/Card';
import { cn, formatCurrency, formatDate, normalizeSearchText } from '../lib/utils';
import { generateId } from '../lib/id';
import { validateClient, validateTask } from '../lib/validators';
import RelationsPanel from '../components/RelationsPanel';
import { getClientRelations } from '../lib/relations';
import EntityNotesPanel from '../components/EntityNotesPanel';
import DocumentModal from '../components/DocumentModal';
import SaleModal from '../components/SaleModal';
import RentalModal from '../components/RentalModal';
import SearchableSelect from '../components/SearchableSelect';

export default function Clients() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { clients, properties, events, tasks, sales, rentals, documents, referredColleagues, addClient, updateClient, addTask, updateTask, deleteTask, addEvent, updateEvent, deleteEvent, addSale, updateSale, deleteSale, addRental, updateRental, deleteRental, addDocument, updateDocument, deleteDocument, showToast, addReferredColleague, updateReferredColleague, addActivityLog } = useAppContext();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docModalMode, setDocModalMode] = useState<'create' | 'edit' | 'view'>('view');
  const [selectedDocForModal, setSelectedDocForModal] = useState<Document | undefined>(undefined);
  
  // Operation Modals State
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [saleModalMode, setSaleModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedSaleForModal, setSelectedSaleForModal] = useState<Sale | undefined>(undefined);
  const [isRentalModalOpen, setIsRentalModalOpen] = useState(false);
  const [rentalModalMode, setRentalModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedRentalForModal, setSelectedRentalForModal] = useState<Rental | undefined>(undefined);

  // Task Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    priority: 'media' as TaskPriority,
    status: 'pendiente' as TaskStatus,
    dueDate: new Date().toISOString().split('T')[0],
    propertyId: '',
    notes: ''
  });

  // Event Modal State
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventFormData, setEventFormData] = useState({
    title: '',
    description: '',
    type: 'seguimiento' as EventType,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    propertyId: '',
    status: 'pendiente' as EventStatus,
    notes: ''
  });

  // Colleague referral mini-form state
  const [showNewColleagueForm, setShowNewColleagueForm] = useState(false);
  const [newColleagueName, setNewColleagueName] = useState('');
  const [newColleagueOffice, setNewColleagueOffice] = useState('');
  const [selectedColleagueId, setSelectedColleagueId] = useState('');

  // Filter State
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterOrigin, setFilterOrigin] = useState<string>('');
  const [filterZone, setFilterZone] = useState<string>('');
  const [filterHasOperation, setFilterHasOperation] = useState<boolean | null>(null);
  const [filterHasPendingTasks, setFilterHasPendingTasks] = useState<boolean | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortName, setSortName] = useState<'asc' | 'desc'>('asc');

    // Form State
  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    phone: '',
    email: '',
    type: 'comprador',
    types: ['comprador'],
    status: 'nuevo',
    origin: 'WhatsApp',
    lastContact: new Date().toISOString().split('T')[0],
    notes: '',
    profession: '',
    referredBy: '',
    referredByColleagueId: '',
    dashboardPinned: false,
    dashboardArchived: false,
  });

  const selectedClient = clients.find(c => c.id === id);

  const lowerSearch = normalizeSearchText(searchTerm);

  // Compute client IDs with operations (sales or rentals)
  const clientIdsWithOperations = new Set([
    ...sales.map(s => s.clientCompradorId),
    ...rentals.map(r => r.inquilinoId)
  ]);

  // Compute client IDs with pending tasks
  const clientIdsWithPendingTasks = new Set(
    tasks
      .filter(t => t.clientId && t.status !== 'completada' && t.status !== 'vencida')
      .map(t => t.clientId)
  );

  const filteredClients = clients.filter(c => {
    // Text search
    const matchesSearch = 
      normalizeSearchText(c.name).includes(lowerSearch) || 
      c.phone.includes(searchTerm) || 
      normalizeSearchText(c.email).includes(lowerSearch);

    if (!matchesSearch) return false;

        // Type filter
    if (filterType) {
      const clientTypes = c.types && c.types.length > 0 ? c.types : [c.type];
      if (!clientTypes.includes(filterType as ClientType)) return false;
    }

    // Status filter
    if (filterStatus && c.status !== filterStatus) return false;

    // Origin filter
    if (filterOrigin && c.origin !== filterOrigin) return false;

    // Zone filter
    if (filterZone && !normalizeSearchText(c.interestZone || '').includes(normalizeSearchText(filterZone))) return false;

    // Has operation filter
    if (filterHasOperation === true && !clientIdsWithOperations.has(c.id)) return false;
    if (filterHasOperation === false && clientIdsWithOperations.has(c.id)) return false;

    // Has pending tasks filter
    if (filterHasPendingTasks === true && !clientIdsWithPendingTasks.has(c.id)) return false;
    if (filterHasPendingTasks === false && clientIdsWithPendingTasks.has(c.id)) return false;

    return true;
  }).sort((a, b) => {
    const cmp = a.name.localeCompare(b.name);
    return sortName === 'asc' ? cmp : -cmp;
  });

    const handleOpenForm = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData(client);
      setSelectedColleagueId(client.referredByColleagueId || '');
      setShowNewColleagueForm(false);
      setNewColleagueName('');
      setNewColleagueOffice('');
    } else {
      setEditingClient(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        type: 'comprador',
        types: ['comprador'],
        status: 'nuevo',
        origin: 'WhatsApp',
        lastContact: new Date().toISOString().split('T')[0],
        notes: '',
        profession: '',
        referredBy: '',
        referredByColleagueId: '',
        dashboardPinned: false,
        dashboardArchived: false,
      });
      setSelectedColleagueId('');
      setShowNewColleagueForm(false);
      setNewColleagueName('');
      setNewColleagueOffice('');
    }
    setIsFormModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateClient(formData);
    if (!result.valid) {
      showToast(result.message || 'Error de validación', 'error');
      return;
    }

    const clientData: Client = editingClient
      ? { ...(formData as Client) }
      : { ...(formData as Client), id: generateId('c'), createdAt: new Date().toISOString().split('T')[0] };

    // Handle colleague referral logic
    let colleagueToUpdate: { id: string; clientId: string } | null = null;
    let newColleagueId: string | null = null;

    if (clientData.origin === 'Referido') {
      if (showNewColleagueForm && newColleagueName.trim()) {
        const col: ReferredColleague = {
          id: generateId('col'),
          nombreApellido: newColleagueName.trim(),
          oficina: newColleagueOffice.trim(),
          respondio: false,
          yaRefirio: true,
          referredClientIds: [clientData.id],
          propertyIds: []
        };
        addReferredColleague(col);
        newColleagueId = col.id;
        clientData.referredByColleagueId = col.id;
        addActivityLog({
          type: 'colleague',
          action: 'created',
          title: `Colega creado desde cliente: ${col.nombreApellido}`,
          entityId: col.id
        });
        addActivityLog({
          type: 'client',
          action: 'updated',
          title: `Cliente vinculado con colega: ${clientData.name}`,
          description: `Referido por ${col.nombreApellido}`,
          entityId: clientData.id
        });
      } else if (selectedColleagueId) {
        clientData.referredByColleagueId = selectedColleagueId;
        colleagueToUpdate = { id: selectedColleagueId, clientId: clientData.id };
        addActivityLog({
          type: 'client',
          action: 'updated',
          title: `Cliente vinculado con colega: ${clientData.name}`,
          entityId: clientData.id
        });
      }
    } else {
      clientData.referredByColleagueId = '';
    }

    if (editingClient) {
      updateClient(clientData);
    } else {
      addClient(clientData);
    }

    if (colleagueToUpdate) {
      const col = referredColleagues.find(c => c.id === colleagueToUpdate!.id);
      if (col) {
        const updatedIds = [...(col.referredClientIds || [])];
        if (!updatedIds.includes(colleagueToUpdate.clientId)) {
          updatedIds.push(colleagueToUpdate.clientId);
        }
        updateReferredColleague({ ...col, referredClientIds: updatedIds });
      }
    }

    setIsFormModalOpen(false);
    setShowNewColleagueForm(false);
    setNewColleagueName('');
    setNewColleagueOffice('');
    setSelectedColleagueId('');
  };

  const getTypeBadgeVariant = (type: ClientType): any => {
    switch (type) {
      case 'comprador': return 'green';
      case 'vendedor': return 'blue';
      case 'inquilino': return 'orange';
      case 'propietario': return 'purple';
      case 'inversor': return 'yellow';
      case 'interesado': return 'gray';
      default: return 'gray';
    }
  };

  const getStatusBadgeVariant = (status: ClientStatus): any => {
    switch (status) {
      case 'nuevo': return 'green';
      case 'contactado': return 'blue';
      case 'interesado': return 'orange';
      case 'en seguimiento': return 'purple';
      case 'negociación': return 'yellow';
      case 'cerrado': return 'gray';
      case 'perdido': return 'red';
      default: return 'gray';
    }
  };

  function renderTaskModal() {
    const propertyOptions = properties.map(p => ({
      value: p.id,
      label: p.title,
      subtitle: `${p.address} - ${p.zone}`
    }));

    const handleSaveTask = () => {
      const validation = validateTask({ title: taskFormData.title });
      if (!validation.valid) {
        showToast(validation.message || 'Error de validación', 'error');
        return;
      }
      const newTask: Task = {
        id: generateId('t'),
        title: taskFormData.title,
        description: taskFormData.description,
        dueDate: taskFormData.dueDate,
        priority: taskFormData.priority,
        status: taskFormData.status,
        clientId: id,
        propertyId: taskFormData.propertyId || undefined,
        notes: taskFormData.notes,
        createdAt: new Date().toISOString()
      };
      addTask(newTask);
      setIsTaskModalOpen(false);
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsTaskModalOpen(false)}></div>
        <div className="bg-white rounded-2xl w-full max-w-lg relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
            <h2 className="font-bold text-xl text-gray-900">Nueva Tarea para {selectedClient?.name}</h2>
            <button onClick={() => setIsTaskModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
          <div className="p-6 overflow-y-auto max-h-[70vh]">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Título *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={taskFormData.title}
                  onChange={e => setTaskFormData({...taskFormData, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Descripción</label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={taskFormData.description}
                  onChange={e => setTaskFormData({...taskFormData, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Prioridad</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={taskFormData.priority}
                    onChange={e => setTaskFormData({...taskFormData, priority: e.target.value as TaskPriority})}
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Estado</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={taskFormData.status}
                    onChange={e => setTaskFormData({...taskFormData, status: e.target.value as TaskStatus})}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="en proceso">En Proceso</option>
                    <option value="completada">Completada</option>
                    <option value="vencida">Vencida</option>
                    <option value="reprogramado">Reprogramado</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Fecha Límite</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={taskFormData.dueDate}
                  onChange={e => setTaskFormData({...taskFormData, dueDate: e.target.value})}
                />
              </div>
              <div>
                <SearchableSelect
                  label="Propiedad relacionada"
                  value={taskFormData.propertyId}
                  onChange={val => setTaskFormData({...taskFormData, propertyId: val})}
                  options={propertyOptions}
                  placeholder="Seleccionar propiedad..."
                  allowEmpty
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Notas</label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={taskFormData.notes}
                  onChange={e => setTaskFormData({...taskFormData, notes: e.target.value})}
                />
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsTaskModalOpen(false)}>Cancelar</Button>
              <Button variant="primary" onClick={handleSaveTask}>Crear Tarea</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderEventModal() {
    const propertyOptions = properties.map(p => ({
      value: p.id,
      label: p.title,
      subtitle: `${p.address} - ${p.zone}`
    }));

    const handleSaveEvent = () => {
      if (!eventFormData.title) {
        showToast('El título es obligatorio', 'error');
        return;
      }
      const newEvent: CalendarEvent = {
        id: generateId('e'),
        title: eventFormData.title,
        description: eventFormData.description,
        date: eventFormData.date,
        time: eventFormData.time,
        type: eventFormData.type,
        status: eventFormData.status,
        clientId: id,
        propertyId: eventFormData.propertyId || undefined,
        notes: eventFormData.notes,
        createdAt: new Date().toISOString()
      };
      addEvent(newEvent);
      setIsEventModalOpen(false);
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsEventModalOpen(false)}></div>
        <div className="bg-white rounded-2xl w-full max-w-lg relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
            <h2 className="font-bold text-xl text-gray-900">Nueva Cita con {selectedClient?.name}</h2>
            <button onClick={() => setIsEventModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
          <div className="p-6 overflow-y-auto max-h-[70vh]">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Título *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={eventFormData.title}
                  onChange={e => setEventFormData({...eventFormData, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Descripción</label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={eventFormData.description}
                  onChange={e => setEventFormData({...eventFormData, description: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Tipo</label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={eventFormData.type}
                  onChange={e => setEventFormData({...eventFormData, type: e.target.value as EventType})}
                >
                  <option value="seguimiento">Seguimiento</option>
                  <option value="visita">Visita</option>
                  <option value="llamada">Llamada</option>
                  <option value="reunión">Reunión</option>
                  <option value="firma">Firma</option>
                  <option value="vencimiento">Vencimiento</option>
                  <option value="tasación">Tasación</option>
                  <option value="entrega_de_llaves">Entrega de Llaves</option>
                  <option value="recordatorio">Recordatorio</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={eventFormData.date}
                    onChange={e => setEventFormData({...eventFormData, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Hora</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={eventFormData.time}
                    onChange={e => setEventFormData({...eventFormData, time: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Estado</label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={eventFormData.status}
                  onChange={e => setEventFormData({...eventFormData, status: e.target.value as EventStatus})}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="realizado">Realizado</option>
                  <option value="cancelado">Cancelado</option>
                  <option value="reprogramado">Reprogramado</option>
                </select>
              </div>
              <div>
                <SearchableSelect
                  label="Propiedad relacionada"
                  value={eventFormData.propertyId}
                  onChange={val => setEventFormData({...eventFormData, propertyId: val})}
                  options={propertyOptions}
                  placeholder="Seleccionar propiedad..."
                  allowEmpty
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Notas</label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={eventFormData.notes}
                  onChange={e => setEventFormData({...eventFormData, notes: e.target.value})}
                />
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsEventModalOpen(false)}>Cancelar</Button>
              <Button variant="primary" onClick={handleSaveEvent}>Programar Cita</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedClient) {
    const clientSales = sales.filter(s => s.clientCompradorId === id);
    const clientRentals = rentals.filter(r => r.inquilinoId === id);

    return (
      <div className="animate-in slide-in-from-right duration-300">
        <button 
          onClick={() => navigate('/clientes')}
          className="flex items-center text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" /> Volver al listado
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center text-blue-700 text-xl font-bold">
                    {selectedClient.name.charAt(0)}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{selectedClient.name}</h1>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {(selectedClient.types && selectedClient.types.length > 0 ? selectedClient.types : [selectedClient.type]).map(t => (
                                              <span key={t}>
                                                <Badge variant={getTypeBadgeVariant(t)}>{t}</Badge>
                                              </span>
                                          ))}
                      <Badge variant={getStatusBadgeVariant(selectedClient.status)}>{selectedClient.status}</Badge>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleOpenForm(selectedClient)}>
                  <Plus size={16} className="mr-1" /> Editar
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 py-6 border-y border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Phone size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Teléfono</p>
                    <p className="text-sm font-bold text-gray-900">{selectedClient.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Mail size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Email</p>
                    <p className="text-sm font-bold text-gray-900">{selectedClient.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Globe size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Origen</p>
                    <p className="text-sm font-bold text-gray-900">{selectedClient.origin}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <DollarSign size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Presupuesto</p>
                    <p className="text-sm font-bold text-gray-900">
                      {selectedClient.budget ? formatCurrency(selectedClient.budget, selectedClient.currency) : 'Sin especificar'}
                    </p>
                  </div>
                </div>
                {selectedClient.interestZone && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <MapPin size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Zona de Interés</p>
                      <p className="text-sm font-bold text-gray-900">{selectedClient.interestZone}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Calendar size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Último Contacto</p>
                    <p className="text-sm font-bold text-gray-900">{formatDate(selectedClient.lastContact)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="font-bold text-gray-900 mb-3">Notas Internas</h3>
                <p className="text-gray-600 leading-relaxed italic border-l-4 border-gray-100 pl-4">
                  "{selectedClient.notes || 'Sin notas adicionales.'}"
                </p>
              </div>

              <div className="mt-8">
                <EntityNotesPanel
                  notes={selectedClient.historyNotes}
                  onAddNote={(content) => {
                    const newNote: EntityNote = {
                      id: generateId('n'),
                      content,
                      createdAt: new Date().toISOString()
                    };
                    updateClient({
                      ...selectedClient,
                      historyNotes: [...(selectedClient.historyNotes || []), newNote]
                    });
                  }}
                  onDeleteNote={(noteId) => {
                    updateClient({
                      ...selectedClient,
                      historyNotes: (selectedClient.historyNotes || []).filter(n => n.id !== noteId)
                    });
                  }}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-lg">Propiedades Asociadas</h3>
              </div>
              {(() => {
                const clientProperties = properties.filter(p => p.ownerId === id);
                if (clientProperties.length === 0) return <p className="text-sm text-gray-400 italic py-2">Sin propiedades asociadas.</p>;
                return (
                  <div className="space-y-3">
                    {clientProperties.map(prop => (
                      <div key={prop.id} onClick={() => navigate(`/propiedades/${prop.id}`)} className="cursor-pointer">
                        <Card className="border-gray-100 hover:shadow-md transition-all">
                          <div className="flex items-center justify-between">
                            <div>
                              <Badge variant={prop.operation === 'venta' ? 'orange' : 'blue'}>{prop.operation}</Badge>
                              <span className="ml-2 text-sm font-bold text-gray-900">{prop.title}</span>
                              <p className="text-sm text-gray-500 mt-0.5">{prop.address}, {prop.zone}</p>
                            </div>
                            <ChevronRight size={16} className="text-gray-300" />
                          </div>
                        </Card>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-lg">Operaciones Relacionadas</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setSaleModalMode('create'); setSelectedSaleForModal(undefined); setIsSaleModalOpen(true); }}>
                    <Plus size={14} className="mr-1" /> Nueva Venta
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setRentalModalMode('create'); setSelectedRentalForModal(undefined); setIsRentalModalOpen(true); }}>
                    <Plus size={14} className="mr-1" /> Nuevo Alquiler
                  </Button>
                </div>
              </div>
              {clientSales.length === 0 && clientRentals.length === 0 ? (
                <p className="text-sm text-gray-400 italic py-4">Sin operaciones relacionadas.</p>
              ) : (
                <>
                  {clientSales.map(sale => (
                    <React.Fragment key={sale.id}>
                      <Card className="border-blue-100 cursor-pointer hover:shadow-md transition-all">
                        <div onClick={() => { setSelectedSaleForModal(sale); setSaleModalMode('view'); setIsSaleModalOpen(true); }}>
                          <div className="flex items-center justify-between">
                            <div>
                              <Badge variant="blue">Venta</Badge>
                              <span className="ml-2 text-sm font-medium text-gray-700">{sale.estado}</span>
                              <p className="text-sm text-gray-500 mt-1">{properties.find(p => p.id === sale.propiedadId)?.title || sale.propiedadId}</p>
                            </div>
                            <ChevronRight size={16} className="text-gray-300" />
                          </div>
                        </div>
                      </Card>
                    </React.Fragment>
                  ))}
                  {clientRentals.map(rental => (
                    <React.Fragment key={rental.id}>
                      <Card className="border-green-100 cursor-pointer hover:shadow-md transition-all">
                        <div onClick={() => { setSelectedRentalForModal(rental); setRentalModalMode('view'); setIsRentalModalOpen(true); }}>
                          <div className="flex items-center justify-between">
                            <div>
                              <Badge variant="green">Alquiler</Badge>
                              <span className="ml-2 text-sm font-medium text-gray-700">{rental.estado}</span>
                              <p className="text-sm text-gray-500 mt-1">{properties.find(p => p.id === rental.propiedadId)?.title || rental.propiedadId}</p>
                            </div>
                            <ChevronRight size={16} className="text-gray-300" />
                          </div>
                        </div>
                      </Card>
                    </React.Fragment>
                  ))}
                </>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <Card title="Documentos Relacionados">
              <div className="space-y-3">
                {documents.filter(d => d.clientId === id).length > 0 ? (
                  documents.filter(d => d.clientId === id).slice(0, 4).map(doc => (
                    <div key={doc.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => { setSelectedDocForModal(doc); setDocModalMode('view'); setIsDocModalOpen(true); }}>
                      <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
                        <FileText size={18} className="text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{doc.name}</p>
                        <Badge size="sm" variant={doc.status === 'revisado' ? 'green' : doc.status === 'cargado' ? 'blue' : doc.status === 'vencido' ? 'red' : 'orange'}>{doc.status}</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-center text-gray-400 py-2 italic">Sin documentos relacionados.</p>
                )}
                {documents.filter(d => d.clientId === id).length > 4 && (
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => { setSelectedDocForModal(undefined); setDocModalMode('create'); setIsDocModalOpen(true); }}>
                    Ver todos ({documents.filter(d => d.clientId === id).length})
                  </Button>
                )}
                <Button variant="outline" size="sm" className="w-full" onClick={() => { setSelectedDocForModal(undefined); setDocModalMode('create'); setIsDocModalOpen(true); }}>
                  <Plus size={14} className="mr-1" /> Subir Documento
                </Button>
              </div>
            </Card>

            <Card title="Acciones Rápidas">
              <div className="space-y-3">
                <Button 
                  variant="primary" 
                  className="w-full"
                  onClick={() => {
                    setEventFormData({
                      title: '',
                      description: '',
                      type: 'seguimiento',
                      date: new Date().toISOString().split('T')[0],
                      time: new Date().toTimeString().slice(0, 5),
                      propertyId: '',
                      status: 'pendiente',
                      notes: ''
                    });
                    setIsEventModalOpen(true);
                  }}
                >
                  <Calendar size={18} className="mr-2" /> Programar Cita
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setTaskFormData({
                      title: '',
                      description: '',
                      priority: 'media',
                      status: 'pendiente',
                      dueDate: new Date().toISOString().split('T')[0],
                      propertyId: '',
                      notes: ''
                    });
                    setIsTaskModalOpen(true);
                  }}
                >
                  <ListTodo size={18} className="mr-2" /> Crear Tarea
                </Button>
              </div>
            </Card>

                        <Card title="Información del Cliente">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Creado</span>
                  <span className="font-medium">{formatDate(selectedClient.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tipo</span>
                  <div className="flex gap-1 flex-wrap">
                    {(selectedClient.types && selectedClient.types.length > 0 ? selectedClient.types : [selectedClient.type]).map(t => (
                                          <span key={t}>
                                            <Badge variant={getTypeBadgeVariant(t)} size="sm">{t}</Badge>
                                          </span>
                                        ))}
                  </div>
                </div>
                {selectedClient.profession && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Profesión</span>
                    <span className="font-medium">{selectedClient.profession}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Origen</span>
                  <span className="font-medium">{selectedClient.origin}</span>
                </div>
                {selectedClient.origin === 'Referido' && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Referido por</span>
                    <span className="font-medium">
                      {selectedClient.referredByColleagueId
                        ? referredColleagues.find(c => c.id === selectedClient.referredByColleagueId)?.nombreApellido || 'Colega desconocido'
                        : selectedClient.referredBy || '—'}
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-4 space-y-2 pt-4 border-t border-gray-100">
                {selectedClient.dashboardPinned ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateClient({...selectedClient, dashboardPinned: false});
                    }}
                  >
                    Quitar del panel principal
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateClient({...selectedClient, dashboardPinned: true});
                    }}
                  >
                    Enviar al panel principal
                  </Button>
                )}
                {!selectedClient.dashboardArchived ? (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateClient({...selectedClient, dashboardArchived: true});
                    }}
                  >
                    Archivar del dashboard
                  </Button>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateClient({...selectedClient, dashboardArchived: false});
                    }}
                  >
                    Desarchivar del dashboard
                  </Button>
                )}
              </div>
            </Card>

            <RelationsPanel groups={getClientRelations(selectedClient.id, { properties, sales, rentals, tasks, events, documents, referredColleagues })} />
          </div>
        </div>
        {isFormModalOpen && renderFormModal()}
        <DocumentModal
          isOpen={isDocModalOpen}
          mode={docModalMode}
          document={selectedDocForModal}
          clients={clients}
          properties={properties}
          sales={sales}
          rentals={rentals}
          defaultClientId={id}
          onClose={() => { setIsDocModalOpen(false); setSelectedDocForModal(undefined); }}
          onSave={(doc) => {
            const existing = documents.find(d => d.id === doc.id);
            if (existing) {
              updateDocument(doc);
            } else {
              addDocument(doc);
            }
          }}
          onDelete={(docId) => {
            deleteDocument(docId);
          }}
          onDownload={(doc) => {
            if (doc.fileName) {
              showToast('Descarga simulada: "' + doc.fileName + '". La descarga real se implementará cuando exista almacenamiento de archivos.', 'info');
            } else {
              showToast('Descarga simulada. La descarga real se implementará cuando exista almacenamiento de archivos.', 'info');
            }
          }}
        />
        
        {/* Sale Modal */}
        <SaleModal
          isOpen={isSaleModalOpen}
          mode={saleModalMode}
          sale={selectedSaleForModal}
          clients={clients}
          properties={properties}
          defaultClientId={id}
          onClose={() => { setIsSaleModalOpen(false); setSelectedSaleForModal(undefined); }}
          onSave={(sale) => {
            const existing = sales.find(s => s.id === sale.id);
            if (existing) {
              updateSale(sale);
            } else {
              addSale(sale);
            }
          }}
          onDelete={(saleId) => {
            deleteSale(saleId);
          }}
        />

        {/* Rental Modal */}
        <RentalModal
          isOpen={isRentalModalOpen}
          mode={rentalModalMode}
          rental={selectedRentalForModal}
          clients={clients}
          properties={properties}
          defaultClientId={id}
          onClose={() => { setIsRentalModalOpen(false); setSelectedRentalForModal(undefined); }}
          onSave={(rental) => {
            const existing = rentals.find(r => r.id === rental.id);
            if (existing) {
              updateRental(rental);
            } else {
              addRental(rental);
            }
          }}
          onDelete={(rentalId) => {
            deleteRental(rentalId);
          }}
        />

        {/* Task Modal */}
        {isTaskModalOpen && renderTaskModal()}

        {/* Event Modal */}
        {isEventModalOpen && renderEventModal()}
      </div>
    );
  }

  function renderFormModal() {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsFormModalOpen(false)}></div>
        <div className="bg-white rounded-2xl w-full max-w-2xl relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
            <h2 className="font-bold text-xl text-gray-900">{editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
            <button onClick={() => setIsFormModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre *</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Teléfono</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                <input 
                  type="email" 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
                            <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Tipo * (seleccioná uno o más)</label>
                <div className="flex flex-wrap gap-2">
                  {(['comprador','vendedor','inquilino','propietario','inversor','interesado'] as ClientType[]).map(t => {
                    const selected = (formData.types && formData.types.length > 0) ? formData.types.includes(t) : formData.type === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-bold border transition-all",
                          selected
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                        )}
                        onClick={() => {
                          const currentTypes = (formData.types && formData.types.length > 0) ? [...formData.types] : (formData.type ? [formData.type] : []);
                          if (currentTypes.includes(t)) {
                            const next = currentTypes.filter(x => x !== t);
                            setFormData({...formData, types: next.length > 0 ? next : undefined, type: next.length > 0 ? next[0] : 'comprador'});
                          } else {
                            const next = [...currentTypes, t];
                            setFormData({...formData, types: next, type: next[0]});
                          }
                        }}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Profesión</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.profession || ''}
                  onChange={e => setFormData({...formData, profession: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Estado</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as ClientStatus})}
                >
                  <option value="nuevo">Nuevo</option>
                  <option value="contactado">Contactado</option>
                  <option value="interesado">Interesado</option>
                  <option value="en seguimiento">En Seguimiento</option>
                  <option value="negociación">Negociación</option>
                  <option value="cerrado">Cerrado</option>
                  <option value="perdido">Perdido</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Origen</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.origin}
                  onChange={e => setFormData({...formData, origin: e.target.value as ClientOrigin})}
                >
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Web">Web</option>
                  <option value="Referido">Referido</option>
                  <option value="Llamada">Llamada</option>
                  <option value="Oficina">Oficina</option>
                </select>
              </div>
              {(formData.origin === 'Referido') && (
                <div className="md:col-span-2 space-y-3">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Referido por colega</label>
                  {!showNewColleagueForm ? (
                    <>
                      <SearchableSelect
                        placeholder="Seleccionar colega..."
                        value={selectedColleagueId}
                        onChange={val => setSelectedColleagueId(val)}
                        options={referredColleagues.map(c => ({ value: c.id, label: c.nombreApellido, subtitle: c.oficina }))}
                        emptyLabel="Ninguno"
                        allowEmpty
                      />
                      <button
                        type="button"
                        className="text-xs font-bold text-blue-600 hover:text-blue-800"
                        onClick={() => setShowNewColleagueForm(true)}
                      >
                        + Crear nuevo colega
                      </button>
                    </>
                  ) : (
                    <div className="p-3 border border-blue-100 rounded-xl bg-blue-50/50 space-y-3">
                      <p className="text-xs font-bold text-blue-700">Nuevo Colega</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Nombre y apellido *"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                          value={newColleagueName}
                          onChange={e => setNewColleagueName(e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Oficina"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                          value={newColleagueOffice}
                          onChange={e => setNewColleagueOffice(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button type="button" className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={() => { if (!newColleagueName.trim()) { showToast('El nombre es obligatorio', 'error'); return; } setShowNewColleagueForm(false); }}>Listo</button>
                        <button type="button" className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700" onClick={() => { setShowNewColleagueForm(false); setNewColleagueName(''); setNewColleagueOffice(''); }}>Cancelar</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Último Contacto</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.lastContact || ''}
                  onChange={e => setFormData({...formData, lastContact: e.target.value})}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Notas</label>
                <textarea 
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.notes || ''}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                />
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsFormModalOpen(false)}>Cancelar</Button>
              <Button type="submit" variant="primary">{editingClient ? 'Guardar Cambios' : 'Crear Cliente'}</Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500">Gestión de la cartera de clientes.</p>
        </div>
        <Button variant="primary" onClick={() => handleOpenForm()}>
          <UserPlus size={20} className="mr-2" /> Nuevo Cliente
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por nombre, teléfono o email..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant={showFilters ? 'primary' : 'outline'} 
              size="sm" 
              className="h-10"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={16} className="mr-2" /> Filtros
              {(filterType || filterStatus || filterOrigin || filterZone || filterHasOperation !== null || filterHasPendingTasks !== null) && (
                <span className="ml-1 w-2 h-2 rounded-full bg-blue-600" />
              )}
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="p-4 bg-gray-50 border-b border-gray-100">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="comprador">Comprador</option>
                  <option value="vendedor">Vendedor</option>
                  <option value="inquilino">Inquilino</option>
                  <option value="propietario">Propietario</option>
                  <option value="inversor">Inversor</option>
                  <option value="interesado">Interesado</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="nuevo">Nuevo</option>
                  <option value="contactado">Contactado</option>
                  <option value="interesado">Interesado</option>
                  <option value="en seguimiento">En Seguimiento</option>
                  <option value="negociación">Negociación</option>
                  <option value="cerrado">Cerrado</option>
                  <option value="perdido">Perdido</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Origen</label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                  value={filterOrigin}
                  onChange={e => setFilterOrigin(e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Web">Web</option>
                  <option value="Referido">Referido</option>
                  <option value="Llamada">Llamada</option>
                  <option value="Oficina">Oficina</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Zona de Interés</label>
                <input
                  type="text"
                  placeholder="Filtrar por zona..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                  value={filterZone}
                  onChange={e => setFilterZone(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Operaciones</label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                  value={filterHasOperation === null ? '' : filterHasOperation ? 'si' : 'no'}
                  onChange={e => {
                    const val = e.target.value;
                    setFilterHasOperation(val === '' ? null : val === 'si');
                  }}
                >
                  <option value="">Todas</option>
                  <option value="si">Con operaciones</option>
                  <option value="no">Sin operaciones</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Tareas Pendientes</label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                  value={filterHasPendingTasks === null ? '' : filterHasPendingTasks ? 'si' : 'no'}
                  onChange={e => {
                    const val = e.target.value;
                    setFilterHasPendingTasks(val === '' ? null : val === 'si');
                  }}
                >
                  <option value="">Todas</option>
                  <option value="si">Con tareas pendientes</option>
                  <option value="no">Sin tareas pendientes</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Orden</label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                  value={sortName}
                  onChange={e => setSortName(e.target.value as 'asc' | 'desc')}
                >
                  <option value="asc">A-Z</option>
                  <option value="desc">Z-A</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterType('');
                  setFilterStatus('');
                  setFilterOrigin('');
                  setFilterZone('');
                  setFilterHasOperation(null);
                  setFilterHasPendingTasks(null);
                  setSortName('asc');
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          </div>
        )}

        <div className="divide-y divide-gray-50">
          {filteredClients.map((client) => (
            <div 
              key={client.id} 
              className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
              onClick={() => navigate(`/clientes/${client.id}`)}
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold flex-shrink-0">
                {client.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{client.name}</p>
                <p className="text-xs text-gray-500 flex items-center gap-3 mt-0.5">
                  <span className="flex items-center"><Phone size={12} className="mr-1" />{client.phone}</span>
                  <span className="flex items-center"><Mail size={12} className="mr-1" />{client.email}</span>
                </p>
              </div>
                            <div className="flex items-center gap-1">
                {(client.types && client.types.length > 0 ? client.types : [client.type]).map(t => (
                                  <span key={t}>
                                    <Badge variant={getTypeBadgeVariant(t)} size="sm">{t}</Badge>
                                  </span>
                                ))}
                <Badge variant={getStatusBadgeVariant(client.status)} size="sm">{client.status}</Badge>
                <Badge variant="gray" size="sm">{client.origin}</Badge>
                {client.profession && (
                  <Badge variant="gray" size="sm">{client.profession}</Badge>
                )}
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
            </div>
          ))}
        </div>

        {filteredClients.length === 0 && (
          <div className="py-20 text-center">
            <Users size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium">
              {searchTerm || filterType || filterStatus || filterOrigin || filterZone || filterHasOperation !== null || filterHasPendingTasks !== null
                ? 'No se encontraron clientes con los filtros actuales.'
                : 'No hay clientes cargados.'}
            </p>
          </div>
        )}
      </div>

      {isFormModalOpen && renderFormModal()}
    </div>
  );
}
