import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/supabaseClient";
import { useAuth } from "@/contexts/SupabaseAuthContext.jsx";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Importa tus servicios
import { fetchRoomById } from "@/services/roomsService";
import { submitReview, fetchReviewsByRoomId } from "@/services/reviewsService";

// Importa los nuevos componentes
import RoomHeader from "@/components/roomDetail/RoomHeader";
import RoomImageGallery from "@/components/roomDetail/RoomImageGallery";
import RoomDescription from "@/components/roomDetail/RoomDescription";
import RoomFeatures from "@/components/roomDetail/RoomFeatures";
import RoomAdditionalDetails from "@/components/roomDetail/RoomAdditionalDetails";
import RoomReviewsSection from "@/components/roomDetail/RoomReviewsSection";
import HostSidebar from "@/components/roomDetail/HostSidebar";
import ManagePropertySection from "@/components/roomDetail/ManagePropertySection";
import BookingCard from "@/components/roomDetail/BookingCard"; // Ya estaba importado

const RoomDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: authUser, loading: authLoading } = useAuth();
    const { toast } = useToast();

    const [room, setRoom] = useState(null);
    const [hostProfile, setHostProfile] = useState(null);
    const [loadingRoom, setLoadingRoom] = useState(true);
    const [error, setError] = useState(null);
    const [isFavorited, setIsFavorited] = useState(false);

    // ESTADOS PARA RESEÑAS
    const [reviews, setReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(true);
    const [newReviewRating, setNewReviewRating] = useState(0);
    const [newReviewComment, setNewReviewComment] = useState("");
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    // ESTADOS PARA BOOKING/RESERVA
    const [bookingLoading, setBookingLoading] = useState(false);
    // Puedes necesitar un estado para las fechas no disponibles de la habitación
    // const [roomUnavailableDates, setRoomUnavailableDates] = useState([]);


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
        setLoadingRoom(true);
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

            // Aquí podrías cargar las fechas no disponibles si las tienes en tu modelo de datos
            // Por ejemplo, si tienes una tabla 'bookings' o 'unavailable_dates'
            // const { data: unavailableDatesData, error: unavailableDatesError } = await supabase
            //     .from('unavailable_dates')
            //     .select('date')
            //     .eq('room_id', id);
            // if (!unavailableDatesError) {
            //     setRoomUnavailableDates(unavailableDatesData.map(d => d.date));
            // }


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
            setLoadingRoom(false);
        }
    }, [id, authUser, navigate, toast]);

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

    useEffect(() => {
        if (id) {
            fetchRoomDetails();
            loadReviews();
        }
    }, [id, fetchRoomDetails, loadReviews]);

    const handleSubmitReview = useCallback(async (e) => {
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
            setNewReviewRating(0);
            setNewReviewComment("");
            loadReviews();
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
    }, [id, authUser, newReviewRating, newReviewComment, loadReviews, toast]);

    const calculateAverageRating = useCallback(() => {
        if (reviews.length === 0) return { average: 0, count: 0 };
        const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
        const average = totalRating / reviews.length;
        return { average: parseFloat(average.toFixed(1)), count: reviews.length };
    }, [reviews]);

    const { average: overallAverageRating, count: reviewCount } = calculateAverageRating();

    const handleFavoriteToggle = useCallback(async () => {
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
    }, [id, authUser, isFavorited, navigate, toast]);

    const handleDeleteRoom = useCallback(async () => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar esta habitación? Esta acción no se puede deshacer.")) {
            return;
        }
        setLoadingRoom(true);
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
            setLoadingRoom(false);
        }
    }, [id, authUser, navigate, toast]);

    // FUNCIÓN PARA MANEJAR LA SOLICITUD DE VISITA (ACTUALIZADA)
    const handleBookRoom = useCallback(async (messageContent) => { // <-- Ahora recibe el mensaje
        if (!authUser) {
            toast({ title: "Error", description: "Debes iniciar sesión para solicitar una visita.", variant: "destructive" });
            navigate("/login");
            return;
        }

        if (!room || !hostProfile) {
            toast({ title: "Error", description: "Datos de habitación o anfitrión no cargados.", variant: "destructive" });
            return;
        }

        setBookingLoading(true);
        try {
            console.log("Solicitud de visita para la habitación:", room.id);
            console.log("Anfitrión:", hostProfile.id);
            console.log("Usuario que solicita:", authUser.id);
            console.log("Mensaje del usuario:", messageContent); // <-- Usando el mensaje recibido

            const { data, error } = await supabase.from('room_inquiries').insert({
                room_id: room.id,
                inquirer_id: authUser.id,
                host_id: hostProfile.id,
                // Puedes optar por no guardar fechas si la visita no tiene un día concreto aún
                // start_date: null,
                // end_date: null,
                status: 'pending_visit', // Nuevo estado para solicitudes de visita
                message: messageContent // <-- Guardando el mensaje del usuario
            });

            if (error) throw error;

            toast({ title: "Solicitud de Visita Enviada", description: "Tu mensaje ha sido enviado al anfitrión." });
        } catch (error) {
            console.error("Error al enviar solicitud de visita:", error.message);
            toast({ title: "Error", description: "No se pudo enviar la solicitud de visita. Inténtalo de nuevo.", variant: "destructive" });
        } finally {
            setBookingLoading(false);
        }
    }, [authUser, room, hostProfile, toast, navigate]);


    if (loadingRoom || authLoading) {
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
                <h2 className="2xl font-semibold mb-4">¡Ups! Algo salió mal.</h2>
                <p>{error}</p>
                <Button onClick={fetchRoomDetails} className="mt-4">Reintentar</Button>
            </div>
        );
    }

    if (!room) {
        return null;
    }

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
                {/* RESTAURADO EL MARGEN DERECHO PARA LA BARRA LATERAL */}
                <div className="flex-1 space-y-8 pb-8 lg:pb-0 lg:mr-[calc(33.33%+2rem)]">
                    <RoomHeader room={room} />
                    <RoomImageGallery imageUrls={room.imageUrls} />
                    <RoomDescription description={room.description} />
                    <RoomFeatures room={room} />
                    <RoomAdditionalDetails
                        houseRules={room.house_rules}
                        idealFlatmate={room.ideal_flatmate}
                    />

                    {/* BookingCard movido a la sección principal, pero seguirá ocupando el ancho completo del main content */}
                    {!isHost && (
                        <div className="mt-8 pt-8 border-t border-gray-200">
                            <h2 className="text-2xl font-bold mb-4">¿Interesado en esta habitación?</h2>
                            <p className="text-lg text-gray-700 mb-6">
                                Puedes contactar al anfitrión directamente o solicitar una visita.
                            </p>
                            <BookingCard
                                pricePerMonth={room.price}
                                onBookRoom={handleBookRoom} // Esta función ahora espera el mensaje
                                loadingBooking={bookingLoading}
                                authUser={authUser}
                                toast={toast}
                                navigate={navigate}
                            />
                        </div>
                    )}

                    <RoomReviewsSection
                        authUser={authUser}
                        reviews={reviews}
                        loadingReviews={loadingReviews}
                        overallAverageRating={overallAverageRating}
                        reviewCount={reviewCount}
                        newReviewRating={newReviewRating}
                        setNewReviewRating={setNewReviewRating}
                        newReviewComment={newReviewComment}
                        setNewReviewComment={setNewReviewComment}
                        handleSubmitReview={handleSubmitReview}
                        isSubmittingReview={isSubmittingReview}
                        toast={toast}
                    />
                </div>

                {/* Sidebar - Info del Anfitrión y Acciones */}
                {/* La sidebar se queda como estaba, mostrando HostSidebar o ManagePropertySection */}
                <div className="lg:fixed lg:top-24 lg:right-4 lg:w-[calc(33.33%-2rem)] lg:max-w-[400px] space-y-8
                    lg:h-[calc(100vh-6rem)] lg:overflow-y-auto">
                    {isHost ? (
                        <ManagePropertySection roomId={room.id} onDeleteRoom={handleDeleteRoom} />
                    ) : (
                        <HostSidebar
                            hostProfile={hostProfile}
                            authUser={authUser}
                            isFavorited={isFavorited}
                            onFavoriteToggle={handleFavoriteToggle}
                            toast={toast}
                        />
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default RoomDetailPage;