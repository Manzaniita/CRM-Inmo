import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Client, CalendarEvent, Task } from "../types";
import { useAuthStore } from "../stores/authStore";
import { useUIStore } from "../stores/uiStore";
import { generateId } from "../lib/id";
import { getUpcomingBirthday } from "../lib/recurrence";
import { useEvents } from "./useEvents";
import { useTasks } from "./useTasks";

const fetchClients = async () => {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error("No session");
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", user.id)
    .order("createdAt", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Client[];
};

async function ensureBirthdayReminders(
  client: Client,
  addEvent: (event: CalendarEvent) => Promise<CalendarEvent>,
  updateEvent: (event: CalendarEvent) => Promise<CalendarEvent>,
  addTask: (task: Task) => Promise<Task>,
  updateTask: (task: Task) => Promise<Task>,
) {
  const user = useAuthStore.getState().user;
  if (!user) return;

  if (!client.birthdate) {
    // Si se quitó la fecha de nacimiento, eliminar recordatorios automáticos.
    await supabase
      .from("events")
      .delete()
      .eq("user_id", user.id)
      .eq("clientId", client.id)
      .eq("source", "auto_birthday");
    await supabase
      .from("tasks")
      .delete()
      .eq("user_id", user.id)
      .eq("clientId", client.id)
      .eq("source", "auto_birthday");
    return;
  }

  const upcomingDate = getUpcomingBirthday(client.birthdate);

  const { data: existingEvents } = await supabase
    .from("events")
    .select("id")
    .eq("user_id", user.id)
    .eq("clientId", client.id)
    .eq("source", "auto_birthday")
    .limit(1);

  if (!existingEvents || existingEvents.length === 0) {
    const birthdayEvent: CalendarEvent = {
      id: generateId("e"),
      title: `Cumpleaños de ${client.name}`,
      description: `Recordatorio anual del cumpleaños de ${client.name}.`,
      date: upcomingDate,
      time: "09:00",
      type: "recordatorio",
      status: "pendiente",
      clientId: client.id,
      createdAt: new Date().toISOString(),
      isRecurring: true,
      recurrenceFrequency: "yearly",
      source: "auto_birthday",
    };
    await addEvent(birthdayEvent);
  } else {
    await updateEvent({
      id: existingEvents[0].id,
      title: `Cumpleaños de ${client.name}`,
      description: `Recordatorio anual del cumpleaños de ${client.name}.`,
      date: upcomingDate,
      time: "09:00",
      type: "recordatorio",
      status: "pendiente",
      clientId: client.id,
      isRecurring: true,
      recurrenceFrequency: "yearly",
      source: "auto_birthday",
    } as CalendarEvent);
  }

  const { data: existingTasks } = await supabase
    .from("tasks")
    .select("id")
    .eq("user_id", user.id)
    .eq("clientId", client.id)
    .eq("source", "auto_birthday")
    .limit(1);

  if (!existingTasks || existingTasks.length === 0) {
    const birthdayTask: Task = {
      id: generateId("t"),
      title: `Saludar a ${client.name} por su cumpleaños`,
      description: `Recordatorio anual para saludar a ${client.name} el día de su cumpleaños.`,
      dueDate: upcomingDate,
      priority: "media",
      status: "pendiente",
      clientId: client.id,
      createdAt: new Date().toISOString(),
      source: "auto_birthday",
      isRecurring: true,
      recurrenceFrequency: "yearly",
      relatedEntities: [{ type: "client", id: client.id }],
    };
    await addTask(birthdayTask);
  } else {
    await updateTask({
      id: existingTasks[0].id,
      title: `Saludar a ${client.name} por su cumpleaños`,
      description: `Recordatorio anual para saludar a ${client.name} el día de su cumpleaños.`,
      dueDate: upcomingDate,
      priority: "media",
      status: "pendiente",
      clientId: client.id,
      source: "auto_birthday",
      isRecurring: true,
      recurrenceFrequency: "yearly",
      relatedEntities: [{ type: "client", id: client.id }],
    } as Task);
  }
}

export function useClients() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { addEvent, updateEvent } = useEvents();
  const { addTask, updateTask } = useTasks();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
    enabled: !!user,
  });

  const addClient = useMutation({
    mutationFn: async (client: Client) => {
      const { data, error } = await supabase
        .from("clients")
        .insert({ ...client, user_id: user!.id })
        .select();
      if (error) throw error;
      return data![0] as Client;
    },
    onSuccess: async (client) => {
      await ensureBirthdayReminders(client, addEvent, updateEvent, addTask, updateTask);
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      useUIStore.getState().showToast("Cliente creado con éxito", "success");
    },
    onError: (e: any) => useUIStore.getState().showToast(e.message, "error"),
  });

  const updateClient = useMutation({
    mutationFn: async (client: Client) => {
      const { error } = await supabase
        .from("clients")
        .update(client)
        .eq("id", client.id)
        .eq("user_id", user!.id);
      if (error) throw error;
      return client;
    },
    onSuccess: async (client) => {
      await ensureBirthdayReminders(client, addEvent, updateEvent, addTask, updateTask);
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      useUIStore.getState().showToast("Cliente actualizado", "success");
    },
    onError: (e: any) => useUIStore.getState().showToast(e.message, "error"),
  });

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      useUIStore.getState().showToast("Cliente eliminado", "info");
    },
    onError: (e: any) => useUIStore.getState().showToast(e.message, "error"),
  });

  return {
    clients,
    isLoading,
    addClient: addClient.mutateAsync,
    updateClient: updateClient.mutateAsync,
    deleteClient: deleteClient.mutateAsync,
  };
}
