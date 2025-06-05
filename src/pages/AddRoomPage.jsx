import React, { useState } from "react";
import { createRoom } from "@/services/roomsService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/SupabaseAuthContext"; // Import useAuth

const AddRoomPage = () => {
    const { toast } = useToast();
    const { user } = useAuth(); // Get the authenticated user from your AuthContext

    const [roomData, setRoomData] = useState({
        title: "",
        location: "",
        price: "",
        type: "Privada",
        amenities: "",
        disponibleDesde: "",
        disponibleHasta: ""
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setRoomData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Ensure a user is logged in before attempting to create a room
        if (!user) {
            toast({
                title: "Error de autenticación",
                description: "Debes iniciar sesión para añadir una habitación.",
                variant: "destructive"
            });
            setIsSubmitting(false);
            return;
        }

        try {
            const formattedRoom = {
                ...roomData,
                user_id: user.id, // <--- Crucial: Associate the room with the user's ID
                price: Number(roomData.price),
                amenities: roomData.amenities
                    .split(",")
                    .map(a => a.trim())
                    .filter(Boolean),
                disponible_desde: roomData.disponibleDesde,
                disponible_hasta: roomData.disponibleHasta
            };

            await createRoom(formattedRoom);

            toast({
                title: "Habitación añadida",
                description: "Se ha guardado correctamente en Supabase.",
            });

            // Clear the form after successful submission
            setRoomData({
                title: "",
                location: "",
                price: "",
                type: "Privada",
                amenities: "",
                disponibleDesde: "",
                disponibleHasta: ""
            });
        } catch (error) {
            console.error("Error creating room:", error); // Log the error for debugging
            toast({
                title: "Error al guardar",
                description: error.message || "Ha ocurrido un error al añadir la habitación.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-12 px-4">
            <h1 className="text-3xl font-bold mb-6">Añadir nueva habitación</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input name="title" placeholder="Título" value={roomData.title} onChange={handleChange} required />
                <Input name="location" placeholder="Ubicación" value={roomData.location} onChange={handleChange} required />
                <Input name="price" type="number" placeholder="Precio (€)" value={roomData.price} onChange={handleChange} required />
                <Input name="type" placeholder="Tipo (Privada, Compartida, Estudio...)" value={roomData.type} onChange={handleChange} />
                <Textarea
                    name="amenities"
                    placeholder="Comodidades separadas por coma (wifi, terraza, calefacción...)"
                    value={roomData.amenities}
                    onChange={handleChange}
                />
                <Input name="disponibleDesde" type="date" value={roomData.disponibleDesde} onChange={handleChange} required />
                <Input name="disponibleHasta" type="date" value={roomData.disponibleHasta} onChange={handleChange} required />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Guardando..." : "Guardar habitación"}
                </Button>
            </form>
        </div>
    );
};

export default AddRoomPage;