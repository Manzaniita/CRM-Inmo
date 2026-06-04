import React, { useState, useEffect } from "react";
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
  ListTodo,
  Link2,
  Loader2,
  MoreVertical,
  Download,
  Trash2,
} from "lucide-react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import {
  Client,
  ClientType,
  ClientStatus,
  ClientOrigin,
  EntityNote,
  Document,
  Sale,
  Rental,
  Task,
  CalendarEvent,
  TaskStatus,
  TaskPriority,
  EventType,
  EventStatus,
  Property,
  ReferredColleague,
} from "../types";
import Badge from "../components/Badge";
import Button from "../components/Button";
import { Card } from "../components/Card";
import {
  cn,
  formatCurrency,
  formatDate,
  normalizeSearchText,
  generateWhatsAppLink,
  formatWhatsAppTemplate,
  parseRichText,
} from "../lib/utils";
import { generateId } from "../lib/id";
import { validateClient, validateTask } from "../lib/validators";

import { useRelationsDrawer } from "../context/RelationsDrawerContext";
import EntityNotesPanel from "../components/EntityNotesPanel";
import DocumentModal from "../components/DocumentModal";
import SaleModal from "../components/SaleModal";
import RentalModal from "../components/RentalModal";
import SearchableSelect from "../components/SearchableSelect";
import { useUIStore } from "../stores/uiStore";
import { useAuthStore } from "../stores/authStore";
import { useProperties } from "../hooks/useProperties";
import { useRentals } from "../hooks/useRentals";
import { useDocuments } from "../hooks/useDocuments";
import { useWaitingRoom } from "../hooks/useWaitingRoom";
import { useBuyers } from "../hooks/useBuyers";
import { useReferredColleagues } from "../hooks/useReferredColleagues";
import { useActivityLogs } from "../hooks/useActivityLogs";
import { useCustomOptions } from "../hooks/useCustomOptions";
import { useStorage } from "../hooks/useStorage";
import FileUpload from "../components/FileUpload";
import { useSales } from "../hooks/useSales";
import { useTasks } from "../hooks/useTasks";
import { useEvents } from "../hooks/useEvents";
import { useClients } from "../hooks/useClients";

function BentoInfoItem({
  icon: Icon,
  label,
  value,
  action,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100/60 dark:border-white/5 hover:border-accent/20 dark:hover:border-dark-accent/20 transition-colors">
      <div className="w-10 h-10 bg-accent/10 dark:bg-dark-accent/15 rounded-lg flex items-center justify-center shrink-0">
        <Icon
          size={18}
          className="text-accent dark:text-dark-accent"
          strokeWidth={1.5}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
          {value}
        </p>
      </div>
      {action}
    </div>
  );
}

export default function Clients() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientIdFromQuery = searchParams.get("clientId");
  const effectiveClientId = id || clientIdFromQuery || undefined;
  const { sales, addSale, updateSale, deleteSale } = useSales();
  const { tasks, addTask, updateTask, deleteTask } = useTasks();
  const { events, addEvent, updateEvent, deleteEvent } = useEvents();
  const { clients, isLoading, addClient, updateClient } = useClients();
  const { properties } = useProperties();
  const { rentals, addRental, updateRental, deleteRental } = useRentals();
  const { documents, addDocument, updateDocument, deleteDocument } =
    useDocuments();
  const {
    waitingRoom,
    addWaitingRoomEntry,
    updateWaitingRoomEntry,
    deleteWaitingRoomEntry,
  } = useWaitingRoom();
  const { buyers, addBuyer, updateBuyer, deleteBuyer } = useBuyers();
  const {
    referredColleagues,
    addReferredColleague,
    updateReferredColleague,
    deleteReferredColleague,
  } = useReferredColleagues();
  const { activityLogs, addActivityLog } = useActivityLogs();
  const { customOptions, updateCustomOptions } = useCustomOptions();
  const { uploadFile: uploadStorageFile } = useStorage();
  const showToast = useUIStore((state) => state.showToast);
  const profile = useAuthStore((state) => state.profile);
  const { openRelations } = useRelationsDrawer();

  const [openMenuClientId, setOpenMenuClientId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docModalMode, setDocModalMode] = useState<"create" | "edit" | "view">(
    "view",
  );
  const [selectedDocForModal, setSelectedDocForModal] = useState<
    Document | undefined
  >(undefined);
  const [clientDocFile, setClientDocFile] = useState<File | null>(null);
  const [isUploadingClientDoc, setIsUploadingClientDoc] = useState(false);

  // Operation Modals State
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [saleModalMode, setSaleModalMode] = useState<
    "create" | "edit" | "view"
  >("create");
  const [selectedSaleForModal, setSelectedSaleForModal] = useState<
    Sale | undefined
  >(undefined);
  const [isRentalModalOpen, setIsRentalModalOpen] = useState(false);
  const [rentalModalMode, setRentalModalMode] = useState<
    "create" | "edit" | "view"
  >("create");
  const [selectedRentalForModal, setSelectedRentalForModal] = useState<
    Rental | undefined
  >(undefined);

  // Task Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskFormData, setTaskFormData] = useState({
    title: "",
    description: "",
    priority: "media" as TaskPriority,
    status: "pendiente" as TaskStatus,
    dueDate: new Date().toISOString().split("T")[0],
    propertyId: "",
    notes: "",
  });

  // Event Modal State
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventFormData, setEventFormData] = useState({
    title: "",
    description: "",
    type: "seguimiento" as EventType,
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().slice(0, 5),
    propertyId: "",
    status: "pendiente" as EventStatus,
    notes: "",
  });

  // Colleague referral mini-form state
  const [showNewColleagueForm, setShowNewColleagueForm] = useState(false);
  const [newColleagueName, setNewColleagueName] = useState("");
  const [newColleagueOffice, setNewColleagueOffice] = useState("");
  const [selectedColleagueId, setSelectedColleagueId] = useState("");

  // Filter State
  const [filterType, setFilterType] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterOrigin, setFilterOrigin] = useState<string>("");
  const [filterZone, setFilterZone] = useState<string>("");
  const [filterHasOperation, setFilterHasOperation] = useState<boolean | null>(
    null,
  );
  const [filterHasPendingTasks, setFilterHasPendingTasks] = useState<
    boolean | null
  >(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortName, setSortName] = useState<"asc" | "desc">("asc");

  // Form State
  const [formData, setFormData] = useState<Partial<Client>>({
    name: "",
    phone: "",
    email: "",
    type: "comprador",
    types: ["comprador"],
    status: "nuevo",
    origin: "WhatsApp",
    lastContact: new Date().toISOString().split("T")[0],
    notes: "",
    profession: "",
    referredBy: "",
    referredByColleagueId: "",
    dashboardPinned: false,
    dashboardArchived: false,
  });

  const selectedClient = clients.find((c) => c.id === effectiveClientId);

  // Detectar query params para crear referido desde colega
  useEffect(() => {
    const newReferral = searchParams.get("newReferral");
    const colleagueId = searchParams.get("colleagueId");
    if (newReferral === "true" && colleagueId) {
      setEditingClient(null);
      setFormData({
        name: "",
        phone: "",
        email: "",
        type: "comprador",
        types: ["comprador"],
        status: "nuevo",
        origin: "Referido",
        lastContact: new Date().toISOString().split("T")[0],
        notes: "",
        profession: "",
        referredBy: "",
        referredByColleagueId: colleagueId,
        dashboardPinned: false,
        dashboardArchived: false,
      });
      setSelectedColleagueId(colleagueId);
      setShowNewColleagueForm(false);
      setNewColleagueName("");
      setNewColleagueOffice("");
      setIsFormModalOpen(true);
      navigate("/clientes", { replace: true });
    }
  }, [searchParams, navigate]);

  // Cerrar menú de acciones rápidas al hacer clic fuera
  useEffect(() => {
    if (!openMenuClientId) return;
    const handleClickOutside = () => setOpenMenuClientId(null);
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuClientId]);

  // Estado de error si el ID de la URL no corresponde a ningún cliente cargado
  if (effectiveClientId && !selectedClient) {
    return (
      <div className="page-enter flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Users size={32} className="text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Cliente no encontrado
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          El cliente que buscás no existe o fue eliminado.
        </p>
        <Button variant="outline" onClick={() => navigate("/clientes")}>
          Volver a la lista
        </Button>
      </div>
    );
  }

  const lowerSearch = normalizeSearchText(searchTerm);

  // Compute client IDs with operations (sales or rentals)
  const clientIdsWithOperations = new Set([
    ...sales.map((s) => s.clientCompradorId),
    ...rentals.map((r) => r.inquilinoId),
  ]);

  // Compute client IDs with pending tasks
  const clientIdsWithPendingTasks = new Set(
    tasks
      .filter(
        (t) =>
          t.clientId && t.status !== "completada" && t.status !== "vencida",
      )
      .map((t) => t.clientId),
  );

  const filteredClients = clients
    .filter((c) => {
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
      if (
        filterZone &&
        !normalizeSearchText(c.interestZone || "").includes(
          normalizeSearchText(filterZone),
        )
      )
        return false;

      // Has operation filter
      if (filterHasOperation === true && !clientIdsWithOperations.has(c.id))
        return false;
      if (filterHasOperation === false && clientIdsWithOperations.has(c.id))
        return false;

      // Has pending tasks filter
      if (
        filterHasPendingTasks === true &&
        !clientIdsWithPendingTasks.has(c.id)
      )
        return false;
      if (
        filterHasPendingTasks === false &&
        clientIdsWithPendingTasks.has(c.id)
      )
        return false;

      return true;
    })
    .sort((a, b) => {
      const cmp = a.name.localeCompare(b.name);
      return sortName === "asc" ? cmp : -cmp;
    });

  const handleOpenForm = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData(client);
      setSelectedColleagueId(client.referredByColleagueId || "");
      setShowNewColleagueForm(false);
      setNewColleagueName("");
      setNewColleagueOffice("");
    } else {
      setEditingClient(null);
      setFormData({
        name: "",
        phone: "",
        email: "",
        type: "comprador",
        types: ["comprador"],
        status: "nuevo",
        origin: "WhatsApp",
        lastContact: new Date().toISOString().split("T")[0],
        notes: "",
        profession: "",
        referredBy: "",
        referredByColleagueId: "",
        dashboardPinned: false,
        dashboardArchived: false,
      });
      setSelectedColleagueId("");
      setShowNewColleagueForm(false);
      setNewColleagueName("");
      setNewColleagueOffice("");
    }
    setIsFormModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateClient(formData);
    if (!result.valid) {
      showToast(result.message || "Error de validación", "error");
      return;
    }

    const clientData: Client = editingClient
      ? { ...(formData as Client) }
      : {
          ...(formData as Client),
          id: generateId("c"),
          createdAt: new Date().toISOString().split("T")[0],
        };

    // Handle colleague referral logic
    let colleagueToUpdate: { id: string; clientId: string } | null = null;
    let newColleagueId: string | null = null;

    if (clientData.origin === "Referido") {
      if (showNewColleagueForm && newColleagueName.trim()) {
        const col: ReferredColleague = {
          id: generateId("col"),
          nombreApellido: newColleagueName.trim(),
          oficina: newColleagueOffice.trim(),
          respondio: false,
          yaRefirio: true,
          referredClientIds: [clientData.id],
          propertyIds: [],
        };
        addReferredColleague(col);
        newColleagueId = col.id;
        clientData.referredByColleagueId = col.id;
        addActivityLog({
          type: "colleague",
          action: "created",
          title: `Colega creado desde cliente: ${col.nombreApellido}`,
          entityId: col.id,
        });
        addActivityLog({
          type: "client",
          action: "updated",
          title: `Cliente vinculado con colega: ${clientData.name}`,
          description: `Referido por ${col.nombreApellido}`,
          entityId: clientData.id,
        });
      } else if (selectedColleagueId) {
        clientData.referredByColleagueId = selectedColleagueId;
        colleagueToUpdate = {
          id: selectedColleagueId,
          clientId: clientData.id,
        };
        addActivityLog({
          type: "client",
          action: "updated",
          title: `Cliente vinculado con colega: ${clientData.name}`,
          entityId: clientData.id,
        });
      }
    } else {
      clientData.referredByColleagueId = "";
    }

    if (editingClient) {
      updateClient(clientData);
    } else {
      addClient(clientData);
    }

    if (colleagueToUpdate) {
      const col = referredColleagues.find(
        (c) => c.id === colleagueToUpdate!.id,
      );
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
    setNewColleagueName("");
    setNewColleagueOffice("");
    setSelectedColleagueId("");
  };

  const getTypeBadgeVariant = (typeId: string): any => {
    const found = customOptions.clientTypes.find((t) => t.id === typeId);
    if (found?.color) return found.color;
    switch (typeId) {
      case "comprador":
        return "green";
      case "vendedor":
        return "blue";
      case "inquilino":
        return "orange";
      case "propietario":
        return "purple";
      case "inversor":
        return "yellow";
      case "interesado":
        return "gray";
      default:
        return "gray";
    }
  };

  const handleTextareaFormatKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    onChange: (value: string) => void,
  ) => {
    if (!e.ctrlKey) return;
    const key = e.key.toLowerCase();
    let tag = "";
    if (key === "b") tag = "**";
    else if (key === "u" || key === "s") tag = "__";
    else return;

    e.preventDefault();
    const el = e.currentTarget;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const value = el.value;

    const before = value.substring(0, start);
    const selected = value.substring(start, end);
    const after = value.substring(end);

    const newValue = before + tag + selected + tag + after;
    onChange(newValue);

    requestAnimationFrame(() => {
      el.selectionStart = start + tag.length;
      el.selectionEnd = end + tag.length;
      el.focus();
    });
  };

  const getStatusBadgeVariant = (statusId: string): any => {
    const found = customOptions.clientStatuses.find((s) => s.id === statusId);
    if (found?.color) return found.color;
    switch (statusId) {
      case "nuevo":
        return "green";
      case "contactado":
        return "blue";
      case "interesado":
        return "orange";
      case "en seguimiento":
        return "purple";
      case "negociación":
        return "yellow";
      case "cerrado":
        return "gray";
      case "perdido":
        return "red";
      default:
        return "gray";
    }
  };

  function renderTaskModal() {
    const propertyOptions = properties.map((p) => ({
      value: p.id,
      label: p.title,
      subtitle: `${p.address} - ${p.zone}`,
    }));

    const handleSaveTask = () => {
      const validation = validateTask({ title: taskFormData.title });
      if (!validation.valid) {
        showToast(validation.message || "Error de validación", "error");
        return;
      }
      const newTask: Task = {
        id: generateId("t"),
        title: taskFormData.title,
        description: taskFormData.description,
        dueDate: taskFormData.dueDate,
        priority: taskFormData.priority,
        status: taskFormData.status,
        clientId: id,
        propertyId: taskFormData.propertyId || undefined,
        notes: taskFormData.notes,
        createdAt: new Date().toISOString(),
      };
      addTask(newTask);
      setIsTaskModalOpen(false);
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setIsTaskModalOpen(false)}
        ></div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-800">
            <h2 className="font-bold text-xl text-slate-900 dark:text-slate-100">
              Nueva Tarea para {selectedClient?.name}
            </h2>
            <button
              onClick={() => setIsTaskModalOpen(false)}
              className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-400"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-6 overflow-y-auto max-h-[70vh]">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={taskFormData.title}
                  onChange={(e) =>
                    setTaskFormData({ ...taskFormData, title: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={taskFormData.description}
                  onChange={(e) =>
                    setTaskFormData({
                      ...taskFormData,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Prioridad
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={taskFormData.priority}
                    onChange={(e) =>
                      setTaskFormData({
                        ...taskFormData,
                        priority: e.target.value as TaskPriority,
                      })
                    }
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Estado
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={taskFormData.status}
                    onChange={(e) =>
                      setTaskFormData({
                        ...taskFormData,
                        status: e.target.value as TaskStatus,
                      })
                    }
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
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Fecha Límite
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={taskFormData.dueDate}
                  onChange={(e) =>
                    setTaskFormData({
                      ...taskFormData,
                      dueDate: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <SearchableSelect
                  label="Propiedad relacionada"
                  value={taskFormData.propertyId}
                  onChange={(val) =>
                    setTaskFormData({ ...taskFormData, propertyId: val })
                  }
                  options={propertyOptions}
                  placeholder="Seleccionar propiedad..."
                  allowEmpty
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notas
                </label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={taskFormData.notes}
                  onChange={(e) =>
                    setTaskFormData({ ...taskFormData, notes: e.target.value })
                  }
                  onKeyDown={(e) =>
                    handleTextareaFormatKeyDown(e, (val) =>
                      setTaskFormData({ ...taskFormData, notes: val }),
                    )
                  }
                />
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsTaskModalOpen(false)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleSaveTask}>
                Crear Tarea
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderEventModal() {
    const propertyOptions = properties.map((p) => ({
      value: p.id,
      label: p.title,
      subtitle: `${p.address} - ${p.zone}`,
    }));

    const handleSaveEvent = () => {
      if (!eventFormData.title) {
        showToast("El título es obligatorio", "error");
        return;
      }
      const newEvent: CalendarEvent = {
        id: generateId("e"),
        title: eventFormData.title,
        description: eventFormData.description,
        date: eventFormData.date,
        time: eventFormData.time,
        type: eventFormData.type,
        status: eventFormData.status,
        clientId: id,
        propertyId: eventFormData.propertyId || undefined,
        notes: eventFormData.notes,
        createdAt: new Date().toISOString(),
      };
      addEvent(newEvent);
      setIsEventModalOpen(false);
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setIsEventModalOpen(false)}
        ></div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-800">
            <h2 className="font-bold text-xl text-slate-900 dark:text-slate-100">
              Nueva Cita con {selectedClient?.name}
            </h2>
            <button
              onClick={() => setIsEventModalOpen(false)}
              className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-400"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-6 overflow-y-auto max-h-[70vh]">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={eventFormData.title}
                  onChange={(e) =>
                    setEventFormData({
                      ...eventFormData,
                      title: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={eventFormData.description}
                  onChange={(e) =>
                    setEventFormData({
                      ...eventFormData,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tipo
                </label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={eventFormData.type}
                  onChange={(e) =>
                    setEventFormData({
                      ...eventFormData,
                      type: e.target.value as EventType,
                    })
                  }
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
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={eventFormData.date}
                    onChange={(e) =>
                      setEventFormData({
                        ...eventFormData,
                        date: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Hora
                  </label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={eventFormData.time}
                    onChange={(e) =>
                      setEventFormData({
                        ...eventFormData,
                        time: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Estado
                </label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={eventFormData.status}
                  onChange={(e) =>
                    setEventFormData({
                      ...eventFormData,
                      status: e.target.value as EventStatus,
                    })
                  }
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
                  onChange={(val) =>
                    setEventFormData({ ...eventFormData, propertyId: val })
                  }
                  options={propertyOptions}
                  placeholder="Seleccionar propiedad..."
                  allowEmpty
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notas
                </label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={eventFormData.notes}
                  onChange={(e) =>
                    setEventFormData({
                      ...eventFormData,
                      notes: e.target.value,
                    })
                  }
                  onKeyDown={(e) =>
                    handleTextareaFormatKeyDown(e, (val) =>
                      setEventFormData({ ...eventFormData, notes: val }),
                    )
                  }
                />
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setIsEventModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleSaveEvent}>
                Programar Cita
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedClient) {
    const clientSales = sales.filter((s) => s.clientCompradorId === id);

    return (
      <div className="page-enter">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-6">
          <motion.button
            whileHover={{ x: -3 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/dashboard")}
            title="Volver al Panel Principal"
            className="group flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-accent dark:hover:text-dark-accent hover:bg-accent/10 dark:hover:bg-dark-accent/10 transition-colors"
          >
            <ArrowLeft
              size={18}
              strokeWidth={1.5}
              className="transition-transform group-hover:-translate-x-0.5"
            />
          </motion.button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenForm(selectedClient)}
          >
            <Plus size={16} className="mr-1" strokeWidth={1.5} /> Editar
          </Button>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Info Block - Large */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="relative overflow-visible" glow>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-accent/10 dark:bg-dark-accent/15 border-2 border-accent/20 dark:border-dark-accent/30 flex items-center justify-center text-accent dark:text-dark-accent text-2xl font-extrabold">
                    {selectedClient.name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
                      {selectedClient.name}
                    </h1>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {(selectedClient.types && selectedClient.types.length > 0
                        ? selectedClient.types
                        : [selectedClient.type || "interesado"]
                      ).map((t) => (
                        <span key={t}>
                          <Badge variant={getTypeBadgeVariant(t)}>{t}</Badge>
                        </span>
                      ))}
                      <Badge
                        variant={getStatusBadgeVariant(selectedClient.status)}
                      >
                        {selectedClient.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Grid - Asymmetric Bento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                <BentoInfoItem
                  icon={Phone}
                  label="Teléfono"
                  value={selectedClient.phone || ""}
                  action={
                    <button
                      className="p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
                      onClick={() => {
                        const msg = formatWhatsAppTemplate(
                          profile?.templateClient,
                          {
                            name: selectedClient.name,
                            agentName: profile?.name || 'Usuario',
                            title: "",
                            address: "",
                            price: "",
                            link: "",
                          },
                        );
                        const link = generateWhatsAppLink(
                          selectedClient.phone,
                          msg,
                        );
                        window.open(link, "_blank");
                      }}
                      title="Contactar por WhatsApp"
                    >
                      <MessageCircle size={18} strokeWidth={1.5} />
                    </button>
                  }
                />
                <BentoInfoItem
                  icon={Mail}
                  label="Email"
                  value={selectedClient.email || ""}
                />
                <BentoInfoItem
                  icon={Globe}
                  label="Origen"
                  value={selectedClient.origin || ""}
                />
                <BentoInfoItem
                  icon={DollarSign}
                  label="Presupuesto"
                  value={
                    selectedClient.budget
                      ? formatCurrency(
                          selectedClient.budget,
                          selectedClient.currency,
                        )
                      : "Sin especificar"
                  }
                />
                {selectedClient.interestZone && (
                  <BentoInfoItem
                    icon={MapPin}
                    label="Zona de Interés"
                    value={selectedClient.interestZone}
                  />
                )}
                <BentoInfoItem
                  icon={Calendar}
                  label="Último Contacto"
                  value={formatDate(selectedClient.lastContact || "")}
                />
              </div>
            </Card>

            {/* Notes */}
            <Card title="Notas Internas" glow>
              <div
                className="text-slate-600 dark:text-slate-300 leading-relaxed italic border-l-4 border-slate-100 dark:border-slate-700 pl-4"
                dangerouslySetInnerHTML={{
                  __html: parseRichText(
                    selectedClient.notes || "Sin notas adicionales.",
                  ),
                }}
              />
              <div className="mt-6">
                <EntityNotesPanel
                  notes={selectedClient.historyNotes ?? undefined}
                  onAddNote={(content) => {
                    const newNote: EntityNote = {
                      id: generateId("n"),
                      content,
                      createdAt: new Date().toISOString(),
                    };
                    updateClient({
                      ...selectedClient,
                      historyNotes: [
                        ...(selectedClient.historyNotes || []),
                        newNote,
                      ],
                    });
                  }}
                  onDeleteNote={(noteId) => {
                    updateClient({
                      ...selectedClient,
                      historyNotes: (selectedClient.historyNotes || []).filter(
                        (n) => n.id !== noteId,
                      ),
                    });
                  }}
                />
              </div>
            </Card>

            {/* Properties */}
            <Card title="Propiedades Asociadas" glow>
              {(() => {
                const clientProperties = properties.filter(
                  (p) => p.ownerId === id,
                );
                if (clientProperties.length === 0)
                  return (
                    <p className="text-sm text-slate-400 dark:text-slate-500 italic py-2">
                      Sin propiedades asociadas.
                    </p>
                  );
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {clientProperties.map((prop) => (
                      <motion.div
                        key={prop.id}
                        whileHover={{ y: -2 }}
                        onClick={() => navigate(`/propiedades/${prop.id}`)}
                        className="cursor-pointer"
                      >
                        <Card
                          className="border-slate-100 dark:border-white/5 hover:shadow-soft-md transition-all"
                          glow={false}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <Badge
                                variant={
                                  prop.operation === "venta" ? "orange" : "blue"
                                }
                              >
                                {prop.operation}
                              </Badge>
                              <span className="ml-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                                {prop.title}
                              </span>
                              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                {prop.address}, {prop.zone}
                              </p>
                            </div>
                            <ChevronRight
                              size={16}
                              className="text-slate-300 dark:text-slate-600"
                              strokeWidth={1.5}
                            />
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                );
              })()}
            </Card>

            {/* Operations */}
            <Card
              title="Operaciones Relacionadas"
              subtitle="Ventas"
              footer={
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSaleModalMode("create");
                      setSelectedSaleForModal(undefined);
                      setIsSaleModalOpen(true);
                    }}
                  >
                    <Plus size={14} className="mr-1" strokeWidth={1.5} /> Nueva
                    Venta
                  </Button>
                </div>
              }
              glow
            >
              {clientSales.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500 italic py-4">
                  Sin operaciones relacionadas.
                </p>
              ) : (
                <div className="space-y-3">
                  {clientSales.map((sale) => (
                    <motion.div
                      key={sale.id}
                      whileHover={{ x: 4 }}
                      onClick={() => {
                        setSelectedSaleForModal(sale);
                        setSaleModalMode("view");
                        setIsSaleModalOpen(true);
                      }}
                      className="cursor-pointer"
                    >
                      <Card
                        className="border-blue-100 dark:border-blue-500/20 hover:shadow-soft-md transition-all"
                        glow={false}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <Badge variant="blue">Venta</Badge>
                            <span className="ml-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                              {sale.estado}
                            </span>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                              {properties.find((p) => p.id === sale.propiedadId)
                                ?.title || sale.propiedadId}
                            </p>
                          </div>
                          <ChevronRight
                            size={16}
                            className="text-slate-300 dark:text-slate-600"
                            strokeWidth={1.5}
                          />
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar Blocks - Compact */}
          <div className="lg:col-span-4 space-y-6">
            <Card title="Acciones Rápidas" glow>
              <div className="space-y-3">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => {
                    setEventFormData({
                      title: "",
                      description: "",
                      type: "seguimiento",
                      date: new Date().toISOString().split("T")[0],
                      time: new Date().toTimeString().slice(0, 5),
                      propertyId: "",
                      status: "pendiente",
                      notes: "",
                    });
                    setIsEventModalOpen(true);
                  }}
                >
                  <Calendar size={18} className="mr-2" strokeWidth={1.5} />{" "}
                  Programar Cita
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setTaskFormData({
                      title: "",
                      description: "",
                      priority: "media",
                      status: "pendiente",
                      dueDate: new Date().toISOString().split("T")[0],
                      propertyId: "",
                      notes: "",
                    });
                    setIsTaskModalOpen(true);
                  }}
                >
                  <ListTodo size={18} className="mr-2" strokeWidth={1.5} />{" "}
                  Crear Tarea
                </Button>
              </div>
            </Card>

            <Card title="Información del Cliente" glow>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">
                    Creado
                  </span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {formatDate(selectedClient.createdAt || "")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">
                    Tipo
                  </span>
                  <div className="flex gap-1 flex-wrap">
                    {(selectedClient.types && selectedClient.types.length > 0
                      ? selectedClient.types
                      : [selectedClient.type || "interesado"]
                    ).map((t) => (
                      <span key={t}>
                        <Badge variant={getTypeBadgeVariant(t)} size="sm">
                          {t}
                        </Badge>
                      </span>
                    ))}
                  </div>
                </div>
                {selectedClient.profession && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">
                      Profesión
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {selectedClient.profession}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">
                    Origen
                  </span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {selectedClient.origin || "Otro"}
                  </span>
                </div>
                {selectedClient.origin === "Referido" && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">
                      Referido por
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {selectedClient.referredByColleagueId
                        ? referredColleagues.find(
                            (c) =>
                              c.id === selectedClient.referredByColleagueId,
                          )?.nombreApellido || "Colega desconocido"
                        : selectedClient.referredBy || "—"}
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-4 space-y-2 pt-4 border-t border-slate-100 dark:border-white/5">
                {selectedClient.dashboardPinned ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateClient({
                        ...selectedClient,
                        dashboardPinned: false,
                      });
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
                      updateClient({
                        ...selectedClient,
                        dashboardPinned: true,
                      });
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
                      updateClient({
                        ...selectedClient,
                        dashboardArchived: true,
                      });
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
                      updateClient({
                        ...selectedClient,
                        dashboardArchived: false,
                      });
                    }}
                  >
                    Desarchivar del dashboard
                  </Button>
                )}
              </div>
            </Card>

            <Card title="Documentos Adjuntos">
              <div className="space-y-3">
                {documents
                  .filter((d) => d.clientId === selectedClient.id)
                  .map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 hover:shadow-sm transition-all"
                    >
                      <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                        <FileText size={16} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {doc.name}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {doc.type} · {(doc.fileSize ? (doc.fileSize / 1024).toFixed(1) + ' KB' : '')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            if (doc.simulatedUrl && doc.simulatedUrl.startsWith('http')) {
                              window.open(doc.simulatedUrl, '_blank');
                            } else {
                              showToast('No hay archivo disponible para descargar', 'info');
                            }
                          }}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                          title="Descargar"
                        >
                          <Download size={14} className="text-slate-500 dark:text-slate-400" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('¿Eliminar este documento?')) {
                              deleteDocument(doc.id);
                            }
                          }}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={14} className="text-slate-500 dark:text-slate-400 hover:text-red-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                {documents.filter((d) => d.clientId === selectedClient.id).length === 0 && (
                  <p className="text-xs text-center text-slate-400 dark:text-slate-500 italic py-2">
                    Sin documentos adjuntos.
                  </p>
                )}
                <FileUpload
                  value={clientDocFile}
                  onFileSelect={async (file) => {
                    if (!file) {
                      setClientDocFile(null);
                      return;
                    }
                    setClientDocFile(file);
                    setIsUploadingClientDoc(true);
                    try {
                      const user = useAuthStore.getState().user;
                      const path = `${user?.id}/clients/${selectedClient.id}/${Date.now()}_${file.name}`;
                      const { publicUrl } = await uploadStorageFile('documents', path, file);
                      const ext = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() || '' : '';
                      const newDoc: Document = {
                        id: generateId('d'),
                        name: file.name,
                        type: 'Otro',
                        status: 'cargado',
                        clientId: selectedClient.id,
                        uploadDate: new Date().toISOString(),
                        notes: '',
                        fileName: file.name,
                        fileSize: file.size,
                        fileExtension: ext,
                        simulatedUrl: publicUrl,
                      };
                      await addDocument(newDoc);
                      await addActivityLog({
                        type: 'document',
                        action: 'created',
                        title: `Documento cargado: ${newDoc.name}`,
                        description: `Vinculado a cliente ${selectedClient.name}`,
                        entityId: newDoc.id,
                      });
                      showToast('Documento subido correctamente', 'success');
                      setClientDocFile(null);
                    } catch (err: any) {
                      showToast(err.message || 'Error al subir documento', 'error');
                    } finally {
                      setIsUploadingClientDoc(false);
                    }
                  }}
                  maxSizeMB={10}
                  preview={false}
                  uploading={isUploadingClientDoc}
                  helperText="Soltar PDF o imagen aquí"
                />
              </div>
            </Card>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => openRelations("client", selectedClient.id)}
            >
              <Link2 size={16} className="mr-2" strokeWidth={1.5} /> Ver
              vínculos (Vista 360°)
            </Button>
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
          onClose={() => {
            setIsDocModalOpen(false);
            setSelectedDocForModal(undefined);
          }}
          onSave={(doc) => {
            const existing = documents.find((d) => d.id === doc.id);
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
              showToast(
                'Descarga simulada: "' +
                  doc.fileName +
                  '". La descarga real se implementará cuando exista almacenamiento de archivos.',
                "info",
              );
            } else {
              showToast(
                "Descarga simulada. La descarga real se implementará cuando exista almacenamiento de archivos.",
                "info",
              );
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
          onClose={() => {
            setIsSaleModalOpen(false);
            setSelectedSaleForModal(undefined);
          }}
          onSave={(sale) => {
            const existing = sales.find((s) => s.id === sale.id);
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
          onClose={() => {
            setIsRentalModalOpen(false);
            setSelectedRentalForModal(undefined);
          }}
          onSave={(rental) => {
            const existing = rentals.find((r) => r.id === rental.id);
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
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setIsFormModalOpen(false)}
        ></div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-800">
            <h2 className="font-bold text-xl text-slate-900 dark:text-slate-100">
              {editingClient ? "Editar Cliente" : "Nuevo Cliente"}
            </h2>
            <button
              onClick={() => setIsFormModalOpen(false)}
              className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-400"
            >
              <X size={20} />
            </button>
          </div>
          <form
            onSubmit={handleSubmit}
            className="p-6 overflow-y-auto max-h-[70vh]"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre *
                </label>
                <input
                  required
                  type="text"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Tipo * (seleccioná uno o más)
                </label>
                <div className="flex flex-wrap gap-2 items-center">
                  {customOptions.clientTypes.map((t) => {
                    const selected =
                      formData.types && formData.types.length > 0
                        ? formData.types.includes(t.id)
                        : formData.type === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-bold border transition-all",
                          selected
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-300",
                        )}
                        onClick={() => {
                          const currentTypes =
                            formData.types && formData.types.length > 0
                              ? [...formData.types]
                              : formData.type
                                ? [formData.type]
                                : [];
                          if (currentTypes.includes(t.id)) {
                            const next = currentTypes.filter((x) => x !== t.id);
                            setFormData({
                              ...formData,
                              types: next.length > 0 ? next : undefined,
                              type: next.length > 0 ? next[0] : "comprador",
                            });
                          } else {
                            const next = [...currentTypes, t.id];
                            setFormData({
                              ...formData,
                              types: next,
                              type: next[0],
                            });
                          }
                        }}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-blue-100 hover:text-blue-600 flex items-center justify-center text-xs font-bold transition-all"
                    title="Agregar tipo"
                    onClick={() => {
                      const label = prompt("Nombre del nuevo tipo de cliente:");
                      if (!label?.trim()) return;
                      const id = label
                        .trim()
                        .toLowerCase()
                        .replace(/\s+/g, "_");
                      if (customOptions.clientTypes.some((t) => t.id === id)) {
                        showToast("Ya existe esa opción", "warning");
                        return;
                      }
                      updateCustomOptions({
                        ...customOptions,
                        clientTypes: [
                          ...customOptions.clientTypes,
                          { id, label: label.trim() },
                        ],
                      });
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Profesión
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.profession || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, profession: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Estado
                </label>
                <div className="flex gap-2">
                  <select
                    className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                  >
                    {customOptions.clientStatuses.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-blue-100 hover:text-blue-600 flex items-center justify-center text-sm font-bold transition-all"
                    title="Agregar estado"
                    onClick={() => {
                      const label = prompt(
                        "Nombre del nuevo estado de cliente:",
                      );
                      if (!label?.trim()) return;
                      const id = label
                        .trim()
                        .toLowerCase()
                        .replace(/\s+/g, "_");
                      if (
                        customOptions.clientStatuses.some((s) => s.id === id)
                      ) {
                        showToast("Ya existe esa opción", "warning");
                        return;
                      }
                      updateCustomOptions({
                        ...customOptions,
                        clientStatuses: [
                          ...customOptions.clientStatuses,
                          { id, label: label.trim() },
                        ],
                      });
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Origen
                </label>
                <div className="flex gap-2">
                  <select
                    className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={formData.origin}
                    onChange={(e) =>
                      setFormData({ ...formData, origin: e.target.value })
                    }
                  >
                    {customOptions.clientOrigins.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-blue-100 hover:text-blue-600 flex items-center justify-center text-sm font-bold transition-all"
                    title="Agregar origen"
                    onClick={() => {
                      const label = prompt("Nombre del nuevo origen:");
                      if (!label?.trim()) return;
                      const id = label
                        .trim()
                        .toLowerCase()
                        .replace(/\s+/g, "_");
                      if (
                        customOptions.clientOrigins.some((o) => o.id === id)
                      ) {
                        showToast("Ya existe esa opción", "warning");
                        return;
                      }
                      updateCustomOptions({
                        ...customOptions,
                        clientOrigins: [
                          ...customOptions.clientOrigins,
                          { id, label: label.trim() },
                        ],
                      });
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
              {formData.origin === "Referido" && (
                <div className="md:col-span-2 space-y-3">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Referido por colega
                  </label>
                  {!showNewColleagueForm ? (
                    <>
                      <SearchableSelect
                        placeholder="Seleccionar colega..."
                        value={selectedColleagueId}
                        onChange={(val) => setSelectedColleagueId(val)}
                        options={referredColleagues.map((c) => ({
                          value: c.id,
                          label: c.nombreApellido,
                          subtitle: c.oficina,
                        }))}
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
                      <p className="text-xs font-bold text-blue-700">
                        Nuevo Colega
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Nombre y apellido *"
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                          value={newColleagueName}
                          onChange={(e) => setNewColleagueName(e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Oficina"
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                          value={newColleagueOffice}
                          onChange={(e) =>
                            setNewColleagueOffice(e.target.value)
                          }
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          onClick={() => {
                            if (!newColleagueName.trim()) {
                              showToast("El nombre es obligatorio", "error");
                              return;
                            }
                            setShowNewColleagueForm(false);
                          }}
                        >
                          Listo
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300"
                          onClick={() => {
                            setShowNewColleagueForm(false);
                            setNewColleagueName("");
                            setNewColleagueOffice("");
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Último Contacto
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.lastContact || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, lastContact: e.target.value })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notas
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.notes || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  onKeyDown={(e) =>
                    handleTextareaFormatKeyDown(e, (val) =>
                      setFormData({ ...formData, notes: val }),
                    )
                  }
                />
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsFormModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary">
                {editingClient ? "Guardar Cambios" : "Crear Cliente"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Clientes
          </h1>
          <p className="text-slate-500">Gestión de la cartera de clientes.</p>
        </div>
        <Button variant="primary" onClick={() => handleOpenForm()}>
          <UserPlus size={20} className="mr-2" /> Nuevo Cliente
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden mb-6">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="relative flex-1 max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            />
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono o email..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={showFilters ? "primary" : "outline"}
              size="sm"
              className="h-10"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={16} className="mr-2" /> Filtros
              {(filterType ||
                filterStatus ||
                filterOrigin ||
                filterZone ||
                filterHasOperation !== null ||
                filterHasPendingTasks !== null) && (
                <span className="ml-1 w-2 h-2 rounded-full bg-blue-600" />
              )}
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Tipo
                </label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-slate-800"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="">Todos</option>
                  {customOptions.clientTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Estado
                </label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-slate-800"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">Todos</option>
                  {customOptions.clientStatuses.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Origen
                </label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-slate-800"
                  value={filterOrigin}
                  onChange={(e) => setFilterOrigin(e.target.value)}
                >
                  <option value="">Todos</option>
                  {customOptions.clientOrigins.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Zona de Interés
                </label>
                <input
                  type="text"
                  placeholder="Filtrar por zona..."
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-slate-800"
                  value={filterZone}
                  onChange={(e) => setFilterZone(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Operaciones
                </label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-slate-800"
                  value={
                    filterHasOperation === null
                      ? ""
                      : filterHasOperation
                        ? "si"
                        : "no"
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    setFilterHasOperation(val === "" ? null : val === "si");
                  }}
                >
                  <option value="">Todas</option>
                  <option value="si">Con operaciones</option>
                  <option value="no">Sin operaciones</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Tareas Pendientes
                </label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-slate-800"
                  value={
                    filterHasPendingTasks === null
                      ? ""
                      : filterHasPendingTasks
                        ? "si"
                        : "no"
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    setFilterHasPendingTasks(val === "" ? null : val === "si");
                  }}
                >
                  <option value="">Todas</option>
                  <option value="si">Con tareas pendientes</option>
                  <option value="no">Sin tareas pendientes</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Orden
                </label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-slate-800"
                  value={sortName}
                  onChange={(e) =>
                    setSortName(e.target.value as "asc" | "desc")
                  }
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
                  setFilterType("");
                  setFilterStatus("");
                  setFilterOrigin("");
                  setFilterZone("");
                  setFilterHasOperation(null);
                  setFilterHasPendingTasks(null);
                  setSortName("asc");
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
              className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:bg-slate-800/50 transition-colors cursor-pointer group"
              onClick={() => navigate(`/clientes/${client.id}`)}
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold flex-shrink-0">
                {client.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 transition-colors">
                  {client.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3 mt-0.5">
                  <span className="flex items-center">
                    <Phone size={12} className="mr-1" />
                    {client.phone}
                  </span>
                  <button
                    className="flex items-center text-green-600 hover:text-green-700 hover:bg-green-50 rounded px-1 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      const msg = formatWhatsAppTemplate(
                        profile?.templateClient,
                        {
                          name: client.name,
                          agentName: profile?.name || 'Usuario',
                          title: "",
                          address: "",
                          price: "",
                          link: "",
                        },
                      );
                      const link = generateWhatsAppLink(client.phone, msg);
                      window.open(link, "_blank");
                    }}
                    title="Contactar por WhatsApp"
                  >
                    <MessageCircle size={12} className="mr-0.5" /> WhatsApp
                  </button>
                  <span className="flex items-center">
                    <Mail size={12} className="mr-1" />
                    {client.email}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-1">
                {(client.types && client.types.length > 0
                  ? client.types
                  : [client.type || "interesado"]
                ).map((t) => (
                  <span key={t}>
                    <Badge variant={getTypeBadgeVariant(t)} size="sm">
                      {t}
                    </Badge>
                  </span>
                ))}
                <Badge variant={getStatusBadgeVariant(client.status)} size="sm">
                  {client.status}
                </Badge>
                <Badge variant="gray" size="sm">
                  {client.origin}
                </Badge>
                {client.profession && (
                  <Badge variant="gray" size="sm">
                    {client.profession}
                  </Badge>
                )}
              </div>
              <button
                className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors mr-1"
                onClick={(e) => {
                  e.stopPropagation();
                  openRelations("client", client.id);
                }}
                title="Ver vínculos"
              >
                <Link2 size={14} />
              </button>
              <div className="relative">
                <button
                  className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuClientId(openMenuClientId === client.id ? null : client.id);
                  }}
                  title="Acciones rápidas"
                >
                  <MoreVertical size={16} />
                </button>
                {openMenuClientId === client.id && (
                  <div
                    className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 z-50 py-1 overflow-hidden"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    {[
                      { label: "Nuevo", value: "nuevo" },
                      { label: "Contactado", value: "contactado" },
                      { label: "En seguimiento", value: "en seguimiento" },
                      { label: "Ganado", value: "cerrado" },
                      { label: "Perdido", value: "perdido" },
                    ].map((s) => (
                      <button
                        key={s.value}
                        className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateClient({ ...client, status: s.value });
                          setOpenMenuClientId(null);
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <ChevronRight
                size={16}
                className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:text-slate-400 transition-colors"
              />
            </div>
          ))}
        </div>

        {filteredClients.length === 0 && (
          <div className="py-20 text-center">
            <Users size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {searchTerm ||
              filterType ||
              filterStatus ||
              filterOrigin ||
              filterZone ||
              filterHasOperation !== null ||
              filterHasPendingTasks !== null
                ? "No se encontraron clientes con los filtros actuales."
                : "No hay clientes cargados."}
            </p>
          </div>
        )}
      </div>

      {isFormModalOpen && renderFormModal()}
    </div>
  );
}
