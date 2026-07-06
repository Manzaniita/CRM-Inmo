import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../stores/authStore";
import { useProperties } from "./useProperties";
import { useTasks } from "./useTasks";
import { useActivityLogs } from "./useActivityLogs";
import { useUIStore } from "../stores/uiStore";
import { generateId } from "../lib/id";

const FINAL_PROPERTY_STATUSES = ["vendida", "alquilada", "finalizado"];

export function useContractExpiration() {
  const { properties } = useProperties();
  const { tasks } = useTasks();
  const { addActivityLog } = useActivityLogs();
  const queryClient = useQueryClient();
  const processedAutoKeys = useRef<Set<string>>(new Set());

  useEffect(() => {
    const checkContractExpirations = async () => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      for (const prop of properties) {
        if (!prop.contractEndDate) continue;
        const end = new Date(prop.contractEndDate);
        end.setHours(0, 0, 0, 0);
        const daysLeft = Math.ceil(
          (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );

        // Warning 15 days before
        if (daysLeft <= 15 && daysLeft >= 0) {
          const warningKey = `contract-warning-15-${prop.id}-${prop.contractEndDate}`;
          if (!processedAutoKeys.current.has(warningKey)) {
            const exists = tasks.some((t) => t.autoKey === warningKey);
            if (!exists) {
              const newTask = {
                id: generateId("t"),
                title: `Revisar / renovar contrato de ${prop.title}`,
                description: `El contrato de la propiedad ${prop.title} vence el ${prop.contractEndDate}. Contactar al cliente para revisar renovación.`,
                dueDate: new Date().toISOString().split("T")[0],
                priority: daysLeft === 0 ? "alta" : "media",
                status: "pendiente",
                propertyId: prop.id,
                clientId: prop.ownerId,
                createdAt: new Date().toISOString(),
                source: "auto_contract_renewal",
                autoKey: warningKey,
              };
              const currentUser = useAuthStore.getState().user;
              if (currentUser) {
                const { createdAt, ...rest } = newTask;
                const { data, error } = await supabase
                  .from("tasks")
                  .insert({ ...rest, user_id: currentUser.id })
                  .select();
                if (!error && data) {
                  queryClient.invalidateQueries({ queryKey: ["tasks"] });
                  addActivityLog({
                    type: "task",
                    action: "created",
                    title: `Tarea automática creada: Revisar contrato de ${prop.title}`,
                    entityId: prop.id,
                  });
                }
              }
            }
            processedAutoKeys.current.add(warningKey);
          }
        }

        // Notificación destacada a 7 días
        if (daysLeft === 7) {
          const notifyKey = `contract-notify-7-${prop.id}-${prop.contractEndDate}`;
          if (!processedAutoKeys.current.has(notifyKey)) {
            useUIStore
              .getState()
              .showToast(
                `⏰ Quedan 7 días para el vencimiento de la exclusiva de ${prop.title}`,
                "warning",
              );
            addActivityLog({
              type: "property",
              action: "status_changed",
              title: `Alerta: 7 días para vencimiento de exclusiva - ${prop.title}`,
              description: `El contrato de exclusiva vence el ${prop.contractEndDate}.`,
              entityId: prop.id,
            });
            processedAutoKeys.current.add(notifyKey);
          }
        }

        // Expired
        if (
          daysLeft < 0 &&
          prop.status !== "vencida" &&
          !FINAL_PROPERTY_STATUSES.includes(prop.status)
        ) {
          const expiredKey = `contract-expired-${prop.id}-${prop.contractEndDate}`;
          if (!processedAutoKeys.current.has(expiredKey)) {
            const exists = tasks.some((t) => t.autoKey === expiredKey);
            if (!exists) {
              const newTask = {
                id: generateId("t"),
                title: `Revisar / renovar contrato de ${prop.title}`,
                description: `El contrato de la propiedad ${prop.title} venció el ${prop.contractEndDate}. Contactar al cliente urgentemente.`,
                dueDate: new Date().toISOString().split("T")[0],
                priority: "alta",
                status: "pendiente",
                propertyId: prop.id,
                clientId: prop.ownerId,
                createdAt: new Date().toISOString(),
                source: "auto_contract_renewal",
                autoKey: expiredKey,
              };
              const currentUser2 = useAuthStore.getState().user;
              if (currentUser2) {
                const { createdAt, ...rest } = newTask;
                const { data, error } = await supabase
                  .from("tasks")
                  .insert({ ...rest, user_id: currentUser2.id })
                  .select();
                if (!error && data) {
                  queryClient.invalidateQueries({ queryKey: ["tasks"] });
                }
              }
            }
            processedAutoKeys.current.add(expiredKey);
            const currentUser3 = useAuthStore.getState().user;
            if (currentUser3) {
              await supabase
                .from("properties")
                .update({ status: "vencida" })
                .eq("id", prop.id)
                .eq("user_id", currentUser3.id);
            }
            queryClient.invalidateQueries({ queryKey: ["properties"] });
            addActivityLog({
              type: "property",
              action: "status_changed",
              title: `Propiedad vencida: ${prop.title}`,
              description:
                "El contrato llegó a su fecha de fin y el estado pasó a Vencida",
              entityId: prop.id,
            });
          }
        }
      }
    };

    checkContractExpirations();
    const interval = setInterval(checkContractExpirations, 60000);
    return () => clearInterval(interval);
  }, [properties, tasks, addActivityLog, queryClient]);
}
