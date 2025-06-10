import React from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Euro, Calendar, Bed, Maximize, Heart } from "lucide-react"; // Importar icono Heart
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// RoomCard ahora recibe 'room', 'actionsComponent', 'onRoomClick',
// y las nuevas props para la lógica de favoritos y usuario:
// 'currentUser', 'isRoomFavorite', 'onAddFavorite', 'onRemoveFavorite'
const RoomCard = ({
  room,
  actionsComponent,
  onRoomClick,
  currentUser,        // El usuario actualmente logueado (objeto user de Supabase)
  isRoomFavorite,     // true/false si la habitación es favorita del usuario actual
  onAddFavorite,      // Función para añadir a favoritos
  onRemoveFavorite,   // Función para eliminar de favoritos
}) => {
  const displayPrice = room.price || 'N/A';
  const displayLocation = room.address && room.location ? `${room.address}, ${room.location}` : 'Ubicación no especificada';
  const displayAmenities = room.amenities?.length > 0 ? room.amenities.join(", ") : "Ninguna";
  const displayAvailableFrom = room.availableFrom ? new Date(room.availableFrom).toLocaleDateString('es-ES') : 'N/A';
  const displayRoomType = 'Habitación'; // Mantener si no tienes 'room_type' en DB

  const hostAvatarInitial = room.host_profile?.full_name
    ? room.host_profile.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "UN"; // Unknown

  // Determinar si el usuario actual es el dueño de la habitación
  const isMyRoom = currentUser && room.host_profile?.id === currentUser.id;

  // Manejador para el botón de favoritos
  const handleFavoriteToggle = (e) => {
    e.stopPropagation(); // Evita que el click en el botón active el click en la tarjeta
    if (isRoomFavorite) {
      onRemoveFavorite(room.id, room.title || room.name);
    } else {
      onAddFavorite(room.id, room.title || room.name);
    }
  };

  return (
    <Card
      className="hover:shadow-lg transition-shadow relative h-full flex flex-col"
    // Quitamos el onClick de la Card para manejarlo explícitamente en el Link o un wrapper
    >
      {/* IMAGEN DE PORTADA */}
      {room.imageUrl && (
        <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
          <Link to={`/habitacion/${room.id}`} className="block"> {/* Envolvemos la imagen en un Link */}
            <img
              src={room.imageUrl || '/placeholder-room.jpg'}
              alt={room.title}
              className="w-full h-full object-cover"
            />
          </Link>
          <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground text-md px-3 py-1">
            {displayPrice} <Euro className="h-4 w-4 ml-1" /> / mes
          </Badge>

          {/* Botón de Favoritos - Condicional */}
          {currentUser && !isMyRoom && ( // Solo muestra si hay usuario y NO es mi propia habitación
            <Button
              variant="ghost" // O tu variante para iconos
              size="icon"
              className={`absolute top-3 right-3 rounded-full ${isRoomFavorite ? 'text-red-500 bg-white/70 hover:bg-white' : 'text-gray-400 bg-white/70 hover:bg-white hover:text-red-400'}`}
              onClick={handleFavoriteToggle}
              aria-label={isRoomFavorite ? "Eliminar de favoritos" : "Añadir a favoritos"}
            >
              <Heart className={isRoomFavorite ? 'fill-current' : ''} /> {/* Rellena el corazón si es favorito */}
            </Button>
          )}
        </div>
      )}

      <CardHeader className="flex-grow p-4 pb-2">
        <CardTitle className="text-xl font-semibold mb-1 line-clamp-2">
          <Link to={`/habitacion/${room.id}`} className="hover:text-blue-600 transition-colors">
            {room.title}
          </Link>
        </CardTitle>
        <p className="text-sm text-muted-foreground flex items-center">
          <MapPin className="h-4 w-4 mr-1 flex-shrink-0" /> <span className="line-clamp-1">{displayLocation}</span>
        </p>
      </CardHeader>

      <CardContent className="space-y-2 flex-grow p-4 py-2">
        <p className="text-sm text-muted-foreground"><strong>Tipo:</strong> {displayRoomType}</p>
        <p className="text-sm text-muted-foreground line-clamp-2">
          <strong>Descripción:</strong> {room.description || "No hay descripción disponible."}
        </p>
        <p className="text-sm text-muted-foreground flex items-center">
          <Calendar className="h-4 w-4 mr-1 flex-shrink-0" /> Disponible desde: {displayAvailableFrom}
        </p>
        <p className="text-sm text-muted-foreground line-clamp-1">
          <strong>Comodidades:</strong> {displayAmenities}
        </p>
      </CardContent>

      <CardFooter className="mt-auto p-4 pt-0 flex justify-between items-center">
        {/* Información del anfitrión */}
        {room.host_profile ? (
          <Link to={`/perfil/${room.host_profile.id}`} className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              {room.host_profile.avatar_url
                ? <AvatarImage src={room.host_profile.avatar_url} alt={room.host_profile.full_name} />
                : <AvatarFallback>{hostAvatarInitial}</AvatarFallback>
              }
            </Avatar>
            <span className="text-sm font-medium text-foreground line-clamp-1">{room.host_profile.full_name}</span>
          </Link>
        ) : (
          <span className="text-sm text-muted-foreground">Anfitrión desconocido</span>
        )}

        {/* Componente de acciones inyectado si se proporciona (ej. botones de editar/eliminar en "Mis Propiedades") */}
        {actionsComponent && (
          <div className="flex gap-2">
            {actionsComponent}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default RoomCard;