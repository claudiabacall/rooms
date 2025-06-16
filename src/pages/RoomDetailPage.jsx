// src/pages/RoomDetailPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/supabaseClient"; // Asegúrate de que esta ruta sea correcta
import { useAuth } from "@/contexts/SupabaseAuthContext.jsx";
import { useToast } from "@/components/ui/use-toast";

// Importa tu servicio de habitaciones
import { fetchRoomById } from "@/services/roomsService";
// Importa tu nuevo servicio de reseñas
import { submitReview, fetchReviewsByRoomId } from "@/services/reviewsService";

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea"; // Para el comentario de la reseña
import { Input } from "@/components/ui/input"; // Aunque no lo usamos directamente para el rating, lo mantengo por si acaso

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
    Star, // Necesario para las estrellas de reseña
    MessageSquare,
    Edit,
    Trash2,
    Loader2, // Para los spinners de carga
    Send, // Para el botón de enviar reseña
} from "lucide-react";

// Utilidad para formato de fechas
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale'; // Para fechas en español

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


// Componente para una única reseña
const ReviewCard = ({ review }) => {
    const userProfile = review.user_profile;
    const displayRating = review.rating || 0;
    const initial = userProfile?.full_name ? userProfile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'UN';

    return (
        <div className="border rounded-lg p-4 mb-4 bg-card shadow-sm">
            <div className="flex items-center mb-2">
                <Avatar className="h-9 w-9 mr-3">
                    {userProfile?.avatar_url
                        ? <AvatarImage src={userProfile.avatar_url} alt={userProfile.full_name} />
                        : <AvatarFallback>{initial}</AvatarFallback>
                    }
                </Avatar>
                <div>
                    <p className="font-semibold text-lg">{userProfile?.full_name || "Usuario Anónimo"}</p>
                    <p className="text-sm text-muted-foreground">
                        {review.created_at ? formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: es }) : 'Fecha desconocida'}
                    </p>
                </div>
            </div>
            <div className="flex items-center mb-2">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={`h-5 w-5 ${i < displayRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    />
                ))}
                <span className="ml-2 text-sm text-muted-foreground">({displayRating} estrellas)</span>
            </div>
            <p className="text-foreground">{review.comment || "Sin comentario."}</p>
        </div>
    );
};


const RoomDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: authUser, loading: authLoading } = useAuth(); // Usar `authUser` para el usuario logueado
    const { toast } = useToast();

    const [room, setRoom] = useState(null);
    const [hostProfile, setHostProfile] = useState(null);
    const [loadingRoom, setLoadingRoom] = useState(true); // Cambiado a loadingRoom para diferenciar
    const [error, setError] = useState(null);
    const [isFavorited, setIsFavorited] = useState(false);

    // NUEVOS ESTADOS PARA RESEÑAS
    const [reviews, setReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(true);
    const [newReviewRating, setNewReviewRating] = useState(0);
    const [newReviewComment, setNewReviewComment] = useState("");
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

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
        setLoadingRoom(true); // Usar loadingRoom
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

                if (favoriteError && favoriteError.code !== 'PGRST116') { // PGRST116 es "no rows found"
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
            setLoadingRoom(false); // Usar loadingRoom
        }
    }, [id, authUser, navigate, toast]);

    // NUEVA FUNCIÓN: Cargar reseñas para la habitación
    const loadReviews = useCallback(async () => {
        setLoadingReviews(true);
        try {
            const data = await fetchReviewsByRoomId(id);
            setReviews(data);
        } catch (err) {
            console.error("Error loading reviews:", err);
            toast({
                title: "Error al cargar reseñas",
                description: err.message || "No se pudieron cargar las reseñas para esta habitación.",
                variant: "destructive",
            });
        } finally {
            setLoadingReviews(false);
        }
    }, [id, toast]);

    // UseEffect para cargar la habitación y las reseñas
    useEffect(() => {
        if (id) {
            fetchRoomDetails();
            loadReviews(); // Llama a la función para cargar reseñas
        }
    }, [id, fetchRoomDetails, loadReviews]); // Añade loadReviews como dependencia

    // Función para manejar el envío de una nueva reseña
    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!authUser) {
            toast({
                title: "Acceso denegado",
                description: "Debes iniciar sesión para enviar una reseña.",
                variant: "destructive",
            });
            return;
        }
        if (newReviewRating === 0) {
            toast({
                title: "Calificación requerida",
                description: "Por favor, selecciona una calificación en estrellas.",
                variant: "warning",
            });
            return;
        }

        setIsSubmittingReview(true);
        try {
            await submitReview(id, newReviewRating, newReviewComment);
            toast({
                title: "Reseña enviada",
                description: "Tu reseña ha sido publicada con éxito.",
            });
            setNewReviewRating(0); // Resetear el formulario
            setNewReviewComment("");
            loadReviews(); // Recargar las reseñas para mostrar la nueva
        } catch (err) {
            console.error("Error submitting review:", err);
            toast({
                title: "Error al enviar reseña",
                description: err.message || "Hubo un problema al enviar tu reseña.",
                variant: "destructive",
            });
        } finally {
            setIsSubmittingReview(false);
        }
    };

    // Cálculo de la calificación promedio
    const calculateAverageRating = useCallback(() => {
        if (reviews.length === 0) return { average: 0, count: 0 };
        const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
        const average = totalRating / reviews.length;
        return { average: parseFloat(average.toFixed(1)), count: reviews.length };
    }, [reviews]);

    const { average: overallAverageRating, count: reviewCount } = calculateAverageRating();

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
        setLoadingRoom(true); // Usar loadingRoom
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
            setLoadingRoom(false); // Usar loadingRoom
        }
    };

    if (loadingRoom || authLoading) { // Añadido authLoading aquí
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                <p className="ml-2 text-gray-600">Cargando detalles de la habitación...</p>
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

                    {/* Sección de Reseñas */}
                    <section className="mt-8">
                        <h2 className="text-2xl font-semibold mb-4 flex items-center">
                            Reseñas ({reviewCount})
                            <span className="ml-3 flex items-center text-yellow-500">
                                {overallAverageRating > 0 ? (
                                    <>
                                        {overallAverageRating} <Star className="h-5 w-5 fill-yellow-500 ml-1" />
                                    </>
                                ) : (
                                    <span className="text-muted-foreground text-sm ml-2">Sé el primero en reseñar</span>
                                )}
                            </span>
                        </h2>

                        {/* Formulario para añadir nueva reseña */}
                        {authUser ? ( // Solo mostrar el formulario si el usuario está logueado (authUser)
                            <form onSubmit={handleSubmitReview} className="bg-card p-6 rounded-lg shadow-md mb-8">
                                <h3 className="text-xl font-semibold mb-4">Escribe tu reseña</h3>
                                <div className="mb-4">
                                    <label htmlFor="rating" className="block text-sm font-medium text-foreground mb-2">
                                        Tu Calificación
                                    </label>
                                    <div className="flex items-center">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`h-7 w-7 cursor-pointer ${i < newReviewRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                                onClick={() => setNewReviewRating(i + 1)}
                                            />
                                        ))}
                                        <span className="ml-3 text-lg font-medium">{newReviewRating} / 5</span>
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="comment" className="block text-sm font-medium text-foreground mb-2">
                                        Comentario (opcional)
                                    </label>
                                    <Textarea
                                        id="comment"
                                        placeholder="Comparte tu experiencia..."
                                        value={newReviewComment}
                                        onChange={(e) => setNewReviewComment(e.target.value)}
                                        rows="4"
                                    />
                                </div>
                                <Button type="submit" disabled={isSubmittingReview}>
                                    {isSubmittingReview ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="mr-2 h-4 w-4" /> Enviar Reseña
                                        </>
                                    )}
                                </Button>
                            </form>
                        ) : (
                            <p className="text-muted-foreground text-center p-4 border rounded-lg mb-8">
                                <Link to="/login" className="text-primary hover:underline">Inicia sesión</Link> para dejar una reseña.
                            </p>
                        )}

                        {/* Lista de reseñas */}
                        {loadingReviews ? (
                            <div className="flex justify-center items-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                                <p className="ml-2 text-gray-600">Cargando reseñas...</p>
                            </div>
                        ) : reviews.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {reviews.map((review) => (
                                    <ReviewCard key={review.id} review={review} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-8">Aún no hay reseñas para esta habitación.</p>
                        )}
                    </section>
                </div>

                {/* Sidebar - Info del Anfitrión y Acciones */}
                <div className="lg:fixed lg:top-24 lg:right-4 lg:w-[calc(33.33%-2rem)] lg:max-w-[400px] space-y-8">
                    {isHost ? (
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
                    ) : (
                        <>
                            {hostProfile && (
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