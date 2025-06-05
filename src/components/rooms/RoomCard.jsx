// src/components/rooms/RoomCard.jsx
import React from "react";
import { Link } from "react-router-dom"; // Import Link for navigation
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// Corrected import for Supabase Auth Context
import { useAuth } from "@/contexts/SupabaseAuthContext.jsx";
// Corrected import for Supabase client
import { supabase } from "@/supabaseClient";
import { useToast } from "@/components/ui/use-toast";
import { Trash2, Pencil, MapPin, Euro, Calendar } from "lucide-react"; // Added relevant icons

const RoomCard = ({ room, onRoomDeleted }) => { // Added onRoomDeleted prop
  const { user } = useAuth();
  const { toast } = useToast();

  // Map Supabase column names to display names if necessary
  const displayPrice = room.price_per_month || 'N/A';
  const displayLocation = room.address ? `${room.address}, ${room.city}` : 'Ubicación no especificada';
  const displayAmenities = room.amenities?.length > 0 ? room.amenities.join(", ") : "Ninguna";
  const displayAvailableFrom = room.available_from ? new Date(room.available_from).toLocaleDateString() : 'N/A';
  // Assuming room.room_type exists in Supabase
  const displayRoomType = room.room_type || 'Habitación';


  const handleDelete = async (e) => {
    e.stopPropagation(); // Prevent navigating to room detail page
    const confirmDelete = window.confirm("¿Estás seguro de que quieres eliminar esta publicación de habitación?");
    if (!confirmDelete) return;

    try {
      // Use Supabase delete method
      const { error } = await supabase
        .from("rooms") // Your rooms table name
        .delete()
        .eq("id", room.id); // Delete by room ID

      if (error) {
        throw error;
      }

      toast({
        title: "Publicación eliminada",
        description: "Tu publicación de habitación ha sido eliminada correctamente.",
      });

      // Notify parent component that a room was deleted, so it can re-fetch or update its state
      if (onRoomDeleted) {
        onRoomDeleted(room.id);
      }
    } catch (error) {
      toast({
        title: "Error al eliminar",
        description: error.message || "No se pudo eliminar la publicación.",
        variant: "destructive",
      });
      console.error("❌ Error al eliminar habitación con Supabase:", error);
    }
  };

  // Check if the current logged-in user is the owner of the room
  // Assuming 'user_id' is the foreign key in your 'rooms' table pointing to 'profiles.id' / 'auth.users.id'
  const isMine = user?.id === room.user_id;

  return (
    // Wrap the card in a Link to navigate to the RoomDetailPage
    <Link to={`/habitaciones/${room.id}`} className="block">
      <Card className="hover:shadow-xl transition-shadow relative h-full flex flex-col">
        <CardHeader className="flex-grow">
          <CardTitle className="text-xl font-semibold mb-1">{room.title}</CardTitle>
          <p className="text-sm text-muted-foreground flex items-center">
            <MapPin className="h-4 w-4 mr-1" /> {displayLocation}
          </p>
        </CardHeader>

        <CardContent className="space-y-2 flex-grow">
          <p className="flex items-center text-lg font-bold text-primary">
            <Euro className="h-5 w-5 mr-1" /> {displayPrice} /mes
          </p>
          <p><strong>Tipo:</strong> {displayRoomType}</p>
          <p className="text-sm text-muted-foreground line-clamp-2">
            <strong>Descripción:</strong> {room.description || "No hay descripción disponible."}
          </p>
          <p className="text-sm text-muted-foreground flex items-center">
            <Calendar className="h-4 w-4 mr-1" /> Disponible desde: {displayAvailableFrom}
          </p>
        </CardContent>

        {isMine && (
          <CardFooter className="mt-4 flex justify-end gap-2 border-t pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation(); // Prevent navigating when clicking edit
                alert("🛠 Función de edición próximamente");
                // TODO: Implement navigation to an edit room page
                // navigate(`/edit-room/${room.id}`);
              }}
            >
              <Pencil className="w-4 h-4 mr-1" /> Editar
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-1" /> Eliminar
            </Button>
          </CardFooter>
        )}
      </Card>
    </Link>
  );
};

export default RoomCard;