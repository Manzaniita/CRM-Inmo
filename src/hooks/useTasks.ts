import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Task } from "../types";
import { useAuthStore } from "../stores/authStore";
import { useUIStore } from "../stores/uiStore";
import { getNextOccurrence, type RecurrenceFrequency } from "../lib/recurrence";

const fetchTasks = async () => {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error("No session");
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .order("createdAt", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((t) => ({
    ...t,
    relatedEntities: t.relatedEntities ?? [],
  })) as Task[];
};

export function useTasks() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
    enabled: !!user,
  });

  const addTask = useMutation({
    mutationFn: async (task: Task) => {
      const { createdAt, ...rest } = task;
      const { data, error } = await supabase
        .from("tasks")
        .insert({ ...rest, user_id: user!.id })
        .select();
      if (error) throw error;
      return data![0] as Task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      useUIStore.getState().showToast("Tarea creada", "success");
    },
    onError: (e: any) => useUIStore.getState().showToast(e.message, "error"),
  });

  const updateTask = useMutation({
    mutationFn: async (task: Task) => {
      const { error } = await supabase
        .from("tasks")
        .update(task)
        .eq("id", task.id)
        .eq("user_id", user!.id);
      if (error) throw error;
      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      useUIStore.getState().showToast("Tarea actualizada", "success");
    },
    onError: (e: any) => useUIStore.getState().showToast(e.message, "error"),
  });

  const completeTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { data: taskData, error: fetchError } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", taskId)
        .eq("user_id", user!.id)
        .single();
      if (fetchError) throw fetchError;

      const task = taskData as Task;
      if (
        task.isRecurring &&
        task.recurrenceFrequency &&
        (!task.recurrenceEndDate || task.dueDate <= task.recurrenceEndDate)
      ) {
        const nextDueDate = getNextOccurrence(
          task.dueDate,
          task.recurrenceFrequency as RecurrenceFrequency,
          new Date(),
        );
        const active =
          !task.recurrenceEndDate || nextDueDate <= task.recurrenceEndDate;
        const { error } = await supabase
          .from("tasks")
          .update({
            dueDate: nextDueDate,
            status: active ? "pendiente" : "completada",
          })
          .eq("id", taskId)
          .eq("user_id", user!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("tasks")
          .update({ status: "completada" })
          .eq("id", taskId)
          .eq("user_id", user!.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      useUIStore.getState().showToast("Tarea completada ✔️", "success");
    },
    onError: (e: any) => useUIStore.getState().showToast(e.message, "error"),
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      useUIStore.getState().showToast("Tarea eliminada", "info");
    },
    onError: (e: any) => useUIStore.getState().showToast(e.message, "error"),
  });

  return {
    tasks,
    isLoading,
    addTask: addTask.mutateAsync,
    updateTask: updateTask.mutateAsync,
    completeTask: completeTask.mutateAsync,
    deleteTask: deleteTask.mutateAsync,
  };
}
