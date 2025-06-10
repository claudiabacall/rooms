// src/pages/RoomsPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Filter, PlusCircle, Loader2 } from "lucide-react"; // Añadimos Loader2
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import RoomCard from "@/components/rooms/RoomCard.jsx";
import RoomFilters from "@/components/rooms/RoomFilters.jsx";
import { fetchRooms } from "@/services/roomsService";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import useFavorites from "@/hooks/useFavorites"; // Importamos el hook de favoritos
import { Label } from "@/components/ui/label";

const RoomsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const initialSearch = queryParams.get("q") || "";

  const { user, loading: authLoading } = useAuth(); // Estado de carga de autenticación
  const { toast } = useToast();
  // Obtener funciones y estado del hook de favoritos
  const {
    favorites,
    loading: favoritesLoading,
    addFavorite,
    removeFavorite,
    isFavorite,
  } = useFavorites();

  const [allRooms, setAllRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true); // Renombrado para claridad
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [selectedType, setSelectedType] = useState("all");
  const [availableStartDate, setAvailableStartDate] = useState("");
  const [availableEndDate, setAvailableEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showOnlyMine, setShowOnlyMine] = useState(false);

  const loadRooms = useCallback(async () => {
    setLoadingRooms(true); // Usar el nuevo estado de carga para habitaciones
    setError(null);
    try {
      // Asegúrate de que fetchRooms traiga el host_profile.id
      // Por ejemplo, si tu fetchRooms hace un select('*') o un join con perfiles:
      // const { data, error } = await supabase.from('rooms').select('*, host_profile:profiles(id, full_name, avatar_url)');
      const data = await fetchRooms();
      setAllRooms(data);
    } catch (err) {
      console.error("Error loading rooms:", err);
      setError("No se pudieron cargar las habitaciones.");
      toast({
        title: "Error de carga",
        description: err.message || "Hubo un problema al cargar las habitaciones.",
        variant: "destructive",
      });
    } finally {
      setLoadingRooms(false);
    }
  }, [toast]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    let tempRooms = allRooms;

    if (showOnlyMine && user?.id) {
      // Filtra por el ID del host del piso (asumiendo room.host_profile.id existe)
      tempRooms = tempRooms.filter(room => room.host_profile?.id === user.id);
    }

    if (searchTerm) {
      const keywords = searchTerm.toLowerCase().split(" ").filter(Boolean);
      tempRooms = tempRooms.filter(room =>
        keywords.every(kw =>
          (room.title?.toLowerCase().includes(kw) || "") ||
          (room.location?.toLowerCase().includes(kw) || "") ||
          (room.address?.toLowerCase().includes(kw) || "") ||
          (room.description?.toLowerCase().includes(kw) || "") ||
          // También busca en las etiquetas de amenities (para búsqueda general de texto)
          (room.amenities || []).some(a => a.toLowerCase().includes(kw))
        )
      );
    }

    tempRooms = tempRooms.filter(room => {
      const price = room.price ?? 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    if (selectedAmenities.length > 0) {
      tempRooms = tempRooms.filter(room => {
        return selectedAmenities.every(amenityKey => room[amenityKey] === true);
      });
    }

    // Si 'type' no está en tu DB ni mapeado, esta sección no tendrá efecto.
    // if (selectedType !== "all") {
    //   tempRooms = tempRooms.filter(room => room.type === selectedType);
    // }

    if (availableStartDate) {
      const start = new Date(availableStartDate);
      tempRooms = tempRooms.filter(room =>
        room.availableFrom && new Date(room.availableFrom) >= start
      );
    }

    if (availableEndDate) {
      const end = new Date(availableEndDate);
      tempRooms = tempRooms.filter(room =>
        room.availableFrom && new Date(room.availableFrom) <= end
      );
    }

    setFilteredRooms(tempRooms);
  }, [
    searchTerm,
    priceRange,
    selectedAmenities,
    selectedType,
    availableStartDate,
    availableEndDate,
    showOnlyMine,
    allRooms,
    user // Asegúrate de que user esté como dependencia si usas user.id para filtrar
  ]);

  const handleAmenityChange = (amenityId) => {
    setSelectedAmenities(prev =>
      prev.includes(amenityId) ? prev.filter(a => a !== amenityId) : [...prev, amenityId]
    );
  };

  const resetFilters = () => {
    setSearchTerm("");
    setPriceRange([0, 2000]);
    setSelectedAmenities([]);
    setSelectedType("all");
    setAvailableStartDate("");
    setAvailableEndDate("");
    setShowOnlyMine(false);
    toast({
      title: "Filtros restablecidos",
      description: "Se han eliminado todos los filtros de búsqueda.",
    });
  };

  const handleRoomCardClick = (roomId) => {
    navigate(`/habitacion/${roomId}`); // Asegúrate de que esta ruta sea correcta para tu página de detalles
  };

  const handleAddRoomClick = () => {
    navigate("/crear-habitacion"); // Asegúrate de que esta ruta sea correcta
  };

  const suggestedRooms = allRooms
    .filter(room =>
      room.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.location?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, 3);

  // Unificamos los estados de carga
  if (loadingRooms || authLoading || favoritesLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <p className="ml-2 text-gray-600">Cargando habitaciones...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-12 text-center text-red-600">
        <h2 className="text-2xl font-semibold mb-4">Error al cargar habitaciones</h2>
        <p>{error}</p>
        <Button onClick={loadRooms} className="mt-4">Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 text-center"
      >
        <h1 className="text-4xl font-bold tracking-tight text-primary">Encuentra tu Próximo Piso</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Explora nuestra selección de pisos y filtra según tus preferencias y fechas disponibles.
        </p>
      </motion.div>

      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:max-w-md">
          <Input
            type="text"
            placeholder="Buscar por título, ubicación o características..."
            className="pl-10 pr-4 py-2 text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {user && ( // Solo muestra "Añadir Habitación" si el usuario está logueado
            <Button onClick={handleAddRoomClick} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Añadir Habitación
            </Button>
          )}

          <Button onClick={() => setShowFilters(!showFilters)} variant="outline" className="w-full sm:w-auto">
            <Filter className="mr-2 h-4 w-4" /> {showFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
          </Button>
          {user && ( // Solo muestra "Mis pisos/Todos" si el usuario está logueado
            <Button
              onClick={() => setShowOnlyMine(prev => !prev)}
              variant={showOnlyMine ? "default" : "outline"}
              className="w-full sm:w-auto"
            >
              {showOnlyMine ? "Viendo: Mis pisos" : "Viendo: Todos"}
            </Button>
          )}
        </div>
      </div>

      <RoomFilters
        showFilters={showFilters}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        selectedAmenities={selectedAmenities}
        handleAmenityChange={handleAmenityChange}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        resetFilters={resetFilters}
        availableStartDate={availableStartDate}
        setAvailableStartDate={setAvailableStartDate}
        availableEndDate={availableEndDate}
        setAvailableEndDate={setAvailableEndDate}
      />

      {filteredRooms.length > 0 ? (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {filteredRooms.map((room, index) => (
            <RoomCard
              key={room.id}
              room={room}
              index={index}
              onRoomClick={handleRoomCardClick}
              currentUser={user} // Pasamos el usuario actual
              isRoomFavorite={isFavorite(room.id)} // Pasamos si esta habitación es favorita
              onAddFavorite={addFavorite} // Pasamos la función para añadir a favoritos
              onRemoveFavorite={removeFavorite} // Pasamos la función para eliminar de favoritos
            />
          ))}
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
          <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No se encontraron pisos</h2>
          <p className="text-muted-foreground mb-4">Prueba a modificar tus filtros o el término de búsqueda.</p>

          {suggestedRooms.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Tal vez te interesen:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestedRooms.map((room, index) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    index={index}
                    onRoomClick={handleRoomCardClick}
                    currentUser={user} // Pasamos el usuario actual
                    isRoomFavorite={isFavorite(room.id)} // Pasamos si esta habitación es favorita
                    onAddFavorite={addFavorite} // Pasamos la función para añadir a favoritos
                    onRemoveFavorite={removeFavorite} // Pasamos la función para eliminar de favoritos
                  />
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default RoomsPage;