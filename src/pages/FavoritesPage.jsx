// src/pages/FavoritesPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import useFavorites from '@/hooks/useFavorites'; // Asegúrate que esta ruta sea correcta
import { supabase } from '@/supabaseClient'; // Necesario para obtener los detalles de las habitaciones
import { useAuth } from '@/contexts/SupabaseAuthContext'; // Para verificar si el usuario está logueado
import { Link } from 'react-router-dom'; // Para navegar a la página de detalles de la habitación
import { HeartCrack, Loader2 } from 'lucide-react'; // Iconos para favoritos vacíos y carga
import { Button } from '@/components/ui/button'; // Si usas componentes Shadcn/ui
import RoomCard from '@/components/rooms/RoomCard.jsx'; // ¡Importamos el RoomCard!

const FavoritesPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { favorites, loading: favoritesLoading, removeFavorite, addFavorite, isFavorite } = useFavorites();
  const [favoriteRoomsDetails, setFavoriteRoomsDetails] = useState([]);
  const [fetchingRoomDetails, setFetchingRoomDetails] = useState(true);

  // Función para obtener los detalles completos de las habitaciones favoritas
  const fetchFavoriteRoomDetails = useCallback(async (roomIds) => {
    if (roomIds.length === 0) {
      setFavoriteRoomsDetails([]);
      setFetchingRoomDetails(false);
      return;
    }

    setFetchingRoomDetails(true);
    try {
      const { data, error } = await supabase
        .from('rooms')
        // Selecciona todas las columnas, incluyendo 'image_urls' y 'host_profile'
        .select('*, host_profile:profiles(id, full_name, avatar_url)')
        .in('id', roomIds); // Filtra directamente en la base de datos

      if (error) {
        throw error;
      }

      // IMPORTANTE: Mapear la columna 'image_urls' a 'imageUrl'
      const mappedRooms = data.map(room => ({
        ...room,
        // Si 'image_urls' es un array, toma el primer elemento.
        // Si puede ser null o vacío, proporciona un fallback.
        imageUrl: (room.image_urls && room.image_urls.length > 0) ? room.image_urls[0] : null,
      }));

      setFavoriteRoomsDetails(mappedRooms || []);

    } catch (err) {
      console.error("Error al obtener detalles de habitaciones favoritas:", err.message);
      setFavoriteRoomsDetails([]);
    } finally {
      setFetchingRoomDetails(false);
    }
  }, []);

  // useEffect para re-obtener los detalles de las habitaciones cuando cambian los favorites
  useEffect(() => {
    if (!favoritesLoading && favorites) {
      fetchFavoriteRoomDetails(favorites);
    }
  }, [favorites, favoritesLoading, fetchFavoriteRoomDetails]);

  // Manejo de estados de carga y autenticación
  if (authLoading || favoritesLoading || fetchingRoomDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <p className="ml-2 text-gray-600">Cargando favoritos...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <p className="text-xl font-semibold mb-4">Inicia sesión para ver tus favoritos.</p>
        <Link to="/login">
          <Button>Iniciar Sesión</Button>
        </Link>
      </div>
    );
  }

  if (favoriteRoomsDetails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <HeartCrack className="h-24 w-24 text-gray-400 mb-6" />
        <h2 className="text-2xl font-bold mb-2">Aún no tienes favoritos</h2>
        <p className="text-gray-600 mb-6">Empieza a explorar y guarda los pisos que más te gusten.</p>
        <Link to="/habitaciones">
          <Button>Buscar Habitaciones</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pt-12">
      <h1 className="text-3xl font-bold mb-8 text-center">Tus Habitaciones Favoritas</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {favoriteRoomsDetails.map((room) => (
          <RoomCard
            key={room.id}
            room={room} // Este 'room' ahora tiene la propiedad 'imageUrl' gracias al mapeo
            currentUser={user}
            isRoomFavorite={isFavorite(room.id)}
            onAddFavorite={addFavorite}
            onRemoveFavorite={removeFavorite}
          />
        ))}
      </div>
    </div>
  );
};

export default FavoritesPage;