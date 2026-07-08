import React, { useState, useEffect } from "react";
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
  AlertTriangle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  useParams,
  useNavigate,
  useLocation,
  Link,
  useSearchParams,
} from "react-router-dom";

import { useEvents } from "../hooks/useEvents";
import { supabase } from "../lib/supabase";
import { CalendarEvent, EventType, EventStatus } from "../types";
import Badge from "../components/Badge";
import Button from "../components/Button";
import { Card } from "../components/Card";
import SearchableSelect from "../components/SearchableSelect";
import {
  cn,
  formatDate,
  normalizeSearchText,
  generateWhatsAppLink,
  formatWhatsAppTemplate,
} from "../lib/utils";
import { formatRecurrenceLabel, type RecurrenceFrequency } from "../lib/recurrence";
import { generateId } from "../lib/id";
import { useUIStore } from "../stores/uiStore";
import { useProperties } from "../hooks/useProperties";
import { useClients } from "../hooks/useClients";

export default function Agenda() {
  const {
    events,
    isLoading,
    addEvent,
    updateEvent,
    completeEvent,
    cancelEvent,
    deleteEvent,
  } = useEvents();
  const { clients } = useClients();
  const { properties } = useProperties();
  const showToast = useUIStore((state) => state.showToast);
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<"list" | "week">("list");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<
    "date-asc" | "date-desc" | "status" | "type"
  >("date-asc");
  const [visitFeedbackEvent, setVisitFeedbackEvent] =
    useState<CalendarEvent | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Today dynamic
  const today = new Date().toISOString().split("T")[0];

  // Mini-calendar state
  const [calendarDate, setCalendarDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();
  const monthLabel = calendarDate.toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  // Day of week of the 1st (0=Sun..6=Sat), convert to Mon-first offset
  const firstDow = new Date(calYear, calMonth, 1).getDay();
  const startOffset = firstDow === 0 ? 6 : firstDow - 1;

  const goToPrevMonth = () =>
    setCalendarDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goToNextMonth = () =>
    setCalendarDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const resetToToday = () => {
    const d = new Date();
    d.setDate(1);
    setCalendarDate(new Date(d.getFullYear(), d.getMonth(), 1));
    setSelectedDay(null);
  };

  const eventDaysInMonth = new Set(
    events
      .filter((e) => {
        const d = new Date(e.date + "T00:00:00");
        return d.getFullYear() === calYear && d.getMonth() === calMonth;
      })
      .map((e) => e.date),
  );

  const [formData, setFormData] = useState<Partial<CalendarEvent>>({
    title: "",
    description: "",
    date: today,
    time: "10:00",
    type: "visita",
    status: "pendiente",
    clientId: "",
    propertyId: "",
    notes: "",
    isRecurring: false,
    recurrenceFrequency: undefined,
    recurrenceEndDate: "",
  });

  React.useEffect(() => {
    if (location.state?.prefillClientId || location.state?.prefillPropertyId) {
      handleOpenForm();
      setFormData((prev) => ({
        ...prev,
        clientId: location.state.prefillClientId || "",
        propertyId: location.state.prefillPropertyId || "",
      }));
      // Clear state to avoid reopening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Handle query param eventId for deep linking
  React.useEffect(() => {
    const eventId = searchParams.get("eventId");
    if (eventId) {
      const event = events.find((e) => e.id === eventId);
      if (event) {
        setSelectedDay(event.date);
        setCalendarDate(
          new Date(
            Number(event.date.split("-")[0]),
            Number(event.date.split("-")[1]) - 1,
            1,
          ),
        );
        // Scroll to event after render
        setTimeout(() => {
          const el = document.getElementById(`event-row-${eventId}`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      }
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, events]);

  const now = new Date();
  const todayStr = today;

  const isEventOverdue = (event: CalendarEvent): boolean => {
    if (event.status !== "pendiente") return false;
    const eventDateTime = new Date(`${event.date}T${event.time}`);
    return eventDateTime < now;
  };

  const filteredEvents = events
    .filter((e) => {
      const matchesSearch = normalizeSearchText(e.title).includes(
        normalizeSearchText(searchTerm),
      );
      const matchesType = filterType === "all" || e.type === filterType;
      const matchesDay = !selectedDay || e.date === selectedDay;
      return matchesSearch && matchesType && matchesDay;
    })
    .sort((a, b) => {
      const eventDateTime = (e: CalendarEvent) =>
        new Date(`${e.date}T${e.time || "00:00"}`).getTime();
      const isPending = (e: CalendarEvent) => e.status === "pendiente";
      const isOverdue = (e: CalendarEvent) =>
        isPending(e) && eventDateTime(e) < now.getTime();
      const isDone = (e: CalendarEvent) =>
        e.status === "realizado" || e.status === "cancelado";

      const score = (e: CalendarEvent) => {
        if (isOverdue(e)) return 0;
        if (isPending(e)) return 1;
        if (isDone(e)) return 3;
        return 2;
      };

      const sa = score(a);
      const sb = score(b);
      if (sa !== sb) return sa - sb;
      return eventDateTime(a) - eventDateTime(b);
    });

  const handleSyncAll = async () => {
    const unsynced = events.filter(
      (e) =>
        !e.googleCalendarEventId &&
        (e.status === "pendiente" || e.status === "realizado"),
    );
    if (unsynced.length === 0) {
      showToast("No hay eventos pendientes de sincronizar", "info");
      return;
    }
    setIsSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("No hay sesión activa");
      let synced = 0;
      for (const event of unsynced) {
        const res = await fetch("/api/google-calendar-sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: "create", event }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Error sincronizando evento");
        await updateEvent({ ...event, googleCalendarEventId: result.googleEventId });
        synced++;
      }
      showToast(`${synced} evento(s) sincronizado(s) con Google Calendar`, "success");
    } catch (err: any) {
      showToast(err.message || "Error de sincronización", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleOpenForm = (event?: CalendarEvent) => {
    if (event) {
      setEditingEvent(event);
      setFormData(event);
    } else {
      setEditingEvent(null);
      setFormData({
        title: "",
        description: "",
        date: today,
        time: "10:00",
        type: "visita",
        status: "pendiente",
        clientId: "",
        propertyId: "",
        notes: "",
        isRecurring: false,
        recurrenceFrequency: undefined,
        recurrenceEndDate: "",
      });
    }
    setIsFormOpen(true);
  };

  const handleCompleteEvent = (event: CalendarEvent) => {
    if (event.type === "visita" && event.clientId) {
      setVisitFeedbackEvent(event);
      return;
    }
    completeEvent(event.id);
  };

  const sendVisitFeedback = (send: boolean) => {
    const event = visitFeedbackEvent;
    if (!event) return;
    if (send) {
      const client = clients.find((c) => c.id === event.clientId);
      const property = properties.find((p) => p.id === event.propertyId);
      const msg = formatWhatsAppTemplate(
        "Hola {name}, ¿qué te pareció la propiedad de {address} que vimos hoy?",
        {
          name: client?.name || "",
          address: property?.address || event.title || "",
        },
      );
      if (client?.phone) {
        window.open(generateWhatsAppLink(client.phone, msg), "_blank");
      } else {
        showToast("El cliente no tiene teléfono cargado", "warning");
      }
    }
    setVisitFeedbackEvent(null);
    completeEvent(event.id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      showToast("El título es obligatorio", "error");
      return;
    }
    if (!formData.date || !/^\d{4}-\d{2}-\d{2}$/.test(formData.date)) {
      showToast("La fecha no es válida", "error");
      return;
    }
    if (!formData.time) {
      showToast("La hora es obligatoria", "error");
      return;
    }

    const cleanFormData = { ...formData };
    if (!cleanFormData.recurrenceEndDate?.trim()) {
      delete cleanFormData.recurrenceEndDate;
    }

    if (editingEvent) {
      const updatedEvent = { ...editingEvent, ...cleanFormData } as CalendarEvent;
      // Reschedule logic: if original was pending and overdue, and new date/time is future -> reprogramado
      const originalDateTime = new Date(
        `${editingEvent.date}T${editingEvent.time}`,
      );
      const newDateTime = new Date(`${updatedEvent.date}T${updatedEvent.time}`);
      const now = new Date();
      if (
        editingEvent.status === "pendiente" &&
        originalDateTime < now &&
        newDateTime > now
      ) {
        updatedEvent.status = "reprogramado";
      }
      updateEvent(updatedEvent);
    } else {
      const newEvent: CalendarEvent = {
        ...(cleanFormData as CalendarEvent),
        id: generateId("e"),
        createdAt: new Date().toISOString(),
      };
      addEvent(newEvent);
    }
    setIsFormOpen(false);
  };

  const getEventStatusVariant = (status: string): any => {
    switch (status) {
      case "pendiente":
        return "orange";
      case "realizado":
        return "green";
      case "cancelado":
        return "red";
      case "reprogramado":
        return "blue";
      default:
        return "gray";
    }
  };

  const clientOptions = clients.map((c) => ({
    value: c.id,
    label: c.name,
    subtitle: c.type || c.phone || undefined,
  }));

  const propertyOptions = properties.map((p) => ({
    value: p.id,
    label: p.title,
    subtitle:
      [p.address, p.zone].filter(Boolean).join(", ") || `Código: ${p.code}`,
  }));

  const getEventTypeVariant = (type: string): any => {
    switch (type) {
      case "visita":
        return "green";
      case "firma":
        return "red";
      case "tasación":
        return "orange";
      case "llamada":
        return "blue";
      case "reunión":
        return "purple";
      default:
        return "gray";
    }
  };

  const renderEventForm = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setIsFormOpen(false)}
      ></div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-xl text-slate-900 dark:text-slate-100">
            {editingEvent ? "Editar Evento" : "Nuevo Evento"}
          </h2>
          <button
            onClick={() => setIsFormOpen(false)}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X size={20} />
          </button>
        </div>
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 max-h-[70vh] overflow-y-auto"
        >
          <div>
            <label className="block text-sm font-bold text-slate-400 dark:text-slate-500 mb-1">
              Título *
            </label>
            <input
              required
              type="text"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-400 dark:text-slate-500 mb-1">
                Tipo *
              </label>
              <select
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as EventType,
                  })
                }
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
              <label className="block text-sm font-bold text-slate-400 dark:text-slate-500 mb-1">
                Estado
              </label>
              <select
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
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
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-400 dark:text-slate-500 mb-1">
                Fecha *
              </label>
              <input
                required
                type="date"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-400 dark:text-slate-500 mb-1">
                Hora *
              </label>
              <input
                required
                type="time"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                value={formData.time}
                onChange={(e) =>
                  setFormData({ ...formData, time: e.target.value })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-400 dark:text-slate-500 mb-1">
                Cliente (Opcional)
              </label>
              <SearchableSelect
                placeholder="Seleccionar cliente..."
                value={formData.clientId || ""}
                onChange={(value) =>
                  setFormData({ ...formData, clientId: value })
                }
                options={clientOptions}
                emptyLabel="Ninguno"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-400 dark:text-slate-500 mb-1">
                Propiedad (Opcional)
              </label>
              <SearchableSelect
                placeholder="Seleccionar propiedad..."
                value={formData.propertyId || ""}
                onChange={(value) =>
                  setFormData({ ...formData, propertyId: value })
                }
                options={propertyOptions}
                emptyLabel="Ninguna"
              />
            </div>
          </div>
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 space-y-3">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isRecurring || false}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    isRecurring: e.target.checked,
                    recurrenceFrequency: e.target.checked
                      ? formData.recurrenceFrequency || "yearly"
                      : undefined,
                  })
                }
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Evento recurrente
            </label>
            {formData.isRecurring && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                    Frecuencia
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={formData.recurrenceFrequency || "yearly"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        recurrenceFrequency:
                          e.target.value as RecurrenceFrequency,
                      })
                    }
                  >
                    <option value="daily">Diaria</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensual</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                    Fin (opcional)
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={formData.recurrenceEndDate || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        recurrenceEndDate: e.target.value || undefined,
                      })
                    }
                  />
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-400 dark:text-slate-500 mb-1">
              Notas
            </label>
            <textarea
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </div>
          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsFormOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 border-none text-white shadow-lg shadow-blue-500/25"
            >
              {editingEvent ? "Guardar Cambios" : "Crear Evento"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Agenda
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Administra tus visitas, reuniones y recordatorios.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 mr-2">
            <button
              onClick={() => setView("list")}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                view === "list"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-800/50",
              )}
            >
              Listado
            </button>
            <button
              onClick={() => setView("week")}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                view === "week"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-800/50",
              )}
            >
              Semana
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncAll}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <Loader2 size={16} className="mr-2 animate-spin" />
            ) : (
              <RefreshCw size={16} className="mr-2" />
            )}
            Sincronizar con Google
          </Button>
          <Button variant="primary" onClick={() => handleOpenForm()}>
            <Plus size={18} className="mr-2" /> Nuevo Evento
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-slate-100/50 dark:border-white/5 flex items-center justify-between">
              <button
                onClick={goToPrevMonth}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100 capitalize">
                {monthLabel}
              </span>
              <button
                onClick={goToNextMonth}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="px-3 pt-2 pb-1">
              <button
                onClick={resetToToday}
                className="w-full text-xs font-bold py-1.5 rounded-lg border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
              >
                Hoy
              </button>
            </div>
            <div className="p-3 grid grid-cols-7 gap-1 text-center">
              {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                <span
                  key={`${d}-${i}`}
                  className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase"
                >
                  {d}
                </span>
              ))}
              {Array.from({ length: startOffset }).map((_, i) => (
                <span key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isToday = dateStr === today;
                const isSelected = dateStr === selectedDay;
                const hasEvents = eventDaysInMonth.has(dateStr);
                return (
                  <button
                    key={i}
                    onClick={() =>
                      setSelectedDay((prev) =>
                        prev === dateStr ? null : dateStr,
                      )
                    }
                    className={cn(
                      "h-8 flex flex-col items-center justify-center text-xs rounded-lg transition-all font-semibold relative",
                      isSelected
                        ? "bg-blue-600 text-white shadow-sm"
                        : isToday
                          ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 font-black"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300",
                    )}
                  >
                    {day}
                    {hasEvents && !isSelected && (
                      <span
                        className={cn(
                          "absolute bottom-1 w-1 h-1 rounded-full",
                          isToday ? "bg-blue-600" : "bg-blue-400",
                        )}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            {selectedDay && (
              <div className="px-3 pb-3">
                <button
                  onClick={() => setSelectedDay(null)}
                  className="w-full text-[10px] font-bold py-1 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-800/50 transition-colors"
                >
                  Limpiar filtro de día
                </button>
              </div>
            )}
          </Card>

          <Card title="Filtrar por Tipo">
            <div className="space-y-2">
              {[
                "all",
                "visita",
                "llamada",
                "reunión",
                "firma",
                "seguimiento",
                "tasación",
              ].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={cn(
                    "w-full flex items-center justify-between p-2 rounded-lg text-sm font-medium transition-colors",
                    filterType === type
                      ? "bg-blue-50 text-blue-700"
                      : "hover:bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300",
                  )}
                >
                  <span className="capitalize">
                    {type === "all" ? "Todos" : type}
                  </span>
                  {filterType === type && <CheckCircle2 size={14} />}
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {view === "list" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex-wrap gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                  />
                  <input
                    type="text"
                    placeholder="Buscar en la agenda..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 items-center flex-wrap">
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-1.5 border border-slate-100 dark:border-slate-800">
                    <ArrowUpDown
                      size={14}
                      className="text-slate-400 dark:text-slate-500"
                    />
                    <select
                      className="text-xs font-bold bg-transparent outline-none text-slate-700 dark:text-slate-300"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                    >
                      <option value="date-asc">Fecha (próxima primero)</option>
                      <option value="date-desc">Fecha (lejana primero)</option>
                      <option value="status">Por estado</option>
                      <option value="type">Por tipo</option>
                    </select>
                  </div>
                  <Badge variant="blue" size="sm">
                    Hoy:{" "}
                    {filteredEvents.filter((e) => e.date === todayStr).length}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                {filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    id={`event-row-${event.id}`}
                    className={cn(
                      "bg-white dark:bg-slate-900/50 p-4 rounded-xl border shadow-sm flex items-start gap-4 hover:border-blue-200 dark:hover:border-blue-500/30 transition-colors group relative",
                      isEventOverdue(event)
                        ? "border-l-2 border-l-rose-400 dark:border-l-rose-500 border-slate-200 dark:border-slate-700 shadow-[0_2px_8px_rgba(244,63,94,0.08)]"
                        : "border-slate-200 dark:border-slate-700",
                    )}
                  >
                    <div
                      className={cn(
                        "flex flex-col items-center justify-center w-14 h-14 text-slate-500 dark:text-slate-400 rounded-xl border shrink-0",
                        isEventOverdue(event)
                          ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:border-blue-100 dark:group-hover:border-blue-500/20",
                      )}
                    >
                      <span className="text-[10px] font-black uppercase">
                        {event.time}
                      </span>
                      <span className="text-xs font-bold leading-none mt-1">
                        {event.date === todayStr
                          ? "HOY"
                          : event.date.split("-").slice(1).reverse().join("/")}
                      </span>
                    </div>
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleOpenForm(event)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate">
                            {event.title}
                          </h4>
                          {event.isRecurring && (
                            <Badge variant="purple" size="sm">
                              {formatRecurrenceLabel(
                                event.recurrenceFrequency,
                                event.recurrenceEndDate,
                              )}
                            </Badge>
                          )}
                          {isEventOverdue(event) && (
                            <AlertTriangle
                              size={14}
                              className="text-red-500 shrink-0"
                            />
                          )}
                        </div>
                        <Badge
                          variant={
                            isEventOverdue(event)
                              ? "red"
                              : getEventStatusVariant(event.status)
                          }
                        >
                          {isEventOverdue(event) ? "VENCIDO" : event.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 line-clamp-1">
                        {event.description || event.notes || "Sin descripción"}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-400 dark:text-slate-500">
                        {event.clientId && (
                          <Link
                            to={`/clientes/${event.clientId}`}
                            className="flex items-center gap-1.5 hover:text-blue-600 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <User
                              size={14}
                              className="text-slate-400 dark:text-slate-500"
                            />
                            <span className="text-slate-700 dark:text-slate-300">
                              {
                                clients.find((c) => c.id === event.clientId)
                                  ?.name
                              }
                            </span>
                          </Link>
                        )}
                        {event.propertyId && (
                          <Link
                            to={`/propiedades/${event.propertyId}`}
                            className="flex items-center gap-1.5 hover:text-purple-600 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Home
                              size={14}
                              className="text-slate-400 dark:text-slate-500"
                            />
                            <span className="text-slate-700 dark:text-slate-300 truncate">
                              {
                                properties.find(
                                  (p) => p.id === event.propertyId,
                                )?.title
                              }
                            </span>
                          </Link>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge
                        variant={getEventTypeVariant(event.type)}
                        size="sm"
                      >
                        {event.type}
                      </Badge>
                      {isEventOverdue(event) ? (
                        <div className="flex items-center gap-1 mt-auto">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenForm(event);
                            }}
                            title="Reprogramar"
                            className="p-1.5 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-100"
                          >
                            <RotateCcw size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelEvent(event.id);
                            }}
                            title="Cancelar"
                            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50"
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mt-auto">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompleteEvent(event);
                            }}
                            title="Realizado"
                            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-green-600 rounded-lg hover:bg-green-50"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelEvent(event.id);
                            }}
                            title="Cancelar"
                            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50"
                          >
                            <XCircle size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm("¿Eliminar este evento?"))
                                deleteEvent(event.id);
                            }}
                            title="Eliminar"
                            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {filteredEvents.length === 0 && (
                  <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    <CalendarIcon
                      size={48}
                      className="mx-auto text-gray-200 mb-4"
                    />
                    <p className="text-slate-500 dark:text-slate-400">
                      No hay eventos que coincidan con los filtros.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Card className="p-0 overflow-hidden min-h-[600px] flex items-center justify-center bg-slate-50 dark:bg-slate-800/30">
              <div className="text-center p-12">
                <CalendarIcon
                  size={48}
                  className="mx-auto text-gray-200 mb-4"
                />
                <p className="text-slate-500 dark:text-slate-400 font-medium italic">
                  Vista de calendario semanal simulada.
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                  Pronto integraremos una grilla real de eventos.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-6"
                  onClick={() => setView("list")}
                >
                  Volver a lista
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
      {isFormOpen && renderEventForm()}

      {visitFeedbackEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 animate-in zoom-in-95">
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-2">
              Visita realizada
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              ¿Querés enviar un pedido de feedback al cliente por WhatsApp?
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => sendVisitFeedback(false)}
              >
                No enviar
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => sendVisitFeedback(true)}
              >
                Enviar feedback
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
