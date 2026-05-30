import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
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

export interface Profile {
  user_id?: string;
  name: string;
  email: string;
  phone: string;
  license: string;
  templateProperty: string;
  templateClient: string;
  templateBuyer: string;
  role?: 'agent' | 'superadmin';
  must_change_password?: boolean;
}

interface AppContextType {
  profile: Profile;
  updateProfile: (profile: Profile) => void;
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
  user: any;
  session: any;
  isCloudReady: boolean;
  syncLocalToCloud: () => Promise<void>;
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
  addWaitingRoomEntry: (entry: WaitingRoomEntry) => void;
  updateWaitingRoomEntry: (entry: WaitingRoomEntry) => void;
  deleteWaitingRoomEntry: (entryId: string) => void;
  addBuyer: (buyer: Buyer) => void;
  updateBuyer: (buyer: Buyer) => void;
  deleteBuyer: (buyerId: string) => void;
  addReferredColleague: (colleague: ReferredColleague) => Promise<void>;
  updateReferredColleague: (colleague: ReferredColleague) => Promise<void>;
  deleteReferredColleague: (colleagueId: string) => Promise<void>;
  resetData: () => void;
  exportData: () => void;
  importData: (jsonData: string) => boolean;
  addActivityLog: (log: Omit<ActivityLog, 'id' | 'createdAt'>) => void;
}

const STORAGE_KEYS = {
  CLIENTS: 'estatecrm_clients',
  PROPERTIES: 'estatecrm_properties',
  TASKS: 'estatecrm_tasks',
  EVENTS: 'estatecrm_events',
  SALES: 'estatecrm_sales',
  RENTALS: 'estatecrm_rentals',
  DOCUMENTS: 'estatecrm_documents',
  WAITING_ROOM: 'estatecrm_waiting_room',
  BUYERS: 'estatecrm_buyers',
  REFERRED_COLLEAGUES: 'estatecrm_referred_colleagues',
  ACTIVITY_LOGS: 'estatecrm_activity_logs',
  PROFILE: 'estatecrm_profile'
};

// ---- Mock ID filter ----
const MOCK_IDS = new Set([
  ...MOCK_CLIENTS.map(c => c.id),
  ...MOCK_PROPERTIES.map(p => p.id),
  ...MOCK_EVENTS.map(e => e.id),
  ...MOCK_TASKS.map(t => t.id),
  ...MOCK_SALES.map(s => s.id),
  ...MOCK_RENTALS.map(r => r.id),
  ...MOCK_DOCUMENTS.map(d => d.id),
]);

function isMockId(id: string): boolean {
  return MOCK_IDS.has(id);
}

// ---- Supabase helpers ----
function cleanForSupabase(obj: object, userId: string): Record<string, unknown> {
  const cleaned: Record<string, unknown> = { user_id: userId };
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

function handleSupabaseError(error: { message?: string }, label: string, showToastFn: (m: string, t: ToastType) => void) {
  console.error(`[EstateCRM Supabase] ${label}:`, error);
  const msg = error?.message || 'Error desconocido';
  showToastFn(`${label}: ${msg}`, 'error');
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // ---- Auth state ----
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [isCloudReady, setIsCloudReady] = useState(false);

  // ---- Entity state (initialized from localStorage or mock) ----
  const [clients, setClients] = useState<Client[]>(() => loadFromStorage(STORAGE_KEYS.CLIENTS, MOCK_CLIENTS));
  const [properties, setProperties] = useState<Property[]>(() => loadFromStorage(STORAGE_KEYS.PROPERTIES, MOCK_PROPERTIES));
  const [events, setEvents] = useState<CalendarEvent[]>(() => loadFromStorage(STORAGE_KEYS.EVENTS, MOCK_EVENTS));
  const [tasks, setTasks] = useState<Task[]>(() => {
    const loaded = loadFromStorage<Task[]>(STORAGE_KEYS.TASKS, MOCK_TASKS);
    return loaded.map(t => ({
      ...t,
      relatedEntities: t.relatedEntities ?? []
    }));
  });
  const [sales, setSales] = useState<Sale[]>(() => {
    const loaded = loadFromStorage<Sale[]>(STORAGE_KEYS.SALES, MOCK_SALES);
    return loaded.map(s => ({
      ...s,
      operationStatus: s.operationStatus || 'activa',
      isCollected: s.isCollected ?? false,
      montoEscritura: typeof s.montoEscritura === 'number' ? String(s.montoEscritura) : s.montoEscritura
    }));
  });
  const [rentals, setRentals] = useState<Rental[]>(() => loadFromStorage(STORAGE_KEYS.RENTALS, MOCK_RENTALS));
  const [documents, setDocuments] = useState<Document[]>(() => loadFromStorage(STORAGE_KEYS.DOCUMENTS, MOCK_DOCUMENTS));
  const [waitingRoom, setWaitingRoom] = useState<WaitingRoomEntry[]>(() => loadFromStorage(STORAGE_KEYS.WAITING_ROOM, []));
  const [buyers, setBuyers] = useState<Buyer[]>(() => loadFromStorage(STORAGE_KEYS.BUYERS, []));
  const [referredColleagues, setReferredColleagues] = useState<ReferredColleague[]>(() => loadFromStorage(STORAGE_KEYS.REFERRED_COLLEAGUES, []));
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => loadFromStorage(STORAGE_KEYS.ACTIVITY_LOGS, []));
  const [profile, setProfile] = useState<Profile>(() => loadFromStorage<Profile>(STORAGE_KEYS.PROFILE, {
    name: 'Martín Agente',
    email: 'agente@estatecrm.app',
    phone: '+54 9 11 1234 5678',
    license: 'CUCICBA 12345',
    templateProperty: '¡Hola! Te comparto la información de esta propiedad que puede interesarte:\n\n🏠 *{title}*\n📍 Ubicación: {address}, {zone}\n💰 Precio: {price}\n🔗 {link}\n\nQuedo a tu disposición por cualquier consulta.',
    templateClient: 'Hola {name}, ¿cómo estás?\n\nTe escribe {agentName}. Quedo a tu disposición por cualquier consulta.',
    templateBuyer: 'Hola {name}, ¿cómo estás?\n\nTe escribe {agentName}. Quedo a tu disposición por cualquier consulta.'
  }));
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: ToastType) => setToast({ message, type }), []);

  // ---- Auth listener ----
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsCloudReady(false);
    showToast('Sesión cerrada', 'info');
  }, [showToast]);

  // ---- Load from Supabase when authenticated ----
  const loadAllFromSupabase = useCallback(async () => {
    if (!user) return;
    try {
      const [clientsRes, propertiesRes, eventsRes, tasksRes, salesRes, colleaguesRes, logsRes, profileRes] = await Promise.all([
        supabase.from('clients').select('*').eq('user_id', user.id),
        supabase.from('properties').select('*').eq('user_id', user.id),
        supabase.from('events').select('*').eq('user_id', user.id),
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('sales').select('*').eq('user_id', user.id),
        supabase.from('referred_colleagues').select('*').eq('user_id', user.id),
        supabase.from('activity_logs').select('*').eq('user_id', user.id).order('createdAt', { ascending: false }).limit(200),
        supabase.from('profiles').select('*').eq('user_id', user.id).limit(1)
      ]);

      if (clientsRes.data) setClients(clientsRes.data as Client[]);
      if (propertiesRes.data) setProperties(propertiesRes.data as Property[]);
      if (eventsRes.data) setEvents(eventsRes.data as CalendarEvent[]);
      if (tasksRes.data) setTasks((tasksRes.data as Task[]).map(t => ({ ...t, relatedEntities: t.relatedEntities ?? [] })));
      if (salesRes.data) {
        setSales((salesRes.data as Sale[]).map(s => ({
          ...s,
          operationStatus: s.operationStatus || 'activa',
          isCollected: s.isCollected ?? false,
          montoEscritura: typeof s.montoEscritura === 'number' ? String(s.montoEscritura) : s.montoEscritura
        })));
      }
      if (colleaguesRes.data) setReferredColleagues((colleaguesRes.data as ReferredColleague[]).map(c => ({ ...c, referredClientIds: c.referredClientIds ?? [] })));
      if (logsRes.data) setActivityLogs(logsRes.data as ActivityLog[]);
      if (profileRes.data && profileRes.data.length > 0) {
        const p = profileRes.data[0] as any;
        setProfile({
          user_id: p.user_id ?? user.id,
          name: p.name ?? profile.name,
          email: p.email ?? profile.email,
          phone: p.phone ?? profile.phone,
          license: p.license ?? profile.license,
          templateProperty: p.templateProperty ?? profile.templateProperty,
          templateClient: p.templateClient ?? profile.templateClient,
          templateBuyer: p.templateBuyer ?? profile.templateBuyer,
          role: p.role ?? 'agent',
          must_change_password: p.must_change_password ?? false,
        });
      }
      setIsCloudReady(true);
    } catch (e) {
      console.error('[EstateCRM] Error loading from Supabase:', e);
      setIsCloudReady(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadAllFromSupabase();
    } else {
      setIsCloudReady(false);
    }
  }, [user, loadAllFromSupabase]);

  // ---- Sync local to cloud ----
  const syncLocalToCloud = useCallback(async () => {
    if (!user) {
      showToast('Debes iniciar sesión para sincronizar', 'warning');
      return;
    }
    const syncedFlag = 'estatecrm_cloud_synced';
    if (localStorage.getItem(syncedFlag)) return;

    const localClients = loadFromStorage<Client[]>(STORAGE_KEYS.CLIENTS, []).filter(c => !isMockId(c.id));
    const localProperties = loadFromStorage<Property[]>(STORAGE_KEYS.PROPERTIES, []).filter(p => !isMockId(p.id));
    const localEvents = loadFromStorage<CalendarEvent[]>(STORAGE_KEYS.EVENTS, []).filter(e => !isMockId(e.id));
    const localTasks = loadFromStorage<Task[]>(STORAGE_KEYS.TASKS, []).filter(t => !isMockId(t.id));
    const localSales = loadFromStorage<Sale[]>(STORAGE_KEYS.SALES, []).filter(s => !isMockId(s.id));
    const localColleagues = loadFromStorage<ReferredColleague[]>(STORAGE_KEYS.REFERRED_COLLEAGUES, []).filter(c => !isMockId(c.id));
    const localLogs = loadFromStorage<ActivityLog[]>(STORAGE_KEYS.ACTIVITY_LOGS, []).filter(l => !isMockId(l.id));

    try {
      if (localClients.length) await supabase.from('clients').upsert(localClients.map(c => cleanForSupabase(c, user.id)));
      if (localProperties.length) await supabase.from('properties').upsert(localProperties.map(p => cleanForSupabase(p, user.id)));
      if (localEvents.length) await supabase.from('events').upsert(localEvents.map(e => cleanForSupabase(e, user.id)));
      if (localTasks.length) await supabase.from('tasks').upsert(localTasks.map(t => cleanForSupabase(t, user.id)));
      if (localSales.length) await supabase.from('sales').upsert(localSales.map(s => cleanForSupabase(s, user.id)));
      if (localColleagues.length) await supabase.from('referred_colleagues').upsert(localColleagues.map(c => cleanForSupabase(c, user.id)));
      if (localLogs.length) await supabase.from('activity_logs').upsert(localLogs.map(l => cleanForSupabase(l, user.id)));

      // Sync profile if it's not the default mock profile
      const localProfile = loadFromStorage<Profile>(STORAGE_KEYS.PROFILE, { name: '', email: '', phone: '', license: '', templateProperty: '', templateClient: '', templateBuyer: '' });
      if (localProfile.name && localProfile.name !== 'Martín Agente') {
        await supabase.from('profiles').upsert({ user_id: user.id, name: localProfile.name, email: localProfile.email, phone: localProfile.phone, license: localProfile.license, templateProperty: localProfile.templateProperty, templateClient: localProfile.templateClient, templateBuyer: localProfile.templateBuyer });
      }

      localStorage.setItem(syncedFlag, 'true');
      showToast('Datos migrados a la nube correctamente', 'success');
      await loadAllFromSupabase();
    } catch (e) {
      console.error('[EstateCRM] Sync error:', e);
      showToast('Error al migrar datos a la nube', 'error');
    }
  }, [user, showToast, loadAllFromSupabase]);

  // Auto-trigger sync on first auth
  useEffect(() => {
    if (user && !isCloudReady) {
      const t = setTimeout(() => syncLocalToCloud(), 500);
      return () => clearTimeout(t);
    }
  }, [user, isCloudReady, syncLocalToCloud]);


  // --- Super-Migración: Recuperar datos de immoflow_ a estatecrm_ ---
  useEffect(() => {
    const migrationFlag = 'estatecrm_super_migration_v1_done';
    if (localStorage.getItem(migrationFlag)) return;

    const isEmptyOrMock = (newValue: string | null, mockValue: unknown): boolean => {
      if (!newValue || newValue === '' || newValue === '[]' || newValue === '{}') return true;
      try {
        return JSON.stringify(JSON.parse(newValue)) === JSON.stringify(mockValue);
      } catch {
        return false;
      }
    };

    const defaultProfile = {
      name: 'Martín Agente',
      email: 'agente@estatecrm.app',
      phone: '+54 9 11 1234 5678',
      license: 'CUCICBA 12345',
      templateProperty: '¡Hola! Te comparto la información de esta propiedad que puede interesarte:\n\n🏠 *{title}*\n📍 Ubicación: {address}, {zone}\n💰 Precio: {price}\n🔗 {link}\n\nQuedo a tu disposición por cualquier consulta.',
      templateClient: 'Hola {name}, ¿cómo estás?\n\nTe escribe {agentName}. Quedo a tu disposición por cualquier consulta.',
      templateBuyer: 'Hola {name}, ¿cómo estás?\n\nTe escribe {agentName}. Quedo a tu disposición por cualquier consulta.'
    };

    const migrations = [
      {
        oldKey: 'immoflow_clients',
        newKey: STORAGE_KEYS.CLIENTS,
        setter: setClients,
        mock: MOCK_CLIENTS,
        transform: (d: Client[]) => d
      },
      {
        oldKey: 'immoflow_properties',
        newKey: STORAGE_KEYS.PROPERTIES,
        setter: setProperties,
        mock: MOCK_PROPERTIES,
        transform: (d: Property[]) => d
      },
      {
        oldKey: 'immoflow_events',
        newKey: STORAGE_KEYS.EVENTS,
        setter: setEvents,
        mock: MOCK_EVENTS,
        transform: (d: CalendarEvent[]) => d
      },
      {
        oldKey: 'immoflow_tasks',
        newKey: STORAGE_KEYS.TASKS,
        setter: setTasks,
        mock: MOCK_TASKS,
        transform: (d: Task[]) => d.map(t => ({ ...t, relatedEntities: t.relatedEntities ?? [] }))
      },
      {
        oldKey: 'immoflow_sales',
        newKey: STORAGE_KEYS.SALES,
        setter: setSales,
        mock: MOCK_SALES,
        transform: (d: Sale[]) => d.map(s => ({
          ...s,
          operationStatus: s.operationStatus || 'activa',
          isCollected: s.isCollected ?? false,
          montoEscritura: typeof s.montoEscritura === 'number' ? String(s.montoEscritura) : s.montoEscritura
        }))
      },
      {
        oldKey: 'immoflow_rentals',
        newKey: STORAGE_KEYS.RENTALS,
        setter: setRentals,
        mock: MOCK_RENTALS,
        transform: (d: Rental[]) => d
      },
      {
        oldKey: 'immoflow_documents',
        newKey: STORAGE_KEYS.DOCUMENTS,
        setter: setDocuments,
        mock: MOCK_DOCUMENTS,
        transform: (d: Document[]) => d
      },
      {
        oldKey: 'immoflow_waiting_room',
        newKey: STORAGE_KEYS.WAITING_ROOM,
        setter: setWaitingRoom,
        mock: [] as WaitingRoomEntry[],
        transform: (d: WaitingRoomEntry[]) => d
      },
      {
        oldKey: 'immoflow_buyers',
        newKey: STORAGE_KEYS.BUYERS,
        setter: setBuyers,
        mock: [] as Buyer[],
        transform: (d: Buyer[]) => d
      },
      {
        oldKey: 'immoflow_referred_colleagues',
        newKey: STORAGE_KEYS.REFERRED_COLLEAGUES,
        setter: setReferredColleagues,
        mock: [] as ReferredColleague[],
        transform: (d: ReferredColleague[]) => d.map(c => ({ ...c, referredClientIds: c.referredClientIds ?? [] }))
      },
      {
        oldKey: 'immoflow_activity_logs',
        newKey: STORAGE_KEYS.ACTIVITY_LOGS,
        setter: setActivityLogs,
        mock: [] as ActivityLog[],
        transform: (d: ActivityLog[]) => d
      },
      {
        oldKey: 'immoflow_profile',
        newKey: STORAGE_KEYS.PROFILE,
        setter: setProfile,
        mock: defaultProfile,
        transform: (d: Partial<Profile>) => ({ ...defaultProfile, ...d })
      }
    ];

    let migratedAny = false;

    for (const mig of migrations) {
      const oldValue = localStorage.getItem(mig.oldKey);
      const newValue = localStorage.getItem(mig.newKey);

      if (oldValue && isEmptyOrMock(newValue, mig.mock)) {
        try {
          const parsed = JSON.parse(oldValue);
          const transformed = mig.transform(parsed);

          localStorage.setItem(mig.newKey, JSON.stringify(transformed));
          mig.setter(transformed);

          const count = Array.isArray(transformed) ? transformed.length : 'perfil';
          console.log(`MIGRACIÓN: Recuperando ${mig.oldKey}... → ${mig.newKey} (${count} items)`);
          migratedAny = true;
        } catch (e) {
          console.error(`MIGRACIÓN ERROR: Falló al migrar ${mig.oldKey}`, e);
        }
      }
    }

    if (migratedAny) {
      localStorage.setItem(migrationFlag, 'true');
      console.log('MIGRACIÓN: Datos recuperados exitosamente. Recargando para sincronizar estados...');
      window.location.reload();
    } else {
      localStorage.setItem(migrationFlag, 'true');
      console.log('MIGRACIÓN: No se encontraron datos antiguos de ImmoFlow para recuperar.');
    }
  }, []);

  // Activity Log helper
  const addActivityLog = useCallback((log: Omit<ActivityLog, 'id' | 'createdAt'>) => {
    const newLog: ActivityLog = {
      ...log,
      id: generateId('log'),
      createdAt: new Date().toISOString()
    };
    setActivityLogs(prev => [newLog, ...prev].slice(0, 200));
    if (user) {
      supabase.from('activity_logs').insert(cleanForSupabase(newLog, user.id)).then(({ error }) => {
        if (error) console.error('[EstateCRM] Activity log insert error:', error);
      });
    }
  }, [user]);

  // Persistence Effects (localStorage cache always works as fallback)
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
  useEffect(() => { saveToStorage(STORAGE_KEYS.PROFILE, profile); }, [profile]);

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
  const addClient = async (client: Client) => {
    let inserted: Client = client;
    if (user) {
      const { data, error } = await supabase.from('clients').insert(cleanForSupabase(client, user.id)).select();
      if (error) {
        handleSupabaseError(error, 'addClient', showToast);
        return;
      }
      if (data && data.length > 0) {
        inserted = data[0] as Client;
      }
    }
    setClients(prev => [inserted, ...prev]);
    addActivityLog({ type: 'client', action: 'created', title: `Cliente creado: ${inserted.name}`, entityId: inserted.id });
    showToast('Cliente creado con éxito', 'success');
  };
  const updateClient = async (client: Client) => {
    if (user) {
      const { error } = await supabase.from('clients').update(cleanForSupabase(client, user.id)).eq('id', client.id).eq('user_id', user.id);
      if (error) handleSupabaseError(error, 'updateClient', showToast);
    }
    setClients(prev => prev.map(c => c.id === client.id ? client : c));
    addActivityLog({ type: 'client', action: 'updated', title: `Cliente actualizado: ${client.name}`, entityId: client.id });
    showToast('Cliente actualizado', 'success');
  };

  // --- Properties ---
  const addProperty = async (property: Property) => {
    let inserted: Property = property;
    if (user) {
      const { data, error } = await supabase.from('properties').insert(cleanForSupabase(property, user.id)).select();
      if (error) {
        handleSupabaseError(error, 'addProperty', showToast);
        return;
      }
      if (data && data.length > 0) {
        inserted = data[0] as Property;
      }
    }
    setProperties(prev => [inserted, ...prev]);
    addActivityLog({ type: 'property', action: 'created', title: `Propiedad creada: ${inserted.title}`, entityId: inserted.id });
    showToast('Propiedad añadida', 'success');
  };
  const updateProperty = async (property: Property) => {
    if (user) {
      const { error } = await supabase.from('properties').update(cleanForSupabase(property, user.id)).eq('id', property.id).eq('user_id', user.id);
      if (error) handleSupabaseError(error, 'updateProperty', showToast);
    }
    setProperties(prev => prev.map(p => p.id === property.id ? property : p));
    addActivityLog({ type: 'property', action: 'updated', title: `Propiedad actualizada: ${property.title}`, entityId: property.id });
    showToast('Propiedad actualizada', 'success');
  };

  // --- Tasks ---
  const addTask = async (task: Task) => {
    let inserted: Task = task;
    if (user) {
      const { data, error } = await supabase.from('tasks').insert(cleanForSupabase(task, user.id)).select();
      if (error) {
        handleSupabaseError(error, 'addTask', showToast);
        return;
      }
      if (data && data.length > 0) {
        inserted = data[0] as Task;
      }
    }
    setTasks(prev => [inserted, ...prev]);
    addActivityLog({ type: 'task', action: 'created', title: `Tarea creada: ${inserted.title}`, entityId: inserted.id });
    showToast('Tarea creada', 'success');
  };
  const updateTask = async (task: Task) => {
    if (user) {
      const { error } = await supabase.from('tasks').update(cleanForSupabase(task, user.id)).eq('id', task.id).eq('user_id', user.id);
      if (error) handleSupabaseError(error, 'updateTask', showToast);
    }
    setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    addActivityLog({ type: 'task', action: 'updated', title: `Tarea actualizada: ${task.title}`, entityId: task.id });
    showToast('Tarea actualizada', 'success');
  };
  const completeTask = async (taskId: string) => {
    if (user) {
      const { error } = await supabase.from('tasks').update({ status: 'completada' }).eq('id', taskId).eq('user_id', user.id);
      if (error) handleSupabaseError(error, 'completeTask', showToast);
    }
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completada' } : t));
    showToast('Tarea completada ✔️', 'success');
  };
  const deleteTask = async (taskId: string) => {
    if (user) {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId).eq('user_id', user.id);
      if (error) handleSupabaseError(error, 'deleteTask', showToast);
    }
    setTasks(prev => prev.filter(t => t.id !== taskId));
    showToast('Tarea eliminada', 'info');
  };

  // --- Events ---
  const addEvent = async (event: CalendarEvent) => {
    let inserted: CalendarEvent = event;
    if (user) {
      const { data, error } = await supabase.from('events').insert(cleanForSupabase(event, user.id)).select();
      if (error) {
        handleSupabaseError(error, 'addEvent', showToast);
        return;
      }
      if (data && data.length > 0) {
        inserted = data[0] as CalendarEvent;
      }
    }
    setEvents(prev => [inserted, ...prev]);
    addActivityLog({ type: 'event', action: 'created', title: `Evento creado: ${inserted.title}`, entityId: inserted.id });
    showToast('Evento agendado', 'success');
  };
  const updateEvent = async (event: CalendarEvent) => {
    if (user) {
      const { error } = await supabase.from('events').update(cleanForSupabase(event, user.id)).eq('id', event.id).eq('user_id', user.id);
      if (error) handleSupabaseError(error, 'updateEvent', showToast);
    }
    setEvents(prev => prev.map(e => e.id === event.id ? event : e));
    addActivityLog({ type: 'event', action: 'updated', title: `Evento actualizado: ${event.title}`, entityId: event.id });
    showToast('Evento actualizado', 'success');
  };
  const completeEvent = async (eventId: string) => {
    if (user) {
      const { error } = await supabase.from('events').update({ status: 'realizado' }).eq('id', eventId).eq('user_id', user.id);
      if (error) handleSupabaseError(error, 'completeEvent', showToast);
    }
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: 'realizado' } : e));
    showToast('Evento marcado como realizado', 'success');
  };
  const cancelEvent = async (eventId: string) => {
    if (user) {
      const { error } = await supabase.from('events').update({ status: 'cancelado' }).eq('id', eventId).eq('user_id', user.id);
      if (error) handleSupabaseError(error, 'cancelEvent', showToast);
    }
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: 'cancelado' } : e));
    showToast('Evento cancelado', 'warning');
  };
  const deleteEvent = async (eventId: string) => {
    if (user) {
      const { error } = await supabase.from('events').delete().eq('id', eventId).eq('user_id', user.id);
      if (error) handleSupabaseError(error, 'deleteEvent', showToast);
    }
    setEvents(prev => prev.filter(e => e.id !== eventId));
    showToast('Evento eliminado', 'info');
  };

  // --- Sales ---
  const addSale = async (sale: Sale) => {
    let inserted: Sale = sale;
    if (user) {
      const { data, error } = await supabase.from('sales').insert(cleanForSupabase(sale, user.id)).select();
      if (error) {
        handleSupabaseError(error, 'addSale', showToast);
        return;
      }
      if (data && data.length > 0) {
        inserted = data[0] as Sale;
      }
    }
    setSales(prev => [inserted, ...prev]);
    handleSaleStatusChange(inserted);
    addActivityLog({ type: 'sale', action: 'created', title: `Venta registrada: ${inserted.nombre || inserted.id}`, entityId: inserted.id });
    showToast('Operación de venta registrada', 'success');
  };
  const updateSale = async (sale: Sale) => {
    if (user) {
      const { error } = await supabase.from('sales').update(cleanForSupabase(sale, user.id)).eq('id', sale.id).eq('user_id', user.id);
      if (error) handleSupabaseError(error, 'updateSale', showToast);
    }
    setSales(prev => prev.map(s => s.id === sale.id ? sale : s));
    handleSaleStatusChange(sale);
    addActivityLog({ type: 'sale', action: 'updated', title: `Venta actualizada: ${sale.nombre || sale.id}`, entityId: sale.id });
    showToast('Venta actualizada', 'success');
  };
  const deleteSale = async (saleId: string) => {
    if (user) {
      const { error } = await supabase.from('sales').delete().eq('id', saleId).eq('user_id', user.id);
      if (error) handleSupabaseError(error, 'deleteSale', showToast);
    }
    setSales(prev => prev.filter(s => s.id !== saleId));
    showToast('Venta eliminada', 'info');
  };

  // --- Rentals (localStorage only, not in cloud schema) ---
  const addRental = async (rental: Rental) => {
    setRentals(prev => [rental, ...prev]);
    handleRentalStatusChange(rental);
    addActivityLog({ type: 'rental', action: 'created', title: `Alquiler registrado: ${rental.id}`, entityId: rental.id });
    showToast('Operación de alquiler registrada', 'success');
  };
  const updateRental = async (rental: Rental) => {
    setRentals(prev => prev.map(r => r.id === rental.id ? rental : r));
    handleRentalStatusChange(rental);
    addActivityLog({ type: 'rental', action: 'updated', title: `Alquiler actualizado: ${rental.id}`, entityId: rental.id });
    showToast('Alquiler actualizado', 'success');
  };
  const deleteRental = async (rentalId: string) => {
    setRentals(prev => prev.filter(r => r.id !== rentalId));
    showToast('Alquiler eliminado', 'info');
  };

  // --- Documents (localStorage only) ---
  const addDocument = async (doc: Document) => {
    setDocuments(prev => [doc, ...prev]);
    addActivityLog({ type: 'document', action: 'created', title: `Documento añadido: ${doc.name}`, entityId: doc.id });
    showToast('Documento añadido', 'success');
  };
  const updateDocument = async (doc: Document) => {
    setDocuments(prev => prev.map(d => d.id === doc.id ? doc : d));
    addActivityLog({ type: 'document', action: 'updated', title: `Documento actualizado: ${doc.name}`, entityId: doc.id });
    showToast('Documento actualizado', 'success');
  };
  const deleteDocument = async (docId: string) => {
    setDocuments(prev => prev.filter(d => d.id !== docId));
    showToast('Documento eliminado', 'info');
  };

  // --- Waiting Room (localStorage only) ---
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

  // --- Buyers (localStorage only) ---
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
  const addReferredColleague = async (colleague: ReferredColleague) => {
    if (user) {
      const { error } = await supabase.from('referred_colleagues').insert(cleanForSupabase(colleague, user.id));
      if (error) handleSupabaseError(error, 'addReferredColleague', showToast);
    }
    setReferredColleagues(prev => [colleague, ...prev]);
    addActivityLog({ type: 'colleague', action: 'created', title: `Colega añadido: ${colleague.nombreApellido}`, entityId: colleague.id });
    showToast('Colega referido añadido', 'success');
  };
  const updateReferredColleague = async (colleague: ReferredColleague) => {
    if (user) {
      const { error } = await supabase.from('referred_colleagues').update(cleanForSupabase(colleague, user.id)).eq('id', colleague.id).eq('user_id', user.id);
      if (error) handleSupabaseError(error, 'updateReferredColleague', showToast);
    }
    setReferredColleagues(prev => prev.map(c => c.id === colleague.id ? colleague : c));
    addActivityLog({ type: 'colleague', action: 'updated', title: `Colega actualizado: ${colleague.nombreApellido}`, entityId: colleague.id });
    showToast('Colega actualizado', 'success');
  };
  const deleteReferredColleague = async (colleagueId: string) => {
    if (user) {
      const { error } = await supabase.from('referred_colleagues').delete().eq('id', colleagueId).eq('user_id', user.id);
      if (error) handleSupabaseError(error, 'deleteReferredColleague', showToast);
    }
    setReferredColleagues(prev => prev.filter(c => c.id !== colleagueId));
    showToast('Colega eliminado', 'info');
  };

  const updateProfile = async (newProfile: Profile) => {
    if (user) {
      const { error } = await supabase.from('profiles').upsert({
        user_id: user.id,
        name: newProfile.name,
        email: newProfile.email,
        phone: newProfile.phone,
        license: newProfile.license,
        templateProperty: newProfile.templateProperty,
        templateClient: newProfile.templateClient,
        templateBuyer: newProfile.templateBuyer,
      });
      if (error) handleSupabaseError(error, 'updateProfile', showToast);
    }
    setProfile(newProfile);
    showToast('Perfil guardado correctamente', 'success');
  };


  // --- Utilities ---
  const resetData = () => {
    Object.values(STORAGE_KEYS).forEach(key => removeFromStorage(key));
    localStorage.removeItem('estatecrm_cloud_synced');
    localStorage.removeItem('estatecrm_super_migration_v1_done');
    window.location.reload();
  };

  const clearMockData = () => {
    // Identify mock IDs from the initial mock data imports
    const mockClientIds = new Set(MOCK_CLIENTS.map(c => c.id));
    const mockPropertyIds = new Set(MOCK_PROPERTIES.map(p => p.id));
    const mockSaleIds = new Set(MOCK_SALES.map(s => s.id));
    const mockRentalIds = new Set(MOCK_RENTALS.map(r => r.id));
    const mockDocumentIds = new Set(MOCK_DOCUMENTS.map(d => d.id));
    const mockEventIds = new Set(MOCK_EVENTS.map(e => e.id));
    const mockTaskIds = new Set(MOCK_TASKS.map(t => t.id));

    // Remove mock records
    const newClients = clients.filter(c => !mockClientIds.has(c.id));
    const newProperties = properties.filter(p => !mockPropertyIds.has(p.id));
    const newSales = sales.filter(s => !mockSaleIds.has(s.id));
    const newRentals = rentals.filter(r => !mockRentalIds.has(r.id));
    const newDocuments = documents.filter(d => !mockDocumentIds.has(d.id));
    const newEvents = events.filter(e => !mockEventIds.has(e.id));
    const newTasks = tasks.filter(t => !mockTaskIds.has(t.id));

    // Build valid ID sets for referential integrity cleanup
    const validClientIds = new Set(newClients.map(c => c.id));
    const validPropertyIds = new Set(newProperties.map(p => p.id));
    const validSaleIds = new Set(newSales.map(s => s.id));
    const validRentalIds = new Set(newRentals.map(r => r.id));

    // Garbage-collect orphaned records that reference removed mocks
    const gcSales = newSales.filter(s =>
      validClientIds.has(s.clientCompradorId) &&
      validPropertyIds.has(s.propiedadId) &&
      validClientIds.has(s.propietarioId) &&
      validClientIds.has(s.vendedorId)
    );

    const gcRentals = newRentals.filter(r =>
      validClientIds.has(r.inquilinoId) &&
      validPropertyIds.has(r.propiedadId) &&
      validClientIds.has(r.propietarioId) &&
      validClientIds.has(r.locadorId)
    );

    const gcDocuments = newDocuments.filter(d => {
      if (d.clientId && !validClientIds.has(d.clientId)) return false;
      if (d.propertyId && !validPropertyIds.has(d.propertyId)) return false;
      if (d.saleId && !validSaleIds.has(d.saleId)) return false;
      if (d.rentalId && !validRentalIds.has(d.rentalId)) return false;
      return true;
    });

    const gcTasks = newTasks.filter(t => {
      if (t.clientId && !validClientIds.has(t.clientId)) return false;
      if (t.propertyId && !validPropertyIds.has(t.propertyId)) return false;
      return true;
    });

    const gcEvents = newEvents.filter(e => {
      if (e.clientId && !validClientIds.has(e.clientId)) return false;
      if (e.propertyId && !validPropertyIds.has(e.propertyId)) return false;
      return true;
    });

    setClients(newClients);
    setProperties(newProperties);
    setSales(gcSales);
    setRentals(gcRentals);
    setDocuments(gcDocuments);
    setEvents(gcEvents);
    setTasks(gcTasks);

    showToast('Datos de muestra eliminados correctamente', 'success');
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

  const importData = (jsonData: string): boolean => {
    try {
      const data = JSON.parse(jsonData);
      if (data.clients) setClients(data.clients);
      if (data.properties) setProperties(data.properties);
      if (data.tasks) setTasks(data.tasks.map((t: Task) => ({ ...t, relatedEntities: t.relatedEntities ?? [] })));
      if (data.events) setEvents(data.events);
      if (data.sales) setSales(data.sales.map((s: Sale) => ({
        ...s,
        operationStatus: s.operationStatus || 'activa',
        isCollected: s.isCollected ?? false,
        montoEscritura: typeof s.montoEscritura === 'number' ? String(s.montoEscritura) : s.montoEscritura
      })));
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
      profile,
      user,
      session,
      isCloudReady,
      syncLocalToCloud,
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
