// src/pages/RoomDetailPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/supabaseClient"; // Your Supabase client
import { useAuth } from "@/contexts/SupabaseAuthContext.jsx"; // Your Auth context
import { useToast } from "@/components/ui/use-toast";

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
    Sparkles,
    Utensils,
    Wifi,
    Microwave, // <--- Correct: Only 'Microwave', no 'MicrowaveIcon'
    Fan,
    Tv,
    ParkingCircle,
    // Bus, // Removed if not used in JSX
    // Train, // Removed if not used in JSX
    // ShieldCheck, // Removed if not used in JSX
    Star, // For reviews
    MessageSquare, // For chat
} from "lucide-react";

const featureIcons = {
    furnished: <Bed className="h-5 w-5 text-primary" />,
    private_bath: <Bath className="h-5 w-5 text-primary" />,
    area_sqm: <Maximize className="h-5 w-5 text-primary" />,
    kitchen: <Utensils className="h-5 w-5 text-primary" />,
    wifi: <Wifi className="h-5 w-5 text-primary" />,
    washing_machine: <Microwave className="h-5 w-5 text-primary" />, // <--- Corrected: key is 'washing_machine' and value uses the 'Microwave' icon
    air_conditioning: <Fan className="h-5 w-5 text-primary" />,
    tv: <Tv className="h-5 w-5 text-primary" />,
    parking: <ParkingCircle className="h-5 w-5 text-primary" />,
};

const RoomDetailPage = () => {
    const { id } = useParams(); // Get room ID from URL
    const navigate = useNavigate();
    const { user: authUser } = useAuth(); // Authenticated user
    const { toast } = useToast();

    const [room, setRoom] = useState(null);
    const [hostProfile, setHostProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFavorited, setIsFavorited] = useState(false);

    // Function to fetch room details and host profile
    const fetchRoomDetails = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch room details and join with host profile
            const { data: roomData, error: roomError } = await supabase
                .from("rooms")
                .select(`
          *,
          profiles (
            id, full_name, avatar_url, bio, age, gender
          )
        `)
                .eq("id", id)
                .single();

            if (roomError) {
                throw roomError;
            }

            if (!roomData) {
                setError("Habitación no encontrada.");
                toast({ title: "Error", description: "La habitación solicitada no existe.", variant: "destructive" });
                navigate("/404"); // Redirect to a 404 page if room not found
                return;
            }

            setRoom(roomData);
            setHostProfile(roomData.profiles); // The joined profile data

            // Check if favorited by current user
            if (authUser) {
                const { data: favoriteData, error: favoriteError } = await supabase
                    .from("favorites")
                    .select("id")
                    .eq("user_id", authUser.id)
                    .eq("room_id", id)
                    .single();

                if (favoriteError && favoriteError.code !== 'PGRST116') { // PGRST116 means no rows found (no favorite found)
                    throw favoriteError;
                }
                setIsFavorited(!!favoriteData); // Set to true if data exists, false otherwise
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
                // Unfavorite
                const { error: deleteError } = await supabase
                    .from("favorites")
                    .delete()
                    .eq("user_id", authUser.id)
                    .eq("room_id", id);

                if (deleteError) throw deleteError;
                setIsFavorited(false);
                toast({ title: "Eliminado de favoritos", description: "La habitación ya no está en tus favoritos." });
            } else {
                // Favorite
                const { error: insertError } = await supabase
                    .from("favorites")
                    .insert({ user_id: authUser.id, room_id: id });

                if (insertError) throw insertError;
                setIsFavorited(true);
                toast({ title: "Añadido a favoritos", description: "Esta habitación está ahora en tus favoritos." });
            }
        } catch (err) {
            console.error("Error toggling favorite:", err);
            toast({
                title: "Error al gestionar favoritos",
                description: err.message || "Inténtalo de nuevo.",
                variant: "destructive",
            });
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
        // This case should ideally be handled by the navigate("/404") earlier
        return null;
    }

    const amenities = [
        { label: "Amueblado", icon: featureIcons.furnished, condition: room.is_furnished },
        { label: "Baño privado", icon: featureIcons.private_bath, condition: room.has_private_bathroom },
        { label: "Cocina", icon: featureIcons.kitchen, condition: room.has_kitchen_access },
        { label: "Wi-Fi", icon: featureIcons.wifi, condition: room.has_wifi },
        { label: "Lavadora", icon: featureIcons.washing_machine, condition: room.has_washing_machine },
        { label: "Aire acondicionado", icon: featureIcons.air_conditioning, condition: room.has_air_conditioning },
        { label: "TV", icon: featureIcons.tv, condition: room.has_tv },
        { label: "Parking", icon: featureIcons.parking, condition: room.has_parking },
    ].filter(a => a.condition); // Only show amenities that are true

    const roomImages = room.image_urls || []; // Assuming image_urls is an array of URLs

    const hostAvatarInitial = hostProfile?.full_name
        ? hostProfile.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
        : (hostProfile?.email ? hostProfile.email.slice(0, 2).toUpperCase() : "HU"); // Host User initials

    const isHost = authUser && hostProfile && authUser.id === hostProfile.id;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="container mx-auto py-8 px-4"
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content - Room Details */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Room Title & Price */}
                    <Card className="shadow-lg rounded-xl overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">{room.title}</h1>
                                    <p className="text-lg text-muted-foreground flex items-center mt-2">
                                        <MapPin className="h-5 w-5 mr-2" />
                                        {room.address}, {room.city}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-5xl font-bold text-primary flex items-center">
                                        {room.price_per_month} <Euro className="h-8 w-8 ml-2" />
                                    </span>
                                    <p className="text-muted-foreground text-sm">/mes</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-3 mt-4">
                                <Badge variant="secondary" className="px-3 py-1 text-base flex items-center gap-2">
                                    <Bed className="h-4 w-4" /> {room.number_of_bedrooms} Hab.
                                </Badge>
                                <Badge variant="secondary" className="px-3 py-1 text-base flex items-center gap-2">
                                    <Maximize className="h-4 w-4" /> {room.area_sqm} m²
                                </Badge>
                                <Badge variant="secondary" className="px-3 py-1 text-base flex items-center gap-2">
                                    <Calendar className="h-4 w-4" /> Disponible desde: {new Date(room.available_from).toLocaleDateString()}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Image Gallery */}
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

                    {/* Description */}
                    <Card className="shadow-lg rounded-xl">
                        <CardHeader><CardTitle>Descripción</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground leading-relaxed">{room.description || "No hay descripción disponible para esta habitación."}</p>
                        </CardContent>
                    </Card>

                    {/* Key Features/Amenities */}
                    {amenities.length > 0 && (
                        <Card className="shadow-lg rounded-xl">
                            <CardHeader><CardTitle>Características y servicios</CardTitle></CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {amenities.map((amenity, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-sm text-foreground font-medium">
                                            {amenity.icon}
                                            <span>{amenity.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Additional Details (e.g., rules, ideal flatmate) */}
                    <Card className="shadow-lg rounded-xl">
                        <CardHeader><CardTitle>Detalles adicionales</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-semibold text-foreground mb-1">Normas de la casa</h4>
                                <p className="text-muted-foreground text-sm">{room.house_rules || "No hay normas específicas mencionadas."}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-foreground mb-1">Compañero/a de piso ideal</h4>
                                <p className="text-muted-foreground text-sm">{room.ideal_flatmate_description || "El propietario no ha especificado el perfil del compañero ideal."}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar - Host Info & Actions */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Host Card */}
                    {hostProfile && (
                        <Card className="shadow-lg rounded-xl text-center p-6 sticky top-24">
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

                            {!isHost && (
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
                                                // Logic to start chat with host (e.g., navigate to chat page with host ID)
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
                            )}
                        </Card>
                    )}

                    {/* Booking / Contact Info - Mocked for now */}
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
                                {/* Potentially display phone number if allowed/public */}
                                {/* {hostProfile?.phone_number && (
                  <Button variant="outline" className="w-full">
                    Llamar al anfitrión: {hostProfile.phone_number}
                  </Button>
                )} */}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </motion.div>
    );
};

export default RoomDetailPage;