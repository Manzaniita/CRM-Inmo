import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { CalendarEvent } from "../types";
import { useAuthStore } from "../stores/authStore";
import { useUIStore } from "../stores/uiStore";
import { getNextOccurrence, type RecurrenceFrequency } from "../lib/recurrence";

// Supabase usa snake_case para las columnas de recurrencia.
function toEventDb(event: Partial<CalendarEvent>) {
  const {
    isRecurring,
    recurrenceFrequency,
    recurrenceEndDate,
    createdAt,
    ...rest
  } = event;
  return {
    ...rest,
    ...(isRecurring !== undefined && { is_recurring: isRecurring }),
    ...(recurrenceFrequency !== undefined && {
      recurrence_frequency: recurrenceFrequency,
    }),
    ...(recurrenceEndDate !== undefined && {
      recurrence_end_date: recurrenceEndDate,
    }),
  };
}

function fromEventDb(row: any): CalendarEvent {
  return {
    ...row,
    isRecurring: row.is_recurring,
    recurrenceFrequency: row.recurrence_frequency,
    recurrenceEndDate: row.recurrence_end_date,
  } as CalendarEvent;
}

const fetchEvents = async () => {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error("No session");
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("user_id", user.id)
    .order("createdAt", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromEventDb);
};

export function useEvents() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: fetchEvents,
    enabled: !!user,
  });

  const addEvent = useMutation({
    mutationFn: async (event: CalendarEvent) => {
      const { createdAt, ...rest } = event;
      const { data, error } = await supabase
        .from("events")
        .insert({ ...toEventDb(rest), user_id: user!.id })
        .select();
      if (error) throw error;
      return fromEventDb(data![0]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      useUIStore.getState().showToast("Evento agendado", "success");
    },
    onError: (e: any) => useUIStore.getState().showToast(e.message, "error"),
  });

  const updateEvent = useMutation({
    mutationFn: async (event: CalendarEvent) => {
      const { error } = await supabase
        .from("events")
        .update(toEventDb(event))
        .eq("id", event.id)
        .eq("user_id", user!.id);
      if (error) throw error;
      return event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      useUIStore.getState().showToast("Evento actualizado", "success");
    },
    onError: (e: any) => useUIStore.getState().showToast(e.message, "error"),
  });

  const completeEvent = useMutation({
    mutationFn: async (eventId: string) => {
      const { data: eventData, error: fetchError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .eq("user_id", user!.id)
        .single();
      if (fetchError) throw fetchError;

      const event = fromEventDb(eventData);
      if (
        event.isRecurring &&
        event.recurrenceFrequency &&
        (!event.recurrenceEndDate || event.date <= event.recurrenceEndDate)
      ) {
        const nextDate = getNextOccurrence(
          event.date,
          event.recurrenceFrequency as RecurrenceFrequency,
          new Date(),
        );
        const active =
          !event.recurrenceEndDate || nextDate <= event.recurrenceEndDate;
        const { error } = await supabase
          .from("events")
          .update({
            date: nextDate,
            status: active ? "pendiente" : "realizado",
          })
          .eq("id", eventId)
          .eq("user_id", user!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("events")
          .update({ status: "realizado" })
          .eq("id", eventId)
          .eq("user_id", user!.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      useUIStore
        .getState()
        .showToast("Evento marcado como realizado", "success");
    },
    onError: (e: any) => useUIStore.getState().showToast(e.message, "error"),
  });

  const cancelEvent = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from("events")
        .update({ status: "cancelado" })
        .eq("id", eventId)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      useUIStore.getState().showToast("Evento cancelado", "warning");
    },
    onError: (e: any) => useUIStore.getState().showToast(e.message, "error"),
  });

  const deleteEvent = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      useUIStore.getState().showToast("Evento eliminado", "info");
    },
    onError: (e: any) => useUIStore.getState().showToast(e.message, "error"),
  });

  return {
    events,
    isLoading,
    addEvent: addEvent.mutateAsync,
    updateEvent: updateEvent.mutateAsync,
    completeEvent: completeEvent.mutateAsync,
    cancelEvent: cancelEvent.mutateAsync,
    deleteEvent: deleteEvent.mutateAsync,
  };
}
