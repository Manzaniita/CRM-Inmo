import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Client, Property, CalendarEvent, Task, Sale, Rental, Document } from '../types';
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
  resetData: () => void;
  exportData: () => void;
  importData: (jsonData: string) => boolean;
}

const STORAGE_KEYS = {
  CLIENTS: 'immoflow_clients',
  PROPERTIES: 'immoflow_properties',
  TASKS: 'immoflow_tasks',
  EVENTS: 'immoflow_events',
  SALES: 'immoflow_sales',
  RENTALS: 'immoflow_rentals',
  DOCUMENTS: 'immoflow_documents'
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Initialize state from localStorage or MOCK_DATA
  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CLIENTS);
      return saved ? JSON.parse(saved) : MOCK_CLIENTS;
    } catch (e) {
      console.error('Error loading clients from localStorage', e);
      return MOCK_CLIENTS;
    }
  });

  const [properties, setProperties] = useState<Property[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROPERTIES);
      return saved ? JSON.parse(saved) : MOCK_PROPERTIES;
    } catch (e) {
      console.error('Error loading properties from localStorage', e);
      return MOCK_PROPERTIES;
    }
  });

  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EVENTS);
      return saved ? JSON.parse(saved) : MOCK_EVENTS;
    } catch (e) {
      console.error('Error loading events from localStorage', e);
      return MOCK_EVENTS;
    }
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
      return saved ? JSON.parse(saved) : MOCK_TASKS;
    } catch (e) {
      console.error('Error loading tasks from localStorage', e);
      return MOCK_TASKS;
    }
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SALES);
      return saved ? JSON.parse(saved) : MOCK_SALES;
    } catch (e) {
      console.error('Error loading sales from localStorage', e);
      return MOCK_SALES;
    }
  });

  const [rentals, setRentals] = useState<Rental[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RENTALS);
      return saved ? JSON.parse(saved) : MOCK_RENTALS;
    } catch (e) {
      console.error('Error loading rentals from localStorage', e);
      return MOCK_RENTALS;
    }
  });

  const [documents, setDocuments] = useState<Document[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
      return saved ? JSON.parse(saved) : MOCK_DOCUMENTS;
    } catch (e) {
      console.error('Error loading documents from localStorage', e);
      return MOCK_DOCUMENTS;
    }
  });
  const [toast, setToast] = useState<ToastState | null>(null);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROPERTIES, JSON.stringify(properties));
  }, [properties]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RENTALS, JSON.stringify(rentals));
  }, [rentals]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents));
  }, [documents]);

  const showToast = (message: string, type: ToastType) => setToast({ message, type });

  const addClient = (client: Client) => {
    setClients(prev => [client, ...prev]);
    showToast('Cliente creado con éxito', 'success');
  };
  const updateClient = (client: Client) => {
    setClients(prev => prev.map(c => c.id === client.id ? client : c));
    showToast('Cliente actualizado', 'success');
  };
  
  const addProperty = (property: Property) => {
    setProperties(prev => [property, ...prev]);
    showToast('Propiedad añadida', 'success');
  };
  const updateProperty = (property: Property) => {
    setProperties(prev => prev.map(p => p.id === property.id ? property : p));
    showToast('Propiedad actualizada', 'success');
  };

  const addTask = (task: Task) => {
    setTasks(prev => [task, ...prev]);
    showToast('Tarea creada', 'success');
  };
  const updateTask = (task: Task) => {
    setTasks(prev => prev.map(t => t.id === task.id ? task : t));
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

  const addEvent = (event: CalendarEvent) => {
    setEvents(prev => [event, ...prev]);
    showToast('Evento agendado', 'success');
  };
  const updateEvent = (event: CalendarEvent) => {
    setEvents(prev => prev.map(e => e.id === event.id ? event : e));
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

  const addSale = (sale: Sale) => {
    setSales(prev => [sale, ...prev]);
    showToast('Operación de venta registrada', 'success');
  };
  const updateSale = (sale: Sale) => {
    setSales(prev => prev.map(s => s.id === sale.id ? sale : s));
    showToast('Venta actualizada', 'success');
  };
  const deleteSale = (saleId: string) => {
    setSales(prev => prev.filter(s => s.id !== saleId));
    showToast('Venta eliminada', 'info');
  };

  const addRental = (rental: Rental) => {
    setRentals(prev => [rental, ...prev]);
    showToast('Operación de alquiler registrada', 'success');
  };
  const updateRental = (rental: Rental) => {
    setRentals(prev => prev.map(r => r.id === rental.id ? rental : r));
    showToast('Alquiler actualizado', 'success');
  };
  const deleteRental = (rentalId: string) => {
    setRentals(prev => prev.filter(r => r.id !== rentalId));
    showToast('Alquiler eliminado', 'info');
  };

  const addDocument = (doc: Document) => {
    setDocuments(prev => [doc, ...prev]);
    showToast('Documento añadido', 'success');
  };

  const updateDocument = (doc: Document) => {
    setDocuments(prev => prev.map(d => d.id === doc.id ? doc : d));
    showToast('Documento actualizado', 'success');
  };

  const deleteDocument = (docId: string) => {
    setDocuments(prev => prev.filter(d => d.id !== docId));
    showToast('Documento eliminado', 'info');
  };

  const resetData = () => {
    // Clear all persistent storage
    localStorage.removeItem(STORAGE_KEYS.CLIENTS);
    localStorage.removeItem(STORAGE_KEYS.PROPERTIES);
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.EVENTS);
    localStorage.removeItem(STORAGE_KEYS.SALES);
    localStorage.removeItem(STORAGE_KEYS.RENTALS);
    localStorage.removeItem(STORAGE_KEYS.DOCUMENTS);
    
    // Optional: reload page to ensure fresh start from MOCK_DATA
    // This is the most reliable way to reset a local-only app state
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
      resetData,
      exportData,
      importData
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
