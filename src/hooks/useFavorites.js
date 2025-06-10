// src/hooks/useFavorites.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from "@/components/ui/use-toast";

const useFavorites = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState([]); // Array de room_id favoritos
  const [loading, setLoading] = useState(true);

  // Función para obtener los IDs de las habitaciones favoritas del usuario desde Supabase
  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('room_id') // Solo seleccionamos el room_id
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setFavorites(data ? data.map(fav => fav.room_id) : []);

    } catch (err) {
      console.error("Error al cargar favoritos desde Supabase:", err.message);
      toast({
        title: "Error al cargar favoritos",
        description: err.message,
        variant: "destructive",
      });
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // useEffect para cargar los favoritos iniciales y configurar la suscripción en tiempo real
  useEffect(() => {
    fetchFavorites();

    const favoriteChanges = supabase
      .channel('public:favorites_room_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'favorites', filter: `user_id=eq.${user?.id}` },
        (payload) => {
          console.log('Cambio en tiempo real en favoritos (rooms):', payload);
          // Si el cambio proviene de nuestra propia sesión, no necesitamos refetch.
          // Pero si viene de otro lugar (ej. otro dispositivo), sí.
          // La forma más simple para un UI optimista es refetch siempre,
          // o hacer una lógica más compleja para fusionar/eliminar.
          // Para este caso, mantener `fetchFavorites()` es seguro y nos asegura consistencia.
          fetchFavorites();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Suscrito al canal de favoritos (rooms) de Supabase.');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error al suscribirse al canal de favoritos (rooms):', status);
        }
      });

    return () => {
      supabase.removeChannel(favoriteChanges);
    };

  }, [user, fetchFavorites]);

  // Función para añadir una habitación a favoritos en Supabase (con UI optimista)
  const addFavorite = useCallback(async (roomId, roomNameOrTitle = 'Habitación') => {
    if (!user) {
      toast({
        title: "No autenticado",
        description: "Necesitas iniciar sesión para añadir habitaciones a favoritos.",
        variant: "destructive",
      });
      return;
    }

    if (!roomId) {
      console.error("useFavorites: Intento de añadir favorito inválido. Falta el roomId.");
      toast({
        title: "Error al añadir",
        description: "No se pudo añadir la habitación. Falta el ID.",
        variant: "destructive",
      });
      return;
    }

    // --- Inicio de UI Optimista ---
    const isAlreadyFavorite = favorites.includes(roomId);
    if (isAlreadyFavorite) {
      // Si ya está en la UI, no hacemos nada más, ya está "favorito"
      toast({
        title: "Ya en favoritos",
        description: `La ${roomNameOrTitle} ya está en tu lista de favoritos.`,
      });
      return;
    }

    // Añadir inmediatamente a la lista de favoritos en el estado local
    setFavorites(prevFavorites => [...prevFavorites, roomId]);
    // --- Fin de UI Optimista ---

    try {
      const { error } = await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          room_id: roomId,
        });

      if (error) {
        if (error.code === '23505') { // Si hay un conflicto UNIQUE, significa que ya estaba en DB
          toast({
            title: "Ya en favoritos",
            description: `La ${roomNameOrTitle} ya estaba en tus favoritos (error de duplicado).`,
          });
          // Si el error es por duplicado, no revertimos porque la UI ya lo muestra como favorito
        } else {
          throw error; // Otros errores, que deberían revertir
        }
      } else {
        toast({
          title: "Añadido a favoritos",
          description: `${roomNameOrTitle} guardada con éxito.`,
        });
      }
    } catch (err) {
      console.error("Error al añadir favorito en Supabase:", err.message);
      toast({
        title: "Error al añadir favorito",
        description: err.message,
        variant: "destructive",
      });
      // --- Revertir UI Optimista si falla la operación en Supabase (solo si no es un duplicado preexistente) ---
      if (err.code !== '23505') { // Si el error NO es por duplicado, revertimos el estado local
        setFavorites(prevFavorites => prevFavorites.filter(id => id !== roomId));
      }
    }
  }, [user, toast, favorites]); // favorites es una dependencia ahora

  // Función para eliminar una habitación de favoritos en Supabase (con UI optimista)
  const removeFavorite = useCallback(async (roomId, roomNameOrTitle = 'Habitación') => {
    if (!user) return;

    // --- Inicio de UI Optimista ---
    const isCurrentlyFavorite = favorites.includes(roomId);
    if (!isCurrentlyFavorite) {
      // Si no está en la UI, no hacemos nada
      return;
    }

    // Eliminar inmediatamente de la lista de favoritos en el estado local
    setFavorites(prevFavorites => prevFavorites.filter(id => id !== roomId));
    // --- Fin de UI Optimista ---

    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('room_id', roomId);

      if (error) {
        throw error; // Lanza el error para ser capturado en el catch
      }

      toast({
        title: "Eliminado de favoritos",
        description: `${roomNameOrTitle} eliminada de tus favoritos.`,
      });
    } catch (err) {
      console.error("Error al eliminar favorito en Supabase:", err.message);
      toast({
        title: "Error al eliminar favorito",
        description: err.message,
        variant: "destructive",
      });
      // --- Revertir UI Optimista si falla la operación en Supabase ---
      setFavorites(prevFavorites => [...prevFavorites, roomId]); // Volvemos a añadirlo
    }
  }, [user, toast, favorites]); // favorites es una dependencia ahora

  // La función isFavorite permanece igual
  const isFavorite = useCallback((roomId) => {
    return favorites.includes(roomId);
  }, [favorites]);

  return { favorites, loading, addFavorite, removeFavorite, isFavorite, fetchFavorites };
};

export default useFavorites;