// src/pages/RoomDetailPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/supabaseClient";
import { useAuth } from "@/contexts/SupabaseAuthContext.jsx";
import { useToast } from "@/components/ui/use-toast";

// Importa tu nuevo servicio de habitaciones
import { fetchRoomById } from "@/services/roomsService";

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

// Icons
import {
    Bed,
    Bath,
    Maximize,
    MapPin,
    Euro,
    Heart,
    Calendar,
    Utensils,
    Wifi,
    WashingMachine,
    Fan,
    Tv,
    ParkingCircle,
    Star,
    MessageSquare,
    Edit,
    Trash2,
} from "lucide-react";

// Mapeo de propiedades booleanas a iconos de Lucide
const featureIcons = {
    is_furnished: <Bed className="h-5 w-5 text-primary" />,
    has_private_bathroom: <Bath className="h-5 w-5 text-primary" />,
    has_kitchen_access: <Utensils className="h-5 w-5 text-primary" />,
    has_wifi: <Wifi className="h-5 w-5 text-primary" />,
    has_washing_room: <WashingMachine className="h-5 w-5 text-primary" />,
    has_air_condition: <Fan className="h-5 w-5 text-primary" />,
    has_tv: <Tv className="h-5 w-5 text-primary" />,
    has_parking: <ParkingCircle className="h-5 w-5 text-primary" />,
};

const RoomDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: authUser } = useAuth();
    const { toast } = useToast();

    const [room, setRoom] = useState(null);
    const [hostProfile, setHostProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFavorited, setIsFavorited] = useState(false);

    // TEMPORAL PARA DEPURACIÓN: Muestra el ID del usuario logueado al cambiar authUser
    useEffect(() => {
        if (authUser) {
            console.log("ID del usuario logueado (authUser.id):", authUser.id);
        } else {
            console.log("No hay usuario logueado.");
        }
    }, [authUser]);
    // FIN TEMPORAL PARA DEPURACIÓN

    const fetchRoomDetails = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const roomData = await fetchRoomById(id);

            if (!roomData) {
                setError("Habitación no encontrada.");
                toast({ title: "Error", description: "La habitación solicitada no existe.", variant: "destructive" });
                navigate("/404");
                return;
            }

            console.log("Datos de la habitación recibidos (desde roomsService):", roomData);

            setRoom(roomData);
            setHostProfile(roomData.host_profile);

            console.log("hostProfile después de setHostProfile:", roomData.host_profile);

            // Si hay un usuario autenticado, verifica si la habitación está en sus favoritos
            if (authUser) {
                const { data: favoriteData, error: favoriteError } = await supabase
                    .from("favorites")
                    .select("id")
                    .eq("user_id", authUser.id)
                    .eq("room_id", id)
                    .single();

                if (favoriteError && favoriteError.code !== 'PGRST116') {
                    throw favoriteError;
                }
                setIsFavorited(!!favoriteData);
            }

        } catch (err) {
            console.error("Error fetching room details:", err);
            setError("Error al cargar los detalles de la habitación.");
            toast({
                title: "Error de carga",
                description: err.message || "No se pudo cargar la información de la habitación.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [id, authUser, navigate, toast]);

    useEffect(() => {
        fetchRoomDetails();
    }, [fetchRoomDetails]);

    const handleFavoriteToggle = async () => {
        if (!authUser) {
            toast({
                title: "Necesitas iniciar sesión",
                description: "Inicia sesión para añadir a favoritos.",
                variant: "default",
            });
            navigate("/login");
            return;
        }

        try {
            if (isFavorited) {
                const { error: deleteError } = await supabase
                    .from("favorites")
                    .delete()
                    .eq("user_id", authUser.id)
                    .eq("room_id", id);

                if (deleteError) throw deleteError;
                setIsFavorited(false);
                toast({ title: "Eliminado de favoritos", description: "La habitación ya no está en tus favoritos." });
            } else {
                const { error: insertError } = await supabase
                    .from("favorites")
                    .insert({ user_id: authUser.id, room_id: id });

                if (insertError) throw insertError;
                setIsFavorited(true);
                toast({ title: "Añadido a favoritos", description: "Esta habitación está ahora en tus favoritos." });
            }
        } catch (err) {
            console.error("Error al gestionar favoritos:", err);
            toast({
                title: "Error al gestionar favoritos",
                description: err.message || "Inténtalo de nuevo.",
                variant: "destructive",
            });
        }
    };

    const handleDeleteRoom = async () => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar esta habitación? Esta acción no se puede deshacer.")) {
            return;
        }
        setLoading(true);
        try {
            // Eliminar favoritos asociados a la habitación primero
            const { error: deleteFavoritesError } = await supabase
                .from('favorites')
                .delete()
                .eq('room_id', id);

            if (deleteFavoritesError) {
                console.warn("Advertencia: No se pudieron eliminar todos los favoritos asociados a la habitación.", deleteFavoritesError);
            }

            // Eliminar la habitación
            const { error: deleteRoomError } = await supabase
                .from('rooms')
                .delete()
                .eq('id', id)
                .eq('host_id', authUser.id); // Asegura que solo el host pueda eliminar su propia habitación

            if (deleteRoomError) throw deleteRoomError;

            toast({
                title: "Habitación eliminada",
                description: "La habitación ha sido eliminada exitosamente.",
                variant: "default",
            });
            navigate("/mis-propiedades");
        } catch (err) {
            console.error("Error al eliminar la habitación:", err);
            toast({
                title: "Error al eliminar",
                description: err.message || "No se pudo eliminar la habitación. Inténtalo de nuevo.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto py-12 text-center">
                Cargando detalles de la habitación...
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto py-12 text-center text-red-600">
                <h2 className="text-2xl font-semibold mb-4">¡Ups! Algo salió mal.</h2>
                <p>{error}</p>
                <Button onClick={fetchRoomDetails} className="mt-4">Reintentar</Button>
            </div>
        );
    }

    if (!room) {
        return null;
    }

    const amenities = [
        { label: "Amueblado", key: "is_furnished" },
        { label: "Baño privado", key: "has_private_bathroom" },
        { label: "Acceso a Cocina", key: "has_kitchen_access" },
        { label: "Wi-Fi", key: "has_wifi" },
        { label: "Lavadora", key: "has_washing_room" },
        { label: "Aire acondicionado", key: "has_air_condition" },
        { label: "TV", key: "has_tv" },
        { label: "Parking", key: "has_parking" },
    ].filter(a => room[a.key]); // Filtra solo las comodidades que son true en el objeto room

    const roomImages = room.imageUrls || [];

    const hostAvatarInitial = hostProfile?.full_name
        ? hostProfile.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
        : (hostProfile?.email ? hostProfile.email.slice(0, 2).toUpperCase() : "HU");

    const isHost = authUser && hostProfile && authUser.id === hostProfile.id;

    console.log("-----------------------------------------");
    console.log("Estado final de isHost:", isHost);
    console.log("authUser.id (logueado):", authUser?.id);
    console.log("hostProfile.id (de la habitación):", hostProfile?.id);
    console.log("¿Son iguales authUser.id y hostProfile.id?", authUser?.id === hostProfile?.id);
    console.log("-----------------------------------------");

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="container mx-auto py-8 px-4"
        >
            <div className="flex flex-col lg:flex-row lg:gap-8">
                {/* Main Content - Detalles de la Habitación */}
                {/* Añadimos un margin-right al contenido principal para dejar espacio al sidebar fijo */}
                {/* La fórmula calc(100% / 3 + 2rem) reserva el 1/3 del ancho (33.33%) más el gap (2rem) */}
                <div className="flex-1 space-y-8 pb-8 lg:pb-0 lg:mr-[calc(33.33%+2rem)]">
                    {/* Sección de Título y Precio de la Habitación */}
                    <Card className="shadow-lg rounded-xl overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">{room.title}</h1>
                                    <p className="text-lg text-muted-foreground flex items-center mt-2">
                                        <MapPin className="h-5 w-5 mr-2" />
                                        {room.address}, {room.location}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-5xl font-bold text-primary flex items-center">
                                        {room.price} <Euro className="h-8 w-8 ml-2" />
                                    </span>
                                    <p className="text-muted-foreground text-sm">/mes</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-3 mt-4">
                                <Badge variant="secondary" className="px-3 py-1 text-base flex items-center gap-2">
                                    <Bed className="h-4 w-4" /> {room.number_of_beds} Camas
                                </Badge>
                                <Badge variant="secondary" className="px-3 py-1 text-base flex items-center gap-2">
                                    <Maximize className="h-4 w-4" /> {room.area_sqm} m²
                                </Badge>
                                <Badge variant="secondary" className="px-3 py-1 text-base flex items-center gap-2">
                                    <Calendar className="h-4 w-4 mr-1" /> Disponible desde: {new Date(room.availableFrom).toLocaleDateString('es-ES')}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Galería de Imágenes */}
                    {roomImages.length > 0 && (
                        <Card className="shadow-lg rounded-xl overflow-hidden">
                            <CardHeader>
                                <CardTitle>Imágenes de la habitación</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {roomImages.map((imageUrl, index) => (
                                        <img
                                            key={index}
                                            src={imageUrl}
                                            alt={`Imagen de la habitación ${index + 1}`}
                                            className="w-full h-48 object-cover rounded-md shadow-sm"
                                        />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Descripción de la Habitación */}
                    <Card className="shadow-lg rounded-xl">
                        <CardHeader><CardTitle>Descripción</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground leading-relaxed">{room.description || "No hay descripción disponible para esta habitación."}</p>
                        </CardContent>
                    </Card>

                    {/* Características y Servicios Clave */}
                    {amenities.length > 0 && (
                        <Card className="shadow-lg rounded-xl">
                            <CardHeader><CardTitle>Características y servicios</CardTitle></CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {amenities.map((amenity, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-sm text-foreground font-medium">
                                            {featureIcons[amenity.key]}
                                            <span>{amenity.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Detalles Adicionales (Ej: Normas de la casa, Compañero/a de piso ideal) */}
                    <Card className="shadow-lg rounded-xl">
                        <CardHeader><CardTitle>Detalles adicionales</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-semibold text-foreground mb-1">Normas de la casa</h4>
                                <p className="text-muted-foreground text-sm">{room.house_rules || "No hay normas específicas mencionadas."}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-foreground mb-1">Compañero/a de piso ideal</h4>
                                <p className="text-muted-foreground text-sm">{room.ideal_flatmate || "El propietario no ha especificado el perfil del compañero ideal."}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar - Info del Anfitrión y Acciones */}
                {/* Este div es el que ahora tiene la posición fija */}
                <div className="lg:fixed lg:top-24 lg:right-4 lg:w-[calc(33.33%-2rem)] lg:max-w-[400px] space-y-8">
                    {/* Eliminado el padding horizontal de la tarjeta ya que lo maneja el contenedor fijo */}
                    {isHost ? ( // SI EL USUARIO AUTENTICADO ES EL ANFITRIÓN
                        <Card className="shadow-lg rounded-xl text-center p-6">
                            <CardTitle className="text-2xl font-bold text-gray-900 mb-4">
                                Gestionar tu Propiedad
                            </CardTitle>
                            <Separator className="my-4" />
                            <div className="space-y-3">
                                <Button
                                    onClick={() => navigate(`/editar-habitacion/${room.id}`)}
                                    className="w-full gap-2"
                                >
                                    <Edit className="h-5 w-5" /> Editar Propiedad
                                </Button>
                                <Button
                                    onClick={handleDeleteRoom}
                                    variant="destructive"
                                    className="w-full gap-2"
                                >
                                    <Trash2 className="h-5 w-5" /> Eliminar Propiedad
                                </Button>
                            </div>
                        </Card>
                    ) : ( // SI EL USUARIO NO ES EL ANFITRIÓN (o no hay usuario logueado)
                        <>
                            {hostProfile && ( // Asegura que hostProfile exista antes de renderizar la tarjeta del anfitrión
                                <Card className="shadow-lg rounded-xl text-center p-6">
                                    <Link to={`/perfil/${hostProfile.id}`} className="block">
                                        <Avatar className="h-28 w-28 mx-auto mb-4 border-4 border-primary shadow-lg">
                                            {hostProfile.avatar_url
                                                ? <AvatarImage src={hostProfile.avatar_url} alt={hostProfile.full_name} />
                                                : <AvatarFallback className="h-full w-full flex items-center justify-center bg-secondary text-4xl text-secondary-foreground">
                                                    {hostAvatarInitial}
                                                </AvatarFallback>
                                            }
                                        </Avatar>
                                        <CardTitle className="text-2xl font-bold text-gray-900 mb-1">{hostProfile.full_name}</CardTitle>
                                        <CardDescription className="text-sm text-muted-foreground">
                                            {hostProfile.age && `${hostProfile.age} años`}
                                            {hostProfile.age && hostProfile.gender && " · "}
                                            {hostProfile.gender && `${hostProfile.gender.charAt(0).toUpperCase() + hostProfile.gender.slice(1)}`}
                                        </CardDescription>
                                    </Link>
                                    <Separator className="my-4" />
                                    <p className="text-muted-foreground italic mb-4">
                                        {hostProfile.bio || "Este anfitrión aún no ha añadido una biografía."}
                                    </p>
                                    {/* Botones de interacción para no-anfitriones */}
                                    <div className="space-y-3">
                                        <Button
                                            onClick={handleFavoriteToggle}
                                            variant={isFavorited ? "destructive" : "outline"}
                                            className="w-full gap-2"
                                        >
                                            <Heart className={`h-5 w-5 ${isFavorited ? "fill-current" : ""}`} />
                                            {isFavorited ? "Eliminar de Favoritos" : "Añadir a Favoritos"}
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                if (authUser) {
                                                    navigate(`/chat?with=${hostProfile.id}`);
                                                } else {
                                                    toast({ title: "Inicia sesión para chatear", description: "Necesitas una cuenta para contactar al anfitrión.", variant: "default" });
                                                    navigate("/login");
                                                }
                                            }}
                                            className="w-full gap-2"
                                        >
                                            <MessageSquare className="h-5 w-5" /> Contactar al anfitrión
                                        </Button>
                                        <Button variant="outline" className="w-full gap-2" onClick={() => navigate(`/reviews/user/${hostProfile.id}`)}>
                                            <Star className="h-5 w-5" /> Ver Reseñas del Anfitrión
                                        </Button>
                                    </div>
                                </Card>
                            )}

                            {/* Tarjeta de "Interesado en esta habitación?" (Solo si NO es el anfitrión) */}
                            <Card className="shadow-lg rounded-xl">
                                <CardHeader>
                                    <CardTitle>Interesado en esta habitación?</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-4">
                                        Puedes contactar al anfitrión directamente o solicitar una visita.
                                    </p>
                                    <div className="space-y-3">
                                        <Button className="w-full">
                                            Solicitar visita
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default RoomDetailPage;