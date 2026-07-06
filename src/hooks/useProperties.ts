import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import type { Property } from '../types';
import { useActivityLogs } from './useActivityLogs';

const PROPERTIES_KEY = ['properties'] as const;

async function fetchProperties(userId: string): Promise<Property[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }

  return (data as Property[]) ?? [];
}

export function useProperties() {
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);
  const showToast = useUIStore(state => state.showToast);
  const { addActivityLog } = useActivityLogs();

  const {
    data: properties = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: PROPERTIES_KEY,
    queryFn: () => fetchProperties(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  if (error) {
    showToast(`Error al cargar propiedades: ${(error as Error).message}`, 'error');
  }

  const addProperty = useMutation({
    mutationFn: async (property: Property) => {
      if (!user) throw new Error('No hay sesión activa');
      const { error } = await supabase
        .from('properties')
        .insert({ ...property, user_id: user.id });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROPERTIES_KEY });
      showToast('Propiedad añadida', 'success');
    },
    onError: (err: Error) => {
      showToast(err.message || 'Error al añadir propiedad', 'error');
    },
  });

  const updateProperty = useMutation({
    mutationFn: async (property: Property) => {
      if (!user) throw new Error('No hay sesión activa');
      const previous = queryClient.getQueryData<Property[]>(PROPERTIES_KEY)?.find(p => p.id === property.id);

      // Prórroga automática: si la propiedad estaba vencida y se actualiza
      // la fecha de fin de contrato a una fecha futura, reactivarla.
      let updateData: Property = property;
      if (
        previous?.status === 'vencida' &&
        property.status === 'vencida' &&
        property.contractEndDate
      ) {
        const end = new Date(property.contractEndDate);
        end.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (end > today) {
          updateData = { ...property, status: 'disponible' };
        }
      }

      // Auditoría de cambios de precio
      if (previous && previous.price !== updateData.price) {
        const entry = { date: new Date().toISOString(), price: updateData.price };
        const existingHistory = updateData.priceHistory || previous.priceHistory || [];
        // Evitar duplicar entrada consecutiva idéntica
        const lastEntry = existingHistory[existingHistory.length - 1];
        if (!lastEntry || lastEntry.price !== entry.price) {
          updateData = { ...updateData, priceHistory: [...existingHistory, entry] };
        }
      }

      const { error } = await supabase
        .from('properties')
        .update(updateData)
        .eq('id', property.id)
        .eq('user_id', user.id);
      if (error) throw new Error(error.message);
      return { property: updateData, previous };
    },
    onSuccess: ({ property, previous }) => {
      queryClient.invalidateQueries({ queryKey: PROPERTIES_KEY });
      showToast('Propiedad actualizada', 'success');

      if (previous) {
        if (previous.price !== property.price) {
          addActivityLog({
            type: 'property',
            action: 'updated',
            title: `Precio actualizado: ${property.price} ${property.currency}`,
            description: `Anterior: ${previous.price} ${previous.currency}`,
            entityId: property.id,
          });
        }
        if (previous.status !== property.status) {
          addActivityLog({
            type: 'property',
            action: 'status_changed',
            title: `Estado cambiado a ${property.status}`,
            description: `Anterior: ${previous.status}`,
            entityId: property.id,
          });
        }
        if (previous.title !== property.title) {
          addActivityLog({
            type: 'property',
            action: 'updated',
            title: `Título actualizado: ${property.title}`,
            entityId: property.id,
          });
        }
      }
    },
    onError: (err: Error) => {
      showToast(err.message || 'Error al actualizar propiedad', 'error');
    },
  });

  const deleteProperty = useMutation({
    mutationFn: async (propertyId: string) => {
      if (!user) throw new Error('No hay sesión activa');
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId)
        .eq('user_id', user.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROPERTIES_KEY });
      showToast('Propiedad eliminada', 'info');
    },
    onError: (err: Error) => {
      showToast(err.message || 'Error al eliminar propiedad', 'error');
    },
  });

  return {
    properties,
    isLoading,
    addProperty: addProperty.mutateAsync,
    updateProperty: updateProperty.mutateAsync,
    deleteProperty: deleteProperty.mutateAsync,
  };
}
