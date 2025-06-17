// src/pages/RoomsPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Filter, PlusCircle, Loader2, Edit, Trash2 } from "lucide-react"; // Añadimos Edit y Trash2
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import RoomCard from "@/components/rooms/RoomCard.jsx";
import RoomFilters from "@/components/rooms/RoomFilters.jsx";
// Importamos fetchRooms y la nueva fetchUserRooms
import { fetchRooms, fetchUserRooms, deleteRoom as deleteRoomService } from "@/services/roomsService";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import useFavorites from "@/hooks/useFavorites";
import { Label } from "@/components/ui/label";

const RoomsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const initialSearch = queryParams.get("q") || "";

  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const {
    favorites,
    loading: favoritesLoading,
    addFavorite,
    removeFavorite,
    isFavorite,
  } = useFavorites();

  const [allRooms, setAllRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [error, setError] = useState(null);

  // Estados para la paginación
  const [currentPage, setCurrentPage] = useState(0); // Página actual (0-indexed)
  const roomsPerPage = 100; // Cuántas habitaciones por página
  const [totalRoomsCount, setTotalRoomsCount] = useState(0); // Total de habitaciones disponibles en la DB

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [priceRange, setPriceRange] = useState([0, 50000]); // Valor inicial ajustado a 50000
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [selectedType, setSelectedType] = useState("all");
  const [availableStartDate, setAvailableStartDate] = useState("");
  const [availableEndDate, setAvailableEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showOnlyMine, setShowOnlyMine] = useState(false); // Estado para el filtro "Mis pisos"

  // Refactorizamos loadRooms para usar fetchRooms o fetchUserRooms
  const loadRooms = useCallback(async () => {
    setLoadingRooms(true);
    setError(null);
    try {
      const offset = currentPage * roomsPerPage;
      let data, count;

      if (showOnlyMine && user?.id) {
        // Si el filtro "Mis pisos" está activo y hay un usuario, usa fetchUserRooms
        ({ data, count } = await fetchUserRooms(user.id, offset, roomsPerPage));
      } else {
        // De lo contrario, usa fetchRooms para todos (o según RLS)
        ({ data, count } = await fetchRooms(offset, roomsPerPage));
      }

      console.log("Datos recibidos de fetchRooms (o fetchUserRooms):", data, "Total de habitaciones (count):", count); // Debugging
      setAllRooms(prevRooms => {
        // Si la página es 0 o el filtro cambia, reinicia la lista
        return currentPage === 0 ? data : [...prevRooms, ...data];
      });
      setTotalRoomsCount(count);
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
  }, [toast, currentPage, roomsPerPage, showOnlyMine, user]); // Añade showOnlyMine y user como dependencias

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  // Resetear la paginación al cambiar filtros o búsqueda (y al cambiar showOnlyMine)
  useEffect(() => {
    setCurrentPage(0); // Reinicia a la primera página al aplicar cualquier filtro
    // Cuando showOnlyMine cambia, necesitamos recargar desde la DB, no solo filtrar el estado local
    // El useEffect de loadRooms ya se encarga de esto al tener showOnlyMine como dependencia
  }, [
    searchTerm,
    priceRange,
    selectedAmenities,
    selectedType,
    availableStartDate,
    availableEndDate,
    showOnlyMine, // Importante: dependencia para que se active cuando cambia "Mis pisos"
  ]);


  // Aplica los filtros locales (excepto showOnlyMine que ya se maneja en loadRooms)
  useEffect(() => {
    let tempRooms = allRooms;
    console.log("allRooms al inicio del filtro local (para debug):", allRooms); // Debugging

    if (searchTerm) {
      const keywords = searchTerm.toLowerCase().split(" ").filter(Boolean);
      tempRooms = tempRooms.filter(room =>
        keywords.every(kw =>
          (room.title?.toLowerCase().includes(kw) || "") ||
          (room.location?.toLowerCase().includes(kw) || "") ||
          (room.address?.toLowerCase().includes(kw) || "") ||
          (room.description?.toLowerCase().includes(kw) || "") ||
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
        const roomAmenities = Array.isArray(room.amenities) ? room.amenities : [];
        return selectedAmenities.every(amenityKey => roomAmenities.includes(amenityKey));
      });
    }

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
    console.log("filteredRooms final (para debug):", tempRooms); // Debugging
  }, [
    searchTerm,
    priceRange,
    selectedAmenities,
    selectedType,
    availableStartDate,
    availableEndDate,
    allRooms, // allRooms es la base para los filtros locales
  ]);

  const handleAmenityChange = (amenityId) => {
    setSelectedAmenities(prev =>
      prev.includes(amenityId) ? prev.filter(a => a !== amenityId) : [...prev, amenityId]
    );
  };

  const resetFilters = () => {
    setSearchTerm("");
    setPriceRange([0, 50000]); // Reinicia el rango de precio a [0, 50000]
    setSelectedAmenities([]);
    setSelectedType("all");
    setAvailableStartDate("");
    setAvailableEndDate("");
    setShowOnlyMine(false); // También resetea este filtro
    toast({
      title: "Filtros restablecidos",
      description: "Se han eliminado todos los filtros de búsqueda.",
    });
  };

  const handleRoomCardClick = (roomId) => {
    navigate(`/habitaciones/${roomId}`);
  };

  const handleAddRoomClick = () => {
    navigate("/crear-habitacion");
  };

  const handleLoadMore = () => {
    setCurrentPage(prevPage => prevPage + 1);
  };

  // Manejadores para Editar y Eliminar (similares a MyPropertiesPage)
  const handleEditRoom = (roomId) => {
    navigate(`/editar-habitacion/${roomId}`);
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta propiedad? Esta acción es irreversible.")) {
      return;
    }
    setLoadingRooms(true); // Podrías usar un estado de carga más granular si lo necesitas
    try {
      await deleteRoomService(roomId); // Usa la función importada

      toast({
        title: "Propiedad eliminada",
        description: "La propiedad ha sido eliminada exitosamente.",
        variant: "default",
      });
      // Después de eliminar, recarga las habitaciones para actualizar la vista
      loadRooms();

    } catch (error) {
      console.error("Error deleting room:", error);
      toast({
        title: "Error al eliminar",
        description: error.message || "No se pudo eliminar la propiedad.",
        variant: "destructive",
      });
    } finally {
      setLoadingRooms(false);
    }
  };


  // Se muestra el botón "Ver Siguiente Página" si hay más habitaciones cargadas o por cargar
  const hasMoreRooms = (currentPage + 1) * roomsPerPage < totalRoomsCount;

  // Las sugerencias siempre se basan en allRooms (que ahora carga "todos" o "mis pisos" según el filtro showOnlyMine)
  const suggestedRooms = allRooms
    .filter(room =>
      room.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.location?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, 100);

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
          {user && (
            <Button onClick={handleAddRoomClick} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Añadir Habitación
            </Button>
          )}

          <Button onClick={() => setShowFilters(!showFilters)} variant="outline" className="w-full sm:w-auto">
            <Filter className="mr-2 h-4 w-4" /> {showFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
          </Button>
          {user && (
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
              currentUser={user}
              isRoomFavorite={isFavorite(room.id)}
              onAddFavorite={addFavorite}
              onRemoveFavorite={removeFavorite}
              // Añade actionsComponent solo si showOnlyMine es true y es la propiedad del usuario
              actionsComponent={showOnlyMine && user && room.host_id === user.id ? (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditRoom(room.id);
                    }}
                    title="Editar Propiedad"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRoom(room.id);
                    }}
                    title="Eliminar Propiedad"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              ) : null}
            />
          ))}
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
          <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No se encontraron pisos</h2>
          <p className="text-muted-foreground mb-4">Prueba a modificar tus filtros o el término de búsqueda.</p>

          {/* Mostrar sugerencias si no hay resultados filtrados */}
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
                    currentUser={user}
                    isRoomFavorite={isFavorite(room.id)}
                    onAddFavorite={addFavorite}
                    onRemoveFavorite={removeFavorite}
                  />
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Botón para cargar más habitaciones */}
      {filteredRooms.length > 0 && hasMoreRooms && (
        <div className="mt-8 text-center">
          <Button onClick={handleLoadMore} disabled={loadingRooms}>
            {loadingRooms ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...
              </>
            ) : (
              "Ver Siguiente Página"
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default RoomsPage;