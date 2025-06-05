// src/pages/RoomsPage.jsx
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Filter } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import RoomCard from "@/components/rooms/RoomCard.jsx";
import RoomFilters from "@/components/rooms/RoomFilters.jsx";
import { fetchRooms } from "@/services/roomsService";
import { useAuth } from "@/contexts/SupabaseAuthContext"; // <--- Corrected import path

const RoomsPage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialSearch = queryParams.get("q") || "";

  const { user } = useAuth();
  const { toast } = useToast();

  const [allRooms, setAllRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [selectedType, setSelectedType] = useState("all");
  const [availableStartDate, setAvailableStartDate] = useState("");
  const [availableEndDate, setAvailableEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showOnlyMine, setShowOnlyMine] = useState(false);

  useEffect(() => {
    const loadRooms = async () => {
      // You might want to add error handling here as well
      const data = await fetchRooms();
      setAllRooms(data);
    };
    loadRooms();
  }, []);

  useEffect(() => {
    let tempRooms = allRooms;

    if (showOnlyMine && user?.id) {
      tempRooms = tempRooms.filter(room => room.userId === user.id);
    }

    if (searchTerm) {
      const keywords = searchTerm.toLowerCase().split(" ");
      tempRooms = tempRooms.filter(room =>
        keywords.every(kw =>
          (room.title?.toLowerCase().includes(kw) || "") ||
          (room.location?.toLowerCase().includes(kw) || "") ||
          (room.type?.toLowerCase().includes(kw) || "") ||
          (room.amenities || []).some(a => a.toLowerCase().includes(kw))
        )
      );
    }

    tempRooms = tempRooms.filter(room => {
      const price = room.price ?? 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    if (selectedAmenities.length > 0) {
      tempRooms = tempRooms.filter(room =>
        Array.isArray(room.amenities) &&
        selectedAmenities.every(a => room.amenities.includes(a))
      );
    }

    if (selectedType !== "all") {
      tempRooms = tempRooms.filter(room => room.type === selectedType);
    }

    if (availableStartDate) {
      const start = new Date(availableStartDate);
      tempRooms = tempRooms.filter(room =>
        room.disponibleDesde && new Date(room.disponibleDesde) <= start
      );
    }

    if (availableEndDate) {
      const end = new Date(availableEndDate);
      tempRooms = tempRooms.filter(room =>
        room.disponibleHasta && new Date(room.disponibleHasta) >= end
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
    user
  ]);

  const handleAmenityChange = (amenity) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const resetFilters = () => {
    setSearchTerm("");
    setPriceRange([0, 1000]);
    setSelectedAmenities([]);
    setSelectedType("all");
    setAvailableStartDate("");
    setAvailableEndDate("");
    toast({
      title: "Filtros restablecidos",
      description: "Se han eliminado todos los filtros de búsqueda.",
    });
  };

  // This `suggestedRooms` logic is only for the "No se encontraron pisos" case.
  // It won't affect the main filtered results.
  const suggestedRooms = allRooms
    .filter(room =>
      room.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.location?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, 3);

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

        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={() => setShowFilters(!showFilters)} variant="outline">
            <Filter className="mr-2 h-4 w-4" /> {showFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
          </Button>
          <Button
            onClick={() => setShowOnlyMine(prev => !prev)}
            variant={showOnlyMine ? "default" : "outline"}
          >
            {showOnlyMine ? "Viendo: Mis pisos" : "Viendo: Todos"}
          </Button>
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
            <RoomCard key={room.id} room={room} index={index} />
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
                  <RoomCard key={room.id} room={room} index={index} />
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