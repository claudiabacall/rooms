// src/components/rooms/RoomFilters.jsx
import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input"; // Importar el componente Input
import {
  X,
  Wifi,
  Utensils,
  Bath,
  ParkingCircle,
  Bed,
  Tv,
  Fan,
  WashingMachine,
} from "lucide-react";

// Lista de comodidades, con IDs que coinciden con las claves booleanas de tu DB
const amenitiesList = [
  { id: "has_wifi", label: "Wi-Fi", icon: <Wifi className="h-4 w-4 mr-2" /> },
  { id: "has_kitchen_access", label: "Acceso Cocina", icon: <Utensils className="h-4 w-4 mr-2" /> },
  { id: "has_private_bathroom", label: "Baño Privado", icon: <Bath className="h-4 w-4 mr-2" /> },
  { id: "has_parking", label: "Parking", icon: <ParkingCircle className="h-4 w-4 mr-2" /> },
  { id: "is_furnished", label: "Amueblado", icon: <Bed className="h-4 w-4 mr-2" /> },
  { id: "has_tv", label: "TV", icon: <Tv className="h-4 w-4 mr-2" /> },
  { id: "has_air_condition", label: "Aire Acondicionado", icon: <Fan className="h-4 w-4 mr-2" /> },
  { id: "has_washing_room", label: "Lavadora", icon: <WashingMachine className="h-4 w-4 mr-2" /> },
];

const roomTypes = ["all", "Privada", "Compartida", "Estudio", "Apartamento", "Loft", "Ático"];

const RoomFilters = ({
  showFilters,
  priceRange,
  setPriceRange,
  selectedAmenities,
  handleAmenityChange,
  selectedType,
  setSelectedType,
  resetFilters,
  availableStartDate,
  setAvailableStartDate,
  availableEndDate,
  setAvailableEndDate
}) => {

  // Manejador para los inputs de precio
  const handleMinPriceChange = (e) => {
    const value = Number(e.target.value);
    // Asegurarse de que el valor no sea NaN y esté dentro de los límites
    const newMin = isNaN(value) ? 0 : Math.max(0, Math.min(value, priceRange[1]));
    setPriceRange([newMin, priceRange[1]]);
  };

  const handleMaxPriceChange = (e) => {
    const value = Number(e.target.value);
    const newMax = isNaN(value) ? 50000 : Math.min(Math.max(value, priceRange[0]), 50000);
    setPriceRange([priceRange[0], newMax]);
  };

  return (
    <motion.div
      initial={false}
      animate={{ height: showFilters ? "auto" : 0, opacity: showFilters ? 1 : 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden"
    >
      <Card className="mb-8 p-6 bg-muted/50 border-dashed">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Precio */}
          <div>
            <Label htmlFor="price-range" className="text-lg font-semibold mb-2 block">Rango de Precio (€)</Label>
            <Slider
              id="price-range"
              min={0}
              max={50000} // Ajustado a 50.000
              step={10}
              value={priceRange}
              onValueChange={setPriceRange}
              className="my-4"
            />
            {/* Inputs para introducir valores de precio */}
            <div className="flex justify-between items-center gap-2 mt-2">
              <Input
                type="number"
                min="0"
                max="50000" // Coincide con el max del slider
                placeholder="Mín."
                value={priceRange[0]}
                onChange={handleMinPriceChange}
                className="w-1/2 p-2 text-sm"
              />
              <span className="text-muted-foreground">-</span>
              <Input
                type="number"
                min="0"
                max="50000" // Coincide con el max del slider
                placeholder="Máx."
                value={priceRange[1]}
                onChange={handleMaxPriceChange}
                className="w-1/2 p-2 text-sm"
              />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground mt-2">
              <span>€{priceRange[0]}</span>
              <span>€{priceRange[1]}</span>
            </div>
          </div>

          {/* Comodidades */}
          <div>
            <Label className="text-lg font-semibold mb-2 block">Comodidades</Label>
            <div className="grid grid-cols-2 gap-2">
              {amenitiesList.map(amenity => (
                <div key={amenity.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`filter-${amenity.id}`}
                    checked={selectedAmenities.includes(amenity.id)}
                    onCheckedChange={() => handleAmenityChange(amenity.id)}
                  />
                  <Label htmlFor={`filter-${amenity.id}`} className="flex items-center text-sm font-normal cursor-pointer">
                    {amenity.icon} {amenity.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Tipo de habitación (funcionalidad pendiente de campo 'type' en DB) */}
          <div>
            <Label htmlFor="room-type" className="text-lg font-semibold mb-2 block">Tipo de Piso/Habitación</Label>
            <select
              id="room-type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full p-2 border rounded-md bg-background"
            >
              {roomTypes.map(type => (
                <option key={type} value={type}>
                  {type === "all" ? "Todos los tipos" : type}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha desde */}
          <div>
            <Label htmlFor="available-start-date" className="text-lg font-semibold mb-2 block">
              Disponible desde
            </Label>
            <input
              type="date"
              id="available-start-date"
              value={availableStartDate}
              onChange={(e) => setAvailableStartDate(e.target.value)}
              className="w-full p-2 border rounded-md bg-background"
            />
          </div>

          {/* Fecha hasta */}
          <div>
            <Label htmlFor="available-end-date" className="text-lg font-semibold mb-2 block">
              Disponible hasta
            </Label>
            <input
              type="date"
              id="available-end-date"
              value={availableEndDate}
              onChange={(e) => setAvailableEndDate(e.target.value)}
              className="w-full p-2 border rounded-md bg-background"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={resetFilters} variant="ghost">
            <X className="mr-2 h-4 w-4" /> Restablecer Filtros
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

export default RoomFilters;