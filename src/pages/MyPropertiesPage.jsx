import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom'; // Importa Link si lo usas en el renderizado

// Importar componentes UI
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

// Importar iconos
import { Home, PlusCircle, Edit, Trash2 } from 'lucide-react';

// Importar la RoomCard desde la ruta CORRECTA
import RoomCard from '@/components/rooms/RoomCard'; // <-- ¡RUTA CORREGIDA AQUÍ!

// Importa la función deleteRoom de tu servicio (si la tienes separada)
import { deleteRoom as deleteRoomService } from "@/services/roomsService";


const MyPropertiesPage = () => {
    const { user: authUser, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const [myRooms, setMyRooms] = useState([]);
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [error, setError] = useState(null);

    const fetchMyRooms = useCallback(async () => {
        if (!authUser) {
            setLoadingRooms(false);
            setError("Debes iniciar sesión para ver tus propiedades.");
            navigate("/login"); // Redirige si no hay usuario
            return;
        }

        setLoadingRooms(true);
        setError(null);
        try {
            const { data, error: supabaseError } = await supabase
                .from('rooms')
                .select(`
                    *,
                    host_profile:host_id (
                        id,
                        full_name,
                        avatar_url
                    )
                `)
                .eq('host_id', authUser.id)
                .order('created_at', { ascending: false });

            if (supabaseError) {
                throw supabaseError;
            }

            const mappedRooms = data.map(room => ({
                id: room.id,
                title: room.title,
                description: room.description,
                price: room.price_per_month,
                address: room.address,
                location: room.city,
                number_of_beds: room.number_of_beds,
                area_sqm: room.area_sqm,
                imageUrl: room.image_urls && room.image_urls.length > 0 ? room.image_urls[0] : '/placeholder-room.jpg',
                imageUrls: room.image_urls, // Pasar el array completo también si es necesario
                host_profile: room.host_profile,
                is_furnished: room.is_furnished,
                has_private_bathroom: room.has_private_bathroom,
                has_kitchen_access: room.has_kitchen_access,
                has_wifi: room.has_wifi,
                has_washing_room: room.has_washing_room,
                has_air_condition: room.has_air_condition,
                has_tv: room.has_tv,
                has_parking: room.has_parking,
                house_rules: room.house_rules,
                ideal_flatmate: room.ideal_flatmate,
                availableFrom: room.available_from,
                amenities: [ // Genera el array de amenities para RoomCard si lo usa
                    room.has_wifi && 'Wi-Fi',
                    room.has_washing_room && 'Lavadora',
                    room.has_air_condition && 'Aire Acondicionado',
                    room.has_tv && 'TV',
                    room.has_parking && 'Parking',
                    room.is_furnished && 'Amueblado',
                    room.has_private_bathroom && 'Baño Privado',
                    room.has_kitchen_access && 'Acceso Cocina',
                ].filter(Boolean),
            }));

            setMyRooms(mappedRooms);

        } catch (err) {
            console.error("Error fetching my rooms:", err);
            setError("No se pudieron cargar tus propiedades. " + err.message);
            toast({
                title: "Error al cargar",
                description: "Hubo un problema al cargar tus propiedades.",
                variant: "destructive",
            });
        } finally {
            setLoadingRooms(false);
        }
    }, [authUser, navigate, toast]);

    useEffect(() => {
        if (!authLoading) {
            fetchMyRooms();
        }
    }, [authLoading, fetchMyRooms]);

    const handleDeleteRoom = async (roomId) => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar esta propiedad? Esta acción es irreversible.")) {
            return;
        }
        setLoadingRooms(true);
        try {
            await deleteRoomService(roomId);

            toast({
                title: "Propiedad eliminada",
                description: "La propiedad ha sido eliminada exitosamente.",
                variant: "default",
            });
            fetchMyRooms();

        } catch (error) {
            console.error("Error deleting room:", error);
            toast({
                title: "Error al eliminar",
                description: error.message || "No se pudo eliminar la propiedad. Asegúrate de que las políticas RLS lo permitan o que no haya FKs en cascada.",
                variant: "destructive",
            });
        } finally {
            setLoadingRooms(false);
        }
    };

    const handleEditRoom = (roomId) => {
        navigate(`/editar-habitacion/${roomId}`);
    };

    const handleRoomCardClick = (roomId) => {
        navigate(`/habitacion/${roomId}`);
    };

    if (authLoading || loadingRooms) {
        return (
            <div className="container mx-auto py-12 text-center">
                <p>Cargando tus propiedades...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto py-12 text-center text-red-600">
                <h2 className="text-2xl font-semibold mb-4">Error</h2>
                <p>{error}</p>
                {authUser && (
                    <Button onClick={fetchMyRooms} className="mt-4">Reintentar</Button>
                )}
            </div>
        );
    }

    if (!authUser) {
        return (
            <div className="container mx-auto py-12 text-center">
                <h2 className="text-2xl font-semibold mb-4">Acceso Denegado</h2>
                <p>Necesitas iniciar sesión para ver esta página.</p>
                <Button onClick={() => navigate("/login")} className="mt-4">Ir a Iniciar Sesión</Button>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="container mx-auto py-8 px-4"
        >
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                    <Home className="h-9 w-9 text-primary" /> Mis Propiedades
                </h1>
                <Button onClick={() => navigate("/crear-habitacion")} className="gap-2">
                    <PlusCircle className="h-5 w-5" /> Añadir Nueva Propiedad
                </Button>
            </div>
            <Separator className="mb-8" />

            {myRooms.length === 0 ? (
                <Card className="text-center p-8 shadow-lg">
                    <CardTitle className="mb-4">No tienes propiedades listadas</CardTitle>
                    <CardContent>
                        <p className="text-muted-foreground mb-6">
                            Parece que aún no has publicado ninguna habitación. ¡Es un buen momento para empezar!
                        </p>
                        <Button onClick={() => navigate("/crear-habitacion")} className="gap-2">
                            <PlusCircle className="h-5 w-5" /> Publicar mi primera habitación
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myRooms.map((room) => (
                        <RoomCard
                            key={room.id}
                            room={room}
                            onRoomClick={handleRoomCardClick}
                            actionsComponent={
                                <>
                                    <Button
                                        variant="outline"
                                        size="icon" // Cambiado a 'icon' para que el botón sea cuadrado
                                        onClick={(e) => {
                                            e.stopPropagation(); // Previene la navegación de la tarjeta
                                            handleEditRoom(room.id);
                                        }}
                                        title="Editar Propiedad"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="icon" // Cambiado a 'icon'
                                        onClick={(e) => {
                                            e.stopPropagation(); // Previene la navegación de la tarjeta
                                            handleDeleteRoom(room.id);
                                        }}
                                        title="Eliminar Propiedad"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </>
                            }
                        />
                    ))}
                </div>
            )}
        </motion.div>
    );
};

export default MyPropertiesPage;