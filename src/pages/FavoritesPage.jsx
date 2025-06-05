// src/hooks/useFavorites.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabaseClient'; // Make sure this path is correct
import { useAuth } from '@/contexts/SupabaseAuthContext'; // Make sure this path is correct
import { useToast } from "@/components/ui/use-toast"; // For displaying notifications

// Assuming you have a table in Supabase like this:
// CREATE TABLE user_favorites (
//   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
//   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
//   item_id UUID, -- Or TEXT, depending on your item IDs (e.g., room_id, profile_id)
//   item_type TEXT, -- 'user' or 'property' or 'community'
//   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
//   UNIQUE (user_id, item_id, item_type) -- Ensures a user can't favorite the same item multiple times
// );
// You will also need RLS policies on this table for SELECT, INSERT, DELETE

const useFavorites = () => {
  const { user } = useAuth(); // Get the current authenticated user
  const { toast } = useToast();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  // Function to fetch favorites for the current user
  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_favorites') // Replace with your actual Supabase favorites table name
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // Convert the fetched raw favorite data into a more usable format
      // You'll need to decide how to fetch the actual item details (room, profile)
      // For now, we'll just store the raw favorite metadata.
      // In a real app, you'd likely fetch the full item details here or in the consuming component.
      setFavorites(data || []);

    } catch (err) {
      console.error("Error fetching favorites:", err.message);
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

  useEffect(() => {
    fetchFavorites();

    // Set up real-time listener for user_favorites changes
    // This is optional but provides immediate updates if favorites change elsewhere
    const favoriteChanges = supabase
      .channel('favorites_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_favorites', filter: `user_id=eq.${user?.id}` },
        (payload) => {
          console.log('Realtime favorite change:', payload);
          // Refetch favorites to ensure the list is up-to-date
          fetchFavorites();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(favoriteChanges);
    };

  }, [user, fetchFavorites]); // Re-run effect if user or fetchFavorites changes

  // Function to add an item to favorites
  const addFavorite = useCallback(async (itemToAdd) => {
    if (!user) {
      toast({
        title: "No autenticado",
        description: "Inicia sesión para guardar favoritos.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .insert({
          user_id: user.id,
          item_id: itemToAdd.id, // ID of the room, profile, etc.
          item_type: itemToAdd.type, // 'user', 'property', 'community'
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // PostgreSQL unique violation error code
          toast({
            title: "Ya en favoritos",
            description: "Este elemento ya está en tus favoritos.",
          });
        } else {
          throw error;
        }
      } else {
        setFavorites(prev => [...prev, data]); // Add the new favorite metadata
        toast({
          title: "Añadido a favoritos",
          description: "Elemento guardado con éxito.",
        });
      }
    } catch (err) {
      console.error("Error adding favorite:", err.message);
      toast({
        title: "Error al añadir favorito",
        description: err.message,
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Function to remove an item from favorites
  const removeFavorite = useCallback(async (itemId, itemType) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('item_id', itemId)
        .eq('item_type', itemType);

      if (error) {
        throw error;
      }

      setFavorites(prev => prev.filter(fav => !(fav.item_id === itemId && fav.item_type === itemType)));
      toast({
        title: "Eliminado de favoritos",
        description: "Elemento eliminado de tus favoritos.",
      });
    } catch (err) {
      console.error("Error removing favorite:", err.message);
      toast({
        title: "Error al eliminar favorito",
        description: err.message,
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Function to check if an item is favorited
  const isFavorite = useCallback((itemId, itemType) => {
    return favorites.some(fav => fav.item_id === itemId && fav.item_type === itemType);
  }, [favorites]);

  return { favorites, loading, addFavorite, removeFavorite, isFavorite };
};

export default useFavorites;