import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import type {
  Client, Property, PropertyStatus, CalendarEvent, Task, Sale, Rental, Document,
  WaitingRoomEntry, Buyer, ReferredColleague, ActivityLog, Profile
} from '../types';
import Toast, { ToastType } from '../components/Toast';
import { generateId } from '../lib/id';

interface ToastState {
  message: string;
  type: ToastType;
}

interface AppContextType {
  profile: Profile;
  updateProfile: (profile: Profile) => Promise<void>;
  clearMockData: () => void;
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

  // Auth / Cloud
  user: User | null;
  session: Session | null;
  isCloudReady: boolean;
  signOut: () => Promise<void>;

  showToast: (message: string, type: ToastType) => void;
  addClient: (client: Client) => Promise<void>;
  updateClient: (client: Client) => Promise<void>;
  addProperty: (property: Property) => Promise<void>;
  updateProperty: (property: Property) => Promise<void>;
  addTask: (task: Task) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  addEvent: (event: CalendarEvent) => Promise<void>;
  updateEvent: (event: CalendarEvent) => Promise<void>;
  completeEvent: (eventId: string) => Promise<void>;
  cancelEvent: (eventId: string) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  addSale: (sale: Sale) => Promise<void>;
  updateSale: (sale: Sale) => Promise<void>;
  deleteSale: (saleId: string) => Promise<void>;
  addRental: (rental: Rental) => Promise<void>;
  updateRental: (rental: Rental) => Promise<void>;
  deleteRental: (rentalId: string) => Promise<void>;
  addDocument: (doc: Document) => Promise<void>;
  updateDocument: (doc: Document) => Promise<void>;
  deleteDocument: (docId: string) => Promise<void>;
  addWaitingRoomEntry: (entry: WaitingRoomEntry) => Promise<void>;
  updateWaitingRoomEntry: (entry: WaitingRoomEntry) => Promise<void>;
  deleteWaitingRoomEntry: (entryId: string) => Promise<void>;
  addBuyer: (buyer: Buyer) => Promise<void>;
  updateBuyer: (buyer: Buyer) => Promise<void>;
  deleteBuyer: (buyerId: string) => Promise<void>;
  addReferredColleague: (colleague: ReferredColleague) => Promise<void>;
  updateReferredColleague: (colleague: ReferredColleague) => Promise<void>;
  deleteReferredColleague: (colleagueId: string) => Promise<void>;
  resetData: () => void;
  exportData: () => void;
  importData: (jsonData: string) => Promise<boolean>;
  addActivityLog: (log: Omit<ActivityLog, 'id' | 'createdAt'>) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // ---- Auth state ----
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isCloudReady, setIsCloudReady] = useState(false);

  // ---- Entity state (cloud-only, initialized empty) ----
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [waitingRoom, setWaitingRoom] = useState<WaitingRoomEntry[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [referredColleagues, setReferredColleagues] = useState<ReferredColleague[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [profile, setProfile] = useState<Profile>({
    name: '',
    email: '',
    phone: '',
    license: '',
    templateProperty: '',
    templateClient: '',
    templateBuyer: '',
    role: 'agent',
    must_change_password: false,
  });
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: ToastType) => setToast({ message, type }), []);

  // ---- Auth listener ----
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const clearAllState = useCallback(() => {
    setClients([]);
    setProperties([]);
    setEvents([]);
    setTasks([]);
    setSales([]);
    setRentals([]);
    setDocuments([]);
    setWaitingRoom([]);
    setBuyers([]);
    setReferredColleagues([]);
    setActivityLogs([]);
    setProfile({
      name: '',
      email: '',
      phone: '',
      license: '',
      templateProperty: '',
      templateClient: '',
      templateBuyer: '',
      role: 'agent',
      must_change_password: false,
    });
    setIsCloudReady(false);
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    clearAllState();
    showToast('Sesión cerrada', 'info');
  }, [clearAllState, showToast]);

  // ---- Load from Supabase when authenticated ----
  const loadAllFromSupabase = useCallback(async (uid: string) => {
    try {
      setIsCloudReady(false);
      const [
        clientsRes,
        propertiesRes,
        eventsRes,
        tasksRes,
        salesRes,
        rentalsRes,
        documentsRes,
        colleaguesRes,
        buyersRes,
        waitingRoomRes,
        logsRes,
        profileRes,
      ] = await Promise.all([
        supabase.from('clients').select('*').eq('user_id', uid),
        supabase.from('properties').select('*').eq('user_id', uid),
        supabase.from('events').select('*').eq('user_id', uid),
        supabase.from('tasks').select('*').eq('user_id', uid),
        supabase.from('sales').select('*').eq('user_id', uid),
        supabase.from('rentals').select('*').eq('user_id', uid),
        supabase.from('documents').select('*').eq('user_id', uid),
        supabase.from('referred_colleagues').select('*').eq('user_id', uid),
        supabase.from('buyers').select('*').eq('user_id', uid),
        supabase.from('waiting_room').select('*').eq('user_id', uid),
        supabase.from('activity_logs').select('*').eq('user_id', uid).limit(200).order('createdAt', { ascending: false }),
        supabase.from('profiles').select('*').eq('user_id', uid).limit(1),
      ]);

      if (clientsRes.error) {
        console.error('[EstateCRM] clients load error:', clientsRes.error);
        showToast('Error al cargar clientes', 'error');
      } else if (clientsRes.data) {
        setClients(clientsRes.data as Client[]);
      }

      if (propertiesRes.error) {
        console.error('[EstateCRM] properties load error:', propertiesRes.error);
      } else if (propertiesRes.data) {
        setProperties(propertiesRes.data as Property[]);
      }

      if (eventsRes.error) {
        console.error('[EstateCRM] events load error:', eventsRes.error);
      } else if (eventsRes.data) {
        setEvents(eventsRes.data as CalendarEvent[]);
      }

      if (tasksRes.error) {
        console.error('[EstateCRM] tasks load error:', tasksRes.error);
      } else if (tasksRes.data) {
        setTasks((tasksRes.data as Task[]).map(t => ({ ...t, relatedEntities: t.relatedEntities ?? [] })));
      }

      if (salesRes.error) {
        console.error('[EstateCRM] sales load error:', salesRes.error);
      } else if (salesRes.data) {
        setSales((salesRes.data as Sale[]).map(s => ({
          ...s,
          operationStatus: s.operationStatus || 'activa',
          isCollected: s.isCollected ?? false,
          montoEscritura: typeof s.montoEscritura === 'number' ? String(s.montoEscritura) : s.montoEscritura,
        })));
      }

      if (rentalsRes.error) {
        console.error('[EstateCRM] rentals load error:', rentalsRes.error);
      } else if (rentalsRes.data) {
        setRentals(rentalsRes.data as Rental[]);
      }

      if (documentsRes.error) {
        console.error('[EstateCRM] documents load error:', documentsRes.error);
      } else if (documentsRes.data) {
        setDocuments(documentsRes.data as Document[]);
      }

      if (colleaguesRes.error) {
        console.error('[EstateCRM] colleagues load error:', colleaguesRes.error);
      } else if (colleaguesRes.data) {
        setReferredColleagues((colleaguesRes.data as ReferredColleague[]).map(c => ({ ...c, referredClientIds: c.referredClientIds ?? [] })));
      }

      if (logsRes.error) {
        console.error('[EstateCRM] logs load error:', logsRes.error);
      } else if (logsRes.data) {
        setActivityLogs(logsRes.data as ActivityLog[]);
      }

      if (buyersRes.error) {
        console.error('[EstateCRM] buyers load error:', buyersRes.error);
      } else if (buyersRes.data) {
        setBuyers(buyersRes.data as Buyer[]);
      }

      if (waitingRoomRes.error) {
        console.error('[EstateCRM] waiting_room load error:', waitingRoomRes.error);
      } else if (waitingRoomRes.data) {
        setWaitingRoom(waitingRoomRes.data as WaitingRoomEntry[]);
      }

      if (profileRes.error) {
        console.error('[EstateCRM] profile load error:', profileRes.error);
      } else if (profileRes.data && profileRes.data.length > 0) {
        const p = profileRes.data[0] as Profile;
        const { data: roleData } = await supabase.rpc('get_my_role');
        const serverRole = (roleData as string) ?? p.role ?? 'agent';
        setProfile(prev => ({
          ...prev,
          ...p,
          user_id: p.user_id ?? uid,
          role: serverRole,
          must_change_password: p.must_change_password ?? false,
        }));
      }
      setIsCloudReady(true);
    } catch (e) {
      console.error('[EstateCRM] Error loading from Supabase:', e);
      setIsCloudReady(false);
      showToast('Error al cargar datos de la nube', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    if (user) {
      clearAllState();
      loadAllFromSupabase(user.id);
    } else {
      clearAllState();
    }
  }, [user?.id, loadAllFromSupabase, clearAllState]);

  // ---- Supabase error helper ----
  const handleSupabaseError = useCallback((error: { message?: string } | null, label: string) => {
    console.error(`[EstateCRM Supabase] ${label}:`, error);
    const msg = error?.message || 'Error desconocido';
    showToast(`${label}: ${msg}`, 'error');
  }, [showToast]);

  // ---- Activity Log helper ----
  const addActivityLog = useCallback(async (log: Omit<ActivityLog, 'id' | 'createdAt'>) => {
    const newLog: ActivityLog = {
      ...log,
      id: generateId('log'),
      createdAt: new Date().toISOString(),
    };
    setActivityLogs(prev => [newLog, ...prev].slice(0, 200));
    if (user) {
      const { createdAt, ...rest } = newLog;
      const { error } = await supabase.from('activity_logs').insert({ ...rest, user_id: user.id });
      if (error) console.error('[EstateCRM] Activity log insert error:', error);
    }
  }, [user]);

  // --- Contract expiration automation (cloud-first) ---
  const processedAutoKeys = useRef<Set<string>>(new Set());

  useEffect(() => {
    const checkContractExpirations = async () => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      for (const prop of properties) {
        if (!prop.contractEndDate) continue;
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
                autoKey: warningKey,
              };
              if (user) {
                const { createdAt, ...rest } = newTask;
                const { data, error } = await supabase.from('tasks').insert({ ...rest, user_id: user.id }).select();
                if (!error && data) {
                  const inserted = data[0] as Task;
                  setTasks(prev => [inserted, ...prev]);
                  addActivityLog({
                    type: 'task',
                    action: 'created',
                    title: `Tarea automática creada: Revisar contrato de ${prop.title}`,
                    entityId: prop.id,
                  });
                }
              } else {
                setTasks(prev => [newTask, ...prev]);
              }
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
                autoKey: expiredKey,
              };
              if (user) {
                const { createdAt, ...rest } = newTask;
                const { data, error } = await supabase.from('tasks').insert({ ...rest, user_id: user.id }).select();
                if (!error && data) {
                  const inserted = data[0] as Task;
                  setTasks(prev => [inserted, ...prev]);
                }
              } else {
                setTasks(prev => [newTask, ...prev]);
              }
            }
            processedAutoKeys.current.add(expiredKey);
            if (user) {
              await supabase.from('properties').update({ status: 'vencida' }).eq('id', prop.id).eq('user_id', user.id);
            }
            setProperties(prev => prev.map(p => p.id === prop.id ? { ...p, status: 'vencida' as PropertyStatus } : p));
            addActivityLog({
              type: 'property',
              action: 'status_changed',
              title: `Propiedad vencida: ${prop.title}`,
              description: 'El contrato llegó a su fecha de fin y el estado pasó a Vencida',
              entityId: prop.id,
            });
          }
        }
      }
    };

    checkContractExpirations();
    const interval = setInterval(checkContractExpirations, 60000);
    return () => clearInterval(interval);
  }, [properties, tasks, addActivityLog, user]);

  // --- Entity relation helpers (local state only, cloud writes happen in CRUD) ---
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

  // --- Clients ---
  const addClient = async (client: Client) => {
    if (!user) { showToast('No hay sesión activa', 'error'); return; }
    const { createdAt, ...rest } = client;
    const { data, error } = await supabase.from('clients').insert({ ...rest, user_id: user.id }).select();
    if (error || !data) {
      handleSupabaseError(error, 'addClient');
      return;
    }
    const inserted = data[0] as Client;
    setClients(prev => [inserted, ...prev]);
    addActivityLog({ type: 'client', action: 'created', title: `Cliente creado: ${inserted.name}`, entityId: inserted.id });
    showToast('Cliente creado con éxito', 'success');
  };

  const updateClient = async (client: Client) => {
    if (!user) { showToast('No hay sesión activa', 'error'); return; }
    const { error } = await supabase.from('clients').update(client).eq('id', client.id).eq('user_id', user.id);
    if (error) {
      handleSupabaseError(error, 'updateClient');
      return;
    }
    setClients(prev => prev.map(c => c.id === client.id ? client : c));
    addActivityLog({ type: 'client', action: 'updated', title: `Cliente actualizado: ${client.name}`, entityId: client.id });
    showToast('Cliente actualizado', 'success');
  };

  // --- Properties ---
  const addProperty = async (property: Property) => {
    if (!user) { showToast('No hay sesión activa', 'error'); return; }
    const { data, error } = await supabase.from('properties').insert({ ...property, user_id: user.id }).select();
    if (error || !data) {
      handleSupabaseError(error, 'addProperty');
      return;
    }
    const inserted = data[0] as Property;
    setProperties(prev => [inserted, ...prev]);
    addActivityLog({ type: 'property', action: 'created', title: `Propiedad creada: ${inserted.title}`, entityId: inserted.id });
    showToast('Propiedad añadida', 'success');
  };

  const updateProperty = async (property: Property) => {
    if (!user) { showToast('No hay sesión activa', 'error'); return; }
    const { error } = await supabase.from('properties').update(property).eq('id', property.id).eq('user_id', user.id);
    if (error) {
      handleSupabaseError(error, 'updateProperty');
      return;
    }
    setProperties(prev => prev.map(p => p.id === property.id ? property : p));
    addActivityLog({ type: 'property', action: 'updated', title: `Propiedad actualizada: ${property.title}`, entityId: property.id });
    showToast('Propiedad actualizada', 'success');
  };

  // --- Tasks ---
  const addTask = async (task: Task) => {
    if (!user) { showToast('No hay sesión activa', 'error'); return; }
    const { createdAt, ...rest } = task;
    const { data, error } = await supabase.from('tasks').insert({ ...rest, user_id: user.id }).select();
    if (error || !data) {
      handleSupabaseError(error, 'addTask');
      return;
    }
    const inserted = data[0] as Task;
    setTasks(prev => [inserted, ...prev]);
    addActivityLog({ type: 'task', action: 'created', title: `Tarea creada: ${inserted.title}`, entityId: inserted.id });
    showToast('Tarea creada', 'success');
  };

  const updateTask = async (task: Task) => {
    if (!user) { showToast('No hay sesión activa', 'error'); return; }
    const { error } = await supabase.from('tasks').update(task).eq('id', task.id).eq('user_id', user.id);
    if (error) {
      handleSupabaseError(error, 'updateTask');
      return;
    }
    setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    addActivityLog({ type: 'task', action: 'updated', title: `Tarea actualizada: ${task.title}`, entityId: task.id });
    showToast('Tarea actualizada', 'success');
  };

  const completeTask = async (taskId: string) => {
    if (!user) { showToast('No hay sesión activa', 'error'); return; }
    const { error } = await supabase.from('tasks').update({ status: 'completada' }).eq('id', taskId).eq('user_id', user.id);
    if (error) {
      handleSupabaseError(error, 'completeTask');
      return;
    }
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completada' } : t));
    showToast('Tarea completada ✔️', 'success');
  };

  const deleteTask = async (taskId: string) => {
    if (!user) { showToast('No hay sesión activa', 'error'); return; }
    const { error } = await supabase.from('tasks').delete().eq('id', taskId).eq('user_id', user.id);
    if (error) {
      handleSupabaseError(error, 'deleteTask');
      return;
    }
    setTasks(prev => prev.filter(t => t.id !== taskId));
    showToast('Tarea eliminada', 'info');
  };

  // --- Events ---
  const addEvent = async (event: CalendarEvent) => {
    if (!user) { showToast('No hay sesión activa', 'error'); return; }
    const { createdAt, ...rest } = event;
    const { data, error } = await supabase.from('events').insert({ ...rest, user_id: user.id }).select();
    if (error || !data) {
      handleSupabaseError(error, 'addEvent');
      return;
    }
    const inserted = data[0] as CalendarEvent;
    setEvents(prev => [inserted, ...prev]);
    addActivityLog({ type: 'event', action: 'created', title: `Evento creado: ${inserted.title}`, entityId: inserted.id });
    showToast('Evento agendado', 'success');
  };

  const updateEvent = async (event: CalendarEvent) => {
    if (!user) { showToast('No hay sesión activa', 'error'); return; }
    const { error } = await supabase.from('events').update(event).eq('id', event.id).eq('user_id', user.id);
    if (error) {
      handleSupabaseError(error, 'updateEvent');
      return;
    }
    setEvents(prev => prev.map(e => e.id === event.id ? event : e));
    addActivityLog({ type: 'event', action: 'updated', title: `Evento actualizado: ${event.title}`, entityId: event.id });
    showToast('Evento actualizado', 'success');
  };

  const completeEvent = async (eventId: string) => {
    if (!user) { showToast('No hay sesión activa', 'error'); return; }
    const { error } = await supabase.from('events').update({ status: 'realizado' }).eq('id', eventId).eq('user_id', user.id);
    if (error) {
      handleSupabaseError(error, 'completeEvent');
      return;
    }
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: 'realizado' } : e));
    showToast('Evento marcado como realizado', 'success');
  };

  const cancelEvent = async (eventId: string) => {
    if (!user) { showToast('No hay sesión activa', 'error'); return; }
    const { error } = await supabase.from('events').update({ status: 'cancelado' }).eq('id', eventId).eq('user_id', user.id);
    if (error) {
      handleSupabaseError(error, 'cancelEvent');
      return;
    }
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: 'cancelado' } : e));
    showToast('Evento cancelado', 'warning');
  };

  const deleteEvent = async (eventId: string) => {
    if (!user) { showToast('No hay sesión activa', 'error'); return; }
    const { error } = await supabase.from('events').delete().eq('id', eventId).eq('user_id', user.id);
    if (error) {
      handleSupabaseError(error, 'deleteEvent');
      return;
    }
    setEvents(prev => prev.filter(e => e.id !== eventId));
    showToast('Evento eliminado', 'info');
  };

  // --- Sales ---
  const addSale = async (sale: Sale) => {
    if (!user) { showToast('No hay sesión activa', 'error'); return; }
    const { notes, ...rest } = sale as any;
    const payload = { ...rest, notas: rest.notas ?? notes ?? '', user_id: user.id };
    const { data, error } = await supabase.from('sales').insert(payload).select();
    if (error || !data) {
      handleSupabaseError(error, 'addSale');
      return;
    }
    const inserted = data[0] as Sale;
    setSales(prev => [inserted, ...prev]);
    if (inserted.estado === 'vendida') {
      await supabase.from('properties').update({ status: 'vendida' }).eq('id', inserted.propiedadId).eq('user_id', user.id);
      setProperties(prev => prev.map(p => p.id === inserted.propiedadId ? { ...p, status: 'vendida' } : p));
    }
    handleSaleStatusChange(inserted);
    addActivityLog({ type: 'sale', action: 'created', title: `Venta registrada: ${inserted.nombre || inserted.id}`, entityId: inserted.id });
    showToast('Operación de venta registrada', 'success');
  };

  const updateSale = async (sale: Sale) => {
    if (!user) { showToast('No hay sesión activa', 'error'); return; }
    const { notes, ...rest } = sale as any;
    const payload = { ...rest, notas: rest.notas ?? notes ?? '' };
    const { error } = await supabase.from('sales').update(payload).eq('id', sale.id).eq('user_id', user.id);
    if (error) {
      handleSupabaseError(error, 'updateSale');
      return;
    }
    setSales(prev => prev.map(s => s.id === sale.id ? sale : s));
    if (sale.estado === 'vendida') {
      await supabase.from('properties').update({ status: 'vendida' }).eq('id', sale.propiedadId).eq('user_id', user.id);
      setProperties(prev => prev.map(p => p.id === sale.propiedadId ? { ...p, status: 'vendida' } : p));
    }
    handleSaleStatusChange(sale);
    addActivityLog({ type: 'sale', action: 'updated', title: `Venta actualizada: ${sale.nombre || sale.id}`, entityId: sale.id });
    showToast('Venta actualizada', 'success');
  };

  const deleteSale = async (saleId: string) => {
    if (!user) { showToast('No hay sesión activa', 'error'); return; }
    const { error } = await supabase.from('sales').delete().eq('id', saleId).eq('user_id', user.id);
    if (error) {
      handleSupabaseError(error, 'deleteSale');
      return;
    }
    setSales(prev => prev.filter(s => s.id !== saleId));
    showToast('Venta eliminada', 'info');
  };

  // --- Rentals ---
  const addRental = async (rental: Rental) => {
    if (!user) { showToast('No hay sesión activa', 'error'); return; }
    const { data, error } = await supabase.from('rentals').insert({ ...rental, user_id: user.id }).select();
    if (error || !data) {
      handleSupabaseError(error, 'addRental');
      return;
    }
    const inserted = data[0] as Rental;
    setRentals(prev => [inserted, ...prev]);
    if (inserted.estado === 'firmado' || inserted.estado === 'en curso') {
      await supabase.from('properties').update({ status: 'alquilada' }).eq('id', inserted.propiedadId).eq('user_id', user.id);
      setProperties(prev => prev.map(p => p.id === inserted.propiedadId && p.status !== 'vendida' ? { ...p, status: 'alquilada' } : p));
    }
    handleRentalStatusChange(inserted);
    addActivityLog({ type: 'rental', action: 'created', title: `Alquiler registrado: ${inserted.id}`, entityId: inserted.id });
    showToast('Operación de alquiler registrada', 'success');
  };

  const updateRental = async (rental: Rental) => {
    if (!user) { showToast('No hay sesión activa', 'error'); return; }
    const { error } = await supabase.from('rentals').update(rental).eq('id', rental.id).eq('user_id', user.id);
    if (error) {
      handleSupabaseError(error, 'updateRental');
      return;
    }
    setRentals(prev => prev.map(r => r.id === rental.id ? rental : r));
    if (rental.estado === 'firmado' || rental.estado === 'en curso') {
      await supabase.from('properties').update({ status: 'alquilada' }).eq('id', rental.propiedadId).eq('user_id', user.id);
      setProperties(prev => prev.map(p => p.id === rental.propiedadId && p.status !== 'vendida' ? { ...p, status: 'alquilada' } : p));
    }
    handleRentalStatusChange(rental);
    addActivityLog({ type: 'rental', action: 'updated', title: `Alquiler actualizado: ${rental.id}`, entityId: rental.id });
    showToast('Alquiler actualizado', 'success');
  };

  const deleteRental = async (rentalId: string) => {
    if (!user) { showToast('No hay sesión activa', 'error'); return; }
    const { error } = await supabase.from('rentals').delete().eq('id', rentalId).eq('user_id', user.id);
    if (error) {
      handleSupabaseError(error, 'deleteRental');
      return;
    }
    setRentals(prev => prev.filter(r => r.id !== rentalId));
    showToast('Alquiler eliminado', 'info');
  };

  // --- Documents ---
  const addDocument = async (doc: Document) => {
    if (!user) { showToast('No hay sesión activa', 'error'); return; }
    const { data, error } = await supabase.from('documents').insert({ ...doc, user_id: user.id }).select();
    if (error || !data) {
      handleSupabaseError(error, 'addDocument');
      return;
    }
    const inserted = data[0] as Document;
    setDocuments(prev => [inserted, ...prev]);
    addActivityLog({ type: 'document', action: 'created', title: `Documento añadido: ${inserted.name}`, entityId: inserted.id });
    showToast('Documento añadido', 'success');
  };

  const updateDocument = async (doc: Document) => {
    if (!user) { showToast('No hay sesión activa', 'error'); return; }
    const { error } = await supabase.from('documents').update(doc).eq('id', doc.id).eq('user_id', user.id);
    if (error) {
      handleSupabaseError(error, 'updateDocument');
      return;
    }
    setDocuments(prev => prev.map(d => d.id === doc.id ? doc : d));
    addActivityLog({ type: 'document', action: 'updated', title: `Documento actualizado: ${doc.name}`, entityId: doc.id });
    showToast('Documento actualizado', 'success');
  };

  const deleteDocument = async (docId: string) => {
    if (!user) { showToast('No hay sesión activa', 'error'); return; }
    const { error } = await supabase.from('documents').delete().eq('id', docId).eq('user_id', user.id);
    if (error) {
      handleSupabaseError(error, 'deleteDocument');
      return;
    }
    setDocuments(prev => prev.filter(d => d.id !== docId));
    showToast('Documento eliminado', 'info');
  };

  // --- Waiting Room ---
  const addWaitingRoomEntry = async (entry: WaitingRoomEntry) => {
    if (!user) { showToast('No hay sesión activa', 'error'); return; }
    const { data, error } = await supabase.from('waiting_room').insert({ ...entry, user_id: user.id }).select();
    if (error || !data) {
      handleSupabaseError(error, 'addWaitingRoomEntry');
      return;
    }
    const inserted = data[0] as WaitingRoomEntry;
    setWaitingRoom(prev => [inserted, ...prev]);
    addActivityLog({ type: 'waiting_room', action: 'created', title: `Sala de espera: ${inserted.nombre}`, entityId: inserted.id });
    showToast('Entrada añadida a Sala de Espera', 'success');
  };

  const updateWaitingRoomEntry = async (entry: WaitingRoomEntry) => {
    if (!user) { showToast('No hay sesión activa', 'error'); return; }
    const { error } = await supabase.from('waiting_room').update(entry).eq('id', entry.id).eq('user_id', user.id);
    if (error) {
      handleSupabaseError(error, 'updateWaitingRoomEntry');
      return;
    }
    setWaitingRoom(prev => prev.map(e => e.id === entry.id ? entry : e));
    addActivityLog({ type: 'waiting_room', action: 'updated', title: `Sala de espera actualizada: ${entry.nombre}`, entityId: entry.id });
    showToast('Entrada actualizada', 'success');
  };

  const deleteWaitingRoomEntry = async (entryId: string) => {
    if (!user) { showToast('No hay sesión activa', 'error'); return; }
    const { error } = await supabase.from('waiting_room').delete().eq('id', entryId).eq('user_id', user.id);
    if (error) {
      handleSupabaseError(error, 'deleteWaitingRoomEntry');
      return;
    }
    setWaitingRoom(prev => prev.filter(e => e.id !== entryId));
    showToast('Entrada eliminada', 'info');
  };

  // --- Buyers ---
  const addBuyer = async (buyer: Buyer) => {
    if (!user) { showToast('No hay sesión activa', 'error'); return; }
    const { createdAt, ...rest } = buyer;
    const { data, error } = await supabase.from('buyers').insert({ ...rest, user_id: user.id }).select();
    if (error || !data) {
      handleSupabaseError(error, 'addBuyer');
      return;
    }
    const inserted = data[0] as Buyer;
    setBuyers(prev => [inserted, ...prev]);
    addActivityLog({ type: 'buyer', action: 'created', title: `Comprador añadido: ${inserted.nombre}`, entityId: inserted.id });
    showToast('Comprador añadido', 'success');
  };

  const updateBuyer = async (buyer: Buyer) => {
    if (!user) { showToast('No hay sesión activa', 'error'); return; }
    const { error } = await supabase.from('buyers').update(buyer).eq('id', buyer.id).eq('user_id', user.id);
    if (error) {
      handleSupabaseError(error, 'updateBuyer');
      return;
    }
    setBuyers(prev => prev.map(b => b.id === buyer.id ? buyer : b));
    addActivityLog({ type: 'buyer', action: 'updated', title: `Comprador actualizado: ${buyer.nombre}`, entityId: buyer.id });
    showToast('Comprador actualizado', 'success');
  };

  const deleteBuyer = async (buyerId: string) => {
    if (!user) { showToast('No hay sesión activa', 'error'); return; }
    const { error } = await supabase.from('buyers').delete().eq('id', buyerId).eq('user_id', user.id);
    if (error) {
      handleSupabaseError(error, 'deleteBuyer');
      return;
    }
    setBuyers(prev => prev.filter(b => b.id !== buyerId));
    showToast('Comprador eliminado', 'info');
  };

  // --- Referred Colleagues ---
  const addReferredColleague = async (colleague: ReferredColleague) => {
    if (!user) { showToast('No hay sesión activa', 'error'); return; }
    const { data, error } = await supabase.from('referred_colleagues').insert({ ...colleague, user_id: user.id }).select();
    if (error || !data) {
      handleSupabaseError(error, 'addReferredColleague');
      return;
    }
    const inserted = data[0] as ReferredColleague;
    setReferredColleagues(prev => [inserted, ...prev]);
    addActivityLog({ type: 'colleague', action: 'created', title: `Colega añadido: ${inserted.nombreApellido}`, entityId: inserted.id });
    showToast('Colega referido añadido', 'success');
  };

  const updateReferredColleague = async (colleague: ReferredColleague) => {
    if (!user) { showToast('No hay sesión activa', 'error'); return; }
    const { error } = await supabase.from('referred_colleagues').update(colleague).eq('id', colleague.id).eq('user_id', user.id);
    if (error) {
      handleSupabaseError(error, 'updateReferredColleague');
      return;
    }
    setReferredColleagues(prev => prev.map(c => c.id === colleague.id ? colleague : c));
    addActivityLog({ type: 'colleague', action: 'updated', title: `Colega actualizado: ${colleague.nombreApellido}`, entityId: colleague.id });
    showToast('Colega actualizado', 'success');
  };

  const deleteReferredColleague = async (colleagueId: string) => {
    if (!user) { showToast('No hay sesión activa', 'error'); return; }
    const { error } = await supabase.from('referred_colleagues').delete().eq('id', colleagueId).eq('user_id', user.id);
    if (error) {
      handleSupabaseError(error, 'deleteReferredColleague');
      return;
    }
    setReferredColleagues(prev => prev.filter(c => c.id !== colleagueId));
    showToast('Colega eliminado', 'info');
  };

  const updateProfile = async (newProfile: Profile) => {
    if (!user) { showToast('No hay sesión activa', 'error'); return; }
    const payload = {
      user_id: user.id,
      name: newProfile.name,
      email: newProfile.email,
      phone: newProfile.phone,
      license: newProfile.license,
      templateProperty: newProfile.templateProperty,
      templateClient: newProfile.templateClient,
      templateBuyer: newProfile.templateBuyer,
      role: newProfile.role ?? 'agent',
      must_change_password: newProfile.must_change_password ?? false,
    };
    const { error } = await supabase.from('profiles').upsert(payload);
    if (error) {
      handleSupabaseError(error, 'updateProfile');
      return;
    }
    setProfile(newProfile);
    showToast('Perfil guardado correctamente', 'success');
  };

  // --- Utilities ---
  const resetData = () => {
    clearAllState();
    if (user) {
      loadAllFromSupabase(user.id);
    }
  };

  const clearMockData = () => {
    // No-op en cloud-first: no existen datos mock locales
    showToast('No hay datos locales para limpiar', 'info');
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
    a.download = `estatecrm-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Copia de seguridad descargada', 'success');
  };

  const importData = async (jsonData: string): Promise<boolean> => {
    try {
      const data = JSON.parse(jsonData);
      const hasData = data && typeof data === 'object' && (
        Array.isArray(data.clients) ||
        Array.isArray(data.properties) ||
        Array.isArray(data.tasks) ||
        Array.isArray(data.events) ||
        Array.isArray(data.sales) ||
        Array.isArray(data.documents)
      );
      if (!hasData) {
        showToast('El archivo no tiene la estructura esperada de un backup de EstateCRM.', 'error');
        return false;
      }
      if (!window.confirm('¿Estás seguro de importar este backup? Se reemplazarán todos los datos actuales.')) {
        return false;
      }

      // Cloud-first: si hay sesión, subir todo a Supabase y recargar
      if (user) {
        const upsertMany = async (table: string, items: object[]) => {
          if (!items.length) return;
          const dbItems = items.map(item => {
            const { createdAt, ...rest } = item as Record<string, unknown>;
            return { ...rest, user_id: user.id };
          });
          await supabase.from(table).upsert(dbItems, { onConflict: 'id' });
        };

        await Promise.all([
          upsertMany('clients', data.clients ?? []),
          upsertMany('properties', data.properties ?? []),
          upsertMany('tasks', data.tasks ?? []),
          upsertMany('events', data.events ?? []),
          upsertMany('sales', data.sales ?? []),
          upsertMany('rentals', data.rentals ?? []),
          upsertMany('documents', data.documents ?? []),
          upsertMany('waiting_room', data.waitingRoom ?? []),
          upsertMany('buyers', data.buyers ?? []),
          upsertMany('referred_colleagues', data.referredColleagues ?? []),
          upsertMany('activity_logs', data.activityLogs ?? []),
        ]);

        await loadAllFromSupabase(user.id);
        showToast('Backup importado y sincronizado con la nube', 'success');
        return true;
      }

      // Fallback offline
      if (data.clients) setClients(data.clients);
      if (data.properties) setProperties(data.properties);
      if (data.tasks) setTasks(data.tasks.map((t: Task) => ({ ...t, relatedEntities: t.relatedEntities ?? [] })));
      if (data.events) setEvents(data.events);
      if (data.sales) setSales(data.sales.map((s: Sale) => ({
        ...s,
        operationStatus: s.operationStatus || 'activa',
        isCollected: s.isCollected ?? false,
        montoEscritura: typeof s.montoEscritura === 'number' ? String(s.montoEscritura) : s.montoEscritura,
      })));
      if (data.rentals) setRentals(data.rentals);
      if (data.documents) setDocuments(data.documents);
      if (data.waitingRoom) setWaitingRoom(data.waitingRoom);
      if (data.buyers) setBuyers(data.buyers);
      if (data.referredColleagues) {
        setReferredColleagues(data.referredColleagues.map((c: ReferredColleague) => ({
          ...c,
          referredClientIds: c.referredClientIds ?? [],
        })));
      }
      if (data.activityLogs) setActivityLogs(data.activityLogs);
      showToast('Datos importados localmente (sin sesión activa)', 'warning');
      return true;
    } catch (e) {
      console.error('[EstateCRM] Import error:', e);
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
      profile,
      user,
      session,
      isCloudReady,
      signOut,
      updateProfile,
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
      clearMockData,
      addActivityLog,
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
