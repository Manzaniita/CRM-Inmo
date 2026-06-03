import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import type { Property } from '../types';

const PROPERTIES_KEY = ['properties'] as const;

async function fetchProperties(userId: string): Promise<Property[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('user_id', userId)
    .order('createdAt', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as Property[]) ?? [];
}

export function useProperties() {
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);
  const showToast = useUIStore(state => state.showToast);

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
      const { error } = await supabase
        .from('properties')
        .update(property)
        .eq('id', property.id)
        .eq('user_id', user.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROPERTIES_KEY });
      showToast('Propiedad actualizada', 'success');
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
