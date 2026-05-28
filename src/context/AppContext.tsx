import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import {
  Client, Property, PropertyStatus, CalendarEvent, Task, Sale, Rental, Document,
  WaitingRoomEntry, Buyer, ReferredColleague, ActivityLog
} from '../types';
import {
  MOCK_CLIENTS,
  MOCK_PROPERTIES,
  MOCK_EVENTS,
  MOCK_TASKS,
  MOCK_SALES,
  MOCK_RENTALS,
  MOCK_DOCUMENTS
} from '../mockData';
import Toast, { ToastType } from '../components/Toast';
import { loadFromStorage, saveToStorage, removeFromStorage } from '../lib/storage';
import { generateId } from '../lib/id';
import { isOverdue, daysUntil } from '../lib/dates';

interface ToastState {
  message: string;
  type: ToastType;
}

interface AppContextType {
  clients: Client[];
  properties: Property[];
  events: CalendarEvent[];
  tasks: Task[];
  sales: Sale[];
  rentals: Rental[];
  documents: Document[];
  waitingRoom: WaitingRoomEntry[];
  buyers: Buyer[];
  referredColleagues: ReferredColleague[];
  activityLogs: ActivityLog[];

  showToast: (message: string, type: ToastType) => void;
  addClient: (client: Client) => void;
  updateClient: (client: Client) => void;
  addProperty: (property: Property) => void;
  updateProperty: (property: Property) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  completeTask: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (event: CalendarEvent) => void;
  completeEvent: (eventId: string) => void;
  cancelEvent: (eventId: string) => void;
  deleteEvent: (eventId: string) => void;
  addSale: (sale: Sale) => void;
  updateSale: (sale: Sale) => void;
  deleteSale: (saleId: string) => void;
  addRental: (rental: Rental) => void;
  updateRental: (rental: Rental) => void;
  deleteRental: (rentalId: string) => void;
  addDocument: (doc: Document) => void;
  updateDocument: (doc: Document) => void;
  deleteDocument: (docId: string) => void;
  addWaitingRoomEntry: (entry: WaitingRoomEntry) => void;
  updateWaitingRoomEntry: (entry: WaitingRoomEntry) => void;
  deleteWaitingRoomEntry: (entryId: string) => void;
  addBuyer: (buyer: Buyer) => void;
  updateBuyer: (buyer: Buyer) => void;
  deleteBuyer: (buyerId: string) => void;
  addReferredColleague: (colleague: ReferredColleague) => void;
  updateReferredColleague: (colleague: ReferredColleague) => void;
  deleteReferredColleague: (colleagueId: string) => void;
  resetData: () => void;
  exportData: () => void;
  importData: (jsonData: string) => boolean;
  addActivityLog: (log: Omit<ActivityLog, 'id' | 'createdAt'>) => void;
}

const STORAGE_KEYS = {
  CLIENTS: 'immoflow_clients',
  PROPERTIES: 'immoflow_properties',
  TASKS: 'immoflow_tasks',
  EVENTS: 'immoflow_events',
  SALES: 'immoflow_sales',
  RENTALS: 'immoflow_rentals',
  DOCUMENTS: 'immoflow_documents',
  WAITING_ROOM: 'immoflow_waiting_room',
  BUYERS: 'immoflow_buyers',
  REFERRED_COLLEAGUES: 'immoflow_referred_colleagues',
  ACTIVITY_LOGS: 'immoflow_activity_logs'
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Initialize state from localStorage or MOCK_DATA
  const [clients, setClients] = useState<Client[]>(() => loadFromStorage(STORAGE_KEYS.CLIENTS, MOCK_CLIENTS));
  const [properties, setProperties] = useState<Property[]>(() => loadFromStorage(STORAGE_KEYS.PROPERTIES, MOCK_PROPERTIES));
  const [events, setEvents] = useState<CalendarEvent[]>(() => loadFromStorage(STORAGE_KEYS.EVENTS, MOCK_EVENTS));
  const [tasks, setTasks] = useState<Task[]>(() => loadFromStorage(STORAGE_KEYS.TASKS, MOCK_TASKS));
  const [sales, setSales] = useState<Sale[]>(() => loadFromStorage(STORAGE_KEYS.SALES, MOCK_SALES));
  const [rentals, setRentals] = useState<Rental[]>(() => loadFromStorage(STORAGE_KEYS.RENTALS, MOCK_RENTALS));
  const [documents, setDocuments] = useState<Document[]>(() => loadFromStorage(STORAGE_KEYS.DOCUMENTS, MOCK_DOCUMENTS));
  const [waitingRoom, setWaitingRoom] = useState<WaitingRoomEntry[]>(() => loadFromStorage(STORAGE_KEYS.WAITING_ROOM, []));
  const [buyers, setBuyers] = useState<Buyer[]>(() => loadFromStorage(STORAGE_KEYS.BUYERS, []));
  const [referredColleagues, setReferredColleagues] = useState<ReferredColleague[]>(() => loadFromStorage(STORAGE_KEYS.REFERRED_COLLEAGUES, []));
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => loadFromStorage(STORAGE_KEYS.ACTIVITY_LOGS, []));
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: ToastType) => setToast({ message, type }), []);

  // Activity Log helper
  const addActivityLog = useCallback((log: Omit<ActivityLog, 'id' | 'createdAt'>) => {
    const newLog: ActivityLog = {
      ...log,
      id: generateId('log'),
      createdAt: new Date().toISOString()
    };
    setActivityLogs(prev => [newLog, ...prev].slice(0, 200));
  }, []);

  // Persistence Effects
  useEffect(() => { saveToStorage(STORAGE_KEYS.CLIENTS, clients); }, [clients]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.PROPERTIES, properties); }, [properties]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.EVENTS, events); }, [events]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.TASKS, tasks); }, [tasks]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.SALES, sales); }, [sales]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.RENTALS, rentals); }, [rentals]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.DOCUMENTS, documents); }, [documents]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.WAITING_ROOM, waitingRoom); }, [waitingRoom]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.BUYERS, buyers); }, [buyers]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.REFERRED_COLLEAGUES, referredColleagues); }, [referredColleagues]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.ACTIVITY_LOGS, activityLogs); }, [activityLogs]);

  // --- Entity relation helpers (private) ---
  const updatePropertyStatusIfNeeded = useCallback((propertyId: string, newStatus: Property['status'], forbiddenCurrent?: Property['status']) => {
    setProperties(prev => prev.map(p => {
      if (p.id !== propertyId) return p;
      if (forbiddenCurrent && p.status === forbiddenCurrent) return p;
      return { ...p, status: newStatus };
    }));
  }, []);

  const handleSaleStatusChange = useCallback((sale: Sale) => {
    if (sale.estado === 'vendida') {
      updatePropertyStatusIfNeeded(sale.propiedadId, 'vendida');
    }
  }, [updatePropertyStatusIfNeeded]);

  const handleRentalStatusChange = useCallback((rental: Rental) => {
    if (rental.estado === 'firmado' || rental.estado === 'en curso') {
      updatePropertyStatusIfNeeded(rental.propiedadId, 'alquilada', 'vendida');
    }
  }, [updatePropertyStatusIfNeeded]);

  // --- Contract expiration automation ---
  const processedAutoKeys = useRef<Set<string>>(new Set());

  useEffect(() => {
    const checkContractExpirations = () => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      properties.forEach(prop => {
        if (!prop.contractEndDate) return;
        const end = new Date(prop.contractEndDate);
        end.setHours(0, 0, 0, 0);
        const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Warning 15 days before
        if (daysLeft <= 15 && daysLeft >= 0) {
          const warningKey = `contract-warning-15-${prop.id}-${prop.contractEndDate}`;
          if (!processedAutoKeys.current.has(warningKey)) {
            const exists = tasks.some(t => t.autoKey === warningKey);
            if (!exists) {
              const newTask: Task = {
                id: generateId('t'),
                title: `Revisar / renovar contrato de ${prop.title}`,
                description: `El contrato de la propiedad ${prop.title} vence el ${prop.contractEndDate}. Contactar al cliente para revisar renovación.`,
                dueDate: new Date().toISOString().split('T')[0],
                priority: daysLeft === 0 ? 'alta' : 'media',
                status: 'pendiente',
                propertyId: prop.id,
                clientId: prop.ownerId,
                createdAt: new Date().toISOString(),
                source: 'auto_contract_renewal',
                autoKey: warningKey
              };
              setTasks(prev => [newTask, ...prev]);
              addActivityLog({
                type: 'task',
                action: 'created',
                title: `Tarea automática creada: Revisar contrato de ${prop.title}`,
                entityId: prop.id
              });
            }
            processedAutoKeys.current.add(warningKey);
          }
        }

        // Expired
        if (daysLeft < 0 && prop.status !== 'vencida') {
          const expiredKey = `contract-expired-${prop.id}-${prop.contractEndDate}`;
          if (!processedAutoKeys.current.has(expiredKey)) {
            const exists = tasks.some(t => t.autoKey === expiredKey);
            if (!exists) {
              const newTask: Task = {
                id: generateId('t'),
                title: `Revisar / renovar contrato de ${prop.title}`,
                description: `El contrato de la propiedad ${prop.title} venció el ${prop.contractEndDate}. Contactar al cliente urgentemente.`,
                dueDate: new Date().toISOString().split('T')[0],
                priority: 'alta',
                status: 'pendiente',
                propertyId: prop.id,
                clientId: prop.ownerId,
                createdAt: new Date().toISOString(),
                source: 'auto_contract_renewal',
                autoKey: expiredKey
              };
              setTasks(prev => [newTask, ...prev]);
            }
            processedAutoKeys.current.add(expiredKey);
          }
          setProperties(prev => prev.map(p => p.id === prop.id ? { ...p, status: 'vencida' as PropertyStatus } : p));
          addActivityLog({
            type: 'property',
            action: 'status_changed',
            title: `Propiedad vencida: ${prop.title}`,
            description: 'El contrato llegó a su fecha de fin y el estado pasó a Vencida',
            entityId: prop.id
          });
        }
      });
    };

    checkContractExpirations();
    const interval = setInterval(checkContractExpirations, 60000);
    return () => clearInterval(interval);
  }, [properties, tasks, addActivityLog]);

  // --- Clients ---
  const addClient = (client: Client) => {
    setClients(prev => [client, ...prev]);
    addActivityLog({ type: 'client', action: 'created', title: `Cliente creado: ${client.name}`, entityId: client.id });
    showToast('Cliente creado con éxito', 'success');
  };
  const updateClient = (client: Client) => {
    setClients(prev => prev.map(c => c.id === client.id ? client : c));
    addActivityLog({ type: 'client', action: 'updated', title: `Cliente actualizado: ${client.name}`, entityId: client.id });
    showToast('Cliente actualizado', 'success');
  };

  // --- Properties ---
  const addProperty = (property: Property) => {
    setProperties(prev => [property, ...prev]);
    addActivityLog({ type: 'property', action: 'created', title: `Propiedad creada: ${property.title}`, entityId: property.id });
    showToast('Propiedad añadida', 'success');
  };
  const updateProperty = (property: Property) => {
    setProperties(prev => prev.map(p => p.id === property.id ? property : p));
    addActivityLog({ type: 'property', action: 'updated', title: `Propiedad actualizada: ${property.title}`, entityId: property.id });
    showToast('Propiedad actualizada', 'success');
  };

  // --- Tasks ---
  const addTask = (task: Task) => {
    setTasks(prev => [task, ...prev]);
    addActivityLog({ type: 'task', action: 'created', title: `Tarea creada: ${task.title}`, entityId: task.id });
    showToast('Tarea creada', 'success');
  };
  const updateTask = (task: Task) => {
    setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    addActivityLog({ type: 'task', action: 'updated', title: `Tarea actualizada: ${task.title}`, entityId: task.id });
    showToast('Tarea actualizada', 'success');
  };
  const completeTask = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completada' } : t));
    showToast('Tarea completada ✔️', 'success');
  };
  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    showToast('Tarea eliminada', 'info');
  };

  // --- Events ---
  const addEvent = (event: CalendarEvent) => {
    setEvents(prev => [event, ...prev]);
    addActivityLog({ type: 'event', action: 'created', title: `Evento creado: ${event.title}`, entityId: event.id });
    showToast('Evento agendado', 'success');
  };
  const updateEvent = (event: CalendarEvent) => {
    setEvents(prev => prev.map(e => e.id === event.id ? event : e));
    addActivityLog({ type: 'event', action: 'updated', title: `Evento actualizado: ${event.title}`, entityId: event.id });
    showToast('Evento actualizado', 'success');
  };
  const completeEvent = (eventId: string) => {
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: 'realizado' } : e));
    showToast('Evento marcado como realizado', 'success');
  };
  const cancelEvent = (eventId: string) => {
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: 'cancelado' } : e));
    showToast('Evento cancelado', 'warning');
  };
  const deleteEvent = (eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
    showToast('Evento eliminado', 'info');
  };

  // --- Sales ---
  const addSale = (sale: Sale) => {
    setSales(prev => [sale, ...prev]);
    handleSaleStatusChange(sale);
    addActivityLog({ type: 'sale', action: 'created', title: `Venta registrada: ${sale.nombre || sale.id}`, entityId: sale.id });
    showToast('Operación de venta registrada', 'success');
  };
  const updateSale = (sale: Sale) => {
    setSales(prev => prev.map(s => s.id === sale.id ? sale : s));
    handleSaleStatusChange(sale);
    addActivityLog({ type: 'sale', action: 'updated', title: `Venta actualizada: ${sale.nombre || sale.id}`, entityId: sale.id });
    showToast('Venta actualizada', 'success');
  };
  const deleteSale = (saleId: string) => {
    setSales(prev => prev.filter(s => s.id !== saleId));
    showToast('Venta eliminada', 'info');
  };

  // --- Rentals ---
  const addRental = (rental: Rental) => {
    setRentals(prev => [rental, ...prev]);
    handleRentalStatusChange(rental);
    addActivityLog({ type: 'rental', action: 'created', title: `Alquiler registrado: ${rental.id}`, entityId: rental.id });
    showToast('Operación de alquiler registrada', 'success');
  };
  const updateRental = (rental: Rental) => {
    setRentals(prev => prev.map(r => r.id === rental.id ? rental : r));
    handleRentalStatusChange(rental);
    addActivityLog({ type: 'rental', action: 'updated', title: `Alquiler actualizado: ${rental.id}`, entityId: rental.id });
    showToast('Alquiler actualizado', 'success');
  };
  const deleteRental = (rentalId: string) => {
    setRentals(prev => prev.filter(r => r.id !== rentalId));
    showToast('Alquiler eliminado', 'info');
  };

  // --- Documents ---
  const addDocument = (doc: Document) => {
    setDocuments(prev => [doc, ...prev]);
    addActivityLog({ type: 'document', action: 'created', title: `Documento añadido: ${doc.name}`, entityId: doc.id });
    showToast('Documento añadido', 'success');
  };
  const updateDocument = (doc: Document) => {
    setDocuments(prev => prev.map(d => d.id === doc.id ? doc : d));
    addActivityLog({ type: 'document', action: 'updated', title: `Documento actualizado: ${doc.name}`, entityId: doc.id });
    showToast('Documento actualizado', 'success');
  };
  const deleteDocument = (docId: string) => {
    setDocuments(prev => prev.filter(d => d.id !== docId));
    showToast('Documento eliminado', 'info');
  };

  // --- Waiting Room ---
  const addWaitingRoomEntry = (entry: WaitingRoomEntry) => {
    setWaitingRoom(prev => [entry, ...prev]);
    addActivityLog({ type: 'waiting_room', action: 'created', title: `Sala de espera: ${entry.nombre}`, entityId: entry.id });
    showToast('Entrada añadida a Sala de Espera', 'success');
  };
  const updateWaitingRoomEntry = (entry: WaitingRoomEntry) => {
    setWaitingRoom(prev => prev.map(e => e.id === entry.id ? entry : e));
    addActivityLog({ type: 'waiting_room', action: 'updated', title: `Sala de espera actualizada: ${entry.nombre}`, entityId: entry.id });
    showToast('Entrada actualizada', 'success');
  };
  const deleteWaitingRoomEntry = (entryId: string) => {
    setWaitingRoom(prev => prev.filter(e => e.id !== entryId));
    showToast('Entrada eliminada', 'info');
  };

  // --- Buyers ---
  const addBuyer = (buyer: Buyer) => {
    setBuyers(prev => [buyer, ...prev]);
    addActivityLog({ type: 'buyer', action: 'created', title: `Comprador añadido: ${buyer.nombre}`, entityId: buyer.id });
    showToast('Comprador añadido', 'success');
  };
  const updateBuyer = (buyer: Buyer) => {
    setBuyers(prev => prev.map(b => b.id === buyer.id ? buyer : b));
    addActivityLog({ type: 'buyer', action: 'updated', title: `Comprador actualizado: ${buyer.nombre}`, entityId: buyer.id });
    showToast('Comprador actualizado', 'success');
  };
  const deleteBuyer = (buyerId: string) => {
    setBuyers(prev => prev.filter(b => b.id !== buyerId));
    showToast('Comprador eliminado', 'info');
  };

  // --- Referred Colleagues ---
  const addReferredColleague = (colleague: ReferredColleague) => {
    setReferredColleagues(prev => [colleague, ...prev]);
    addActivityLog({ type: 'colleague', action: 'created', title: `Colega añadido: ${colleague.nombreApellido}`, entityId: colleague.id });
    showToast('Colega referido añadido', 'success');
  };
  const updateReferredColleague = (colleague: ReferredColleague) => {
    setReferredColleagues(prev => prev.map(c => c.id === colleague.id ? colleague : c));
    addActivityLog({ type: 'colleague', action: 'updated', title: `Colega actualizado: ${colleague.nombreApellido}`, entityId: colleague.id });
    showToast('Colega actualizado', 'success');
  };
  const deleteReferredColleague = (colleagueId: string) => {
    setReferredColleagues(prev => prev.filter(c => c.id !== colleagueId));
    showToast('Colega eliminado', 'info');
  };

  // --- Utilities ---
  const resetData = () => {
    Object.values(STORAGE_KEYS).forEach(key => removeFromStorage(key));
    window.location.reload();
  };

  const exportData = () => {
    const data = {
      clients,
      properties,
      tasks,
      events,
      sales,
      rentals,
      documents,
      waitingRoom,
      buyers,
      referredColleagues,
      activityLogs,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `immoflow-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Copia de seguridad descargada', 'success');
  };

  const importData = (jsonData: string): boolean => {
    try {
      const data = JSON.parse(jsonData);
      if (data.clients) setClients(data.clients);
      if (data.properties) setProperties(data.properties);
      if (data.tasks) setTasks(data.tasks);
      if (data.events) setEvents(data.events);
      if (data.sales) setSales(data.sales);
      if (data.rentals) setRentals(data.rentals);
      if (data.documents) setDocuments(data.documents);
      if (data.waitingRoom) setWaitingRoom(data.waitingRoom);
      if (data.buyers) setBuyers(data.buyers);
      if (data.referredColleagues) {
        setReferredColleagues(data.referredColleagues.map((c: ReferredColleague) => ({
          ...c,
          referredClientIds: c.referredClientIds ?? []
        })));
      }
      if (data.activityLogs) setActivityLogs(data.activityLogs);
      showToast('Datos importados correctamente', 'success');
      return true;
    } catch (e) {
      showToast('Error al importar el archivo', 'error');
      return false;
    }
  };

  return (
    <AppContext.Provider value={{
      clients,
      properties,
      events,
      tasks,
      sales,
      rentals,
      documents,
      waitingRoom,
      buyers,
      referredColleagues,
      activityLogs,
      showToast,
      addClient,
      updateClient,
      addProperty,
      updateProperty,
      addTask,
      updateTask,
      completeTask,
      deleteTask,
      addEvent,
      updateEvent,
      completeEvent,
      cancelEvent,
      deleteEvent,
      addSale,
      updateSale,
      deleteSale,
      addRental,
      updateRental,
      deleteRental,
      addDocument,
      updateDocument,
      deleteDocument,
      addWaitingRoomEntry,
      updateWaitingRoomEntry,
      deleteWaitingRoomEntry,
      addBuyer,
      updateBuyer,
      deleteBuyer,
      addReferredColleague,
      updateReferredColleague,
      deleteReferredColleague,
      resetData,
      exportData,
      importData,
      addActivityLog
    }}>
      {children}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
