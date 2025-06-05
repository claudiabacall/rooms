
import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";

const useFavorites = () => {
  const [favorites, setFavorites] = useState([]); // Puede contener tanto perfiles de usuario como propiedades
  const { toast } = useToast();

  useEffect(() => {
    const storedFavorites = localStorage.getItem('userFavorites');
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
    }
  }, []);

  const addFavorite = useCallback((item) => { // item debe tener un 'id' y un 'type' ('user' o 'property')
    if (!item || !item.id || !item.type) {
        console.error("Intento de añadir favorito inválido:", item);
        return;
    }
    setFavorites(prevFavorites => {
      if (prevFavorites.some(fav => fav.id === item.id && fav.type === item.type)) {
        return prevFavorites; // Ya es favorito
      }
      const updatedFavorites = [...prevFavorites, item];
      localStorage.setItem('userFavorites', JSON.stringify(updatedFavorites));
      toast({
        title: "Añadido a Favoritos",
        description: `${item.name || item.title || 'Elemento'} guardado.`,
      });
      return updatedFavorites;
    });
  }, [toast]);

  const removeFavorite = useCallback((itemId, itemType) => {
    setFavorites(prevFavorites => {
      const updatedFavorites = prevFavorites.filter(fav => !(fav.id === itemId && fav.type === itemType));
      if (updatedFavorites.length < prevFavorites.length) {
          localStorage.setItem('userFavorites', JSON.stringify(updatedFavorites));
          toast({
            title: "Eliminado de Favoritos",
            description: "Elemento eliminado de tu lista.",
          });
      }
      return updatedFavorites;
    });
  }, [toast]);

  const isFavorite = useCallback((itemId, itemType) => {
    return favorites.some(fav => fav.id === itemId && fav.type === itemType);
  }, [favorites]);

  return { favorites, addFavorite, removeFavorite, isFavorite };
};

export default useFavorites;
