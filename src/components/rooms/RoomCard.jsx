// src/components/rooms/RoomCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// Importamos 'Star' para las estrellas de la calificación
import { MapPin, Euro, Calendar, Heart, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const RoomCard = ({
  room,
  actionsComponent,
  currentUser,
  isRoomFavorite,
  onAddFavorite,
  onRemoveFavorite,
}) => {
  const displayPrice = room.price || 'N/A';

  const displayLocation = (room.address && room.location) ? `${room.address}, ${room.location}` :
    'Ubicación no especificada';

  const displayAmenities = room.amenities?.length > 0 ? room.amenities.join(", ") : "Ninguna";
  const displayAvailableFrom = room.availableFrom ? new Date(room.availableFrom).toLocaleDateString('es-ES') : 'N/A';
  const displayRoomType = 'Habitación';

  const hostAvatarInitial = room.host_profile?.full_name
    ? room.host_profile.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "UN";

  const isMyRoom = currentUser && room.host_profile?.id === currentUser.id;

  const handleFavoriteToggle = (e) => {
    e.stopPropagation();
    if (!currentUser) {
      console.log("Debes iniciar sesión para añadir a favoritos.");
      return;
    }
    if (isRoomFavorite) {
      onRemoveFavorite(room.id, room.title || room.name);
    } else {
      onAddFavorite(room.id, room.title || room.name);
    }
  };

  const imageUrlToDisplay = room.imageUrl || '/placeholder-room.jpg';

  // NUEVOS VALORES PARA LAS RESEÑAS (esperando que roomsService ya los proporcione)
  const averageRating = room.average_rating || 0;
  const reviewCount = room.review_count || 0;

  return (
    <Card
      className="hover:shadow-lg transition-shadow relative h-full flex flex-col"
    >
      {/* IMAGEN DE PORTADA */}
      <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
        <Link to={`/habitaciones/${room.id}`} className="block">
          <img
            src={imageUrlToDisplay}
            alt={room.title}
            className="w-full h-full object-cover"
          />
        </Link>
        <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground text-md px-3 py-1">
          {displayPrice} <Euro className="h-4 w-4 ml-1" /> / mes
        </Badge>

        {/* Botón de Favoritos - Condicional */}
        {currentUser && !isMyRoom && (
          <Button
            variant="ghost"
            size="icon"
            className={`absolute top-3 right-3 rounded-full ${isRoomFavorite ? 'text-red-500 bg-white/70 hover:bg-white' : 'text-gray-400 bg-white/70 hover:bg-white hover:text-red-400'}`}
            onClick={handleFavoriteToggle}
            aria-label={isRoomFavorite ? "Eliminar de favoritos" : "Añadir a favoritos"}
          >
            <Heart className={isRoomFavorite ? 'fill-current' : ''} />
          </Button>
        )}
      </div>

      <CardHeader className="flex-grow p-4 pb-2">
        <CardTitle className="text-xl font-semibold mb-1 line-clamp-2">
          <Link to={`/habitaciones/${room.id}`} className="hover:text-blue-600 transition-colors">
            {room.title}
          </Link>
        </CardTitle>
        <p className="text-sm text-muted-foreground flex items-center">
          <MapPin className="h-4 w-4 mr-1 flex-shrink-0" /> <span className="line-clamp-1">{displayLocation}</span>
        </p>
        {/* Aquí añadimos la calificación promedio y el conteo de reseñas */}
        <div className="flex items-center mt-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${i < averageRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
            />
          ))}
          <span className="ml-2 text-sm text-muted-foreground">
            {averageRating > 0 ? `${averageRating} (${reviewCount})` : 'Sin reseñas'}
          </span>
        </div>
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