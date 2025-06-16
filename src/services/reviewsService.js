// src/services/reviewsService.js
// ¡CAMBIO CLAVE AQUÍ! Subimos un directorio para encontrar supabaseClient.js
import { supabase } from "../supabaseClient";

// Función para enviar una nueva reseña
export const submitReview = async (roomId, rating, comment) => {
    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            throw new Error("No estás autenticado para enviar una reseña.");
        }

        const { data, error } = await supabase
            .from('reviews')
            .insert([
                {
                    room_id: roomId,
                    user_id: user.id,
                    rating: rating,
                    comment: comment,
                },
            ])
            .select()
            .single();

        if (error) {
            console.error("Error submitting review:", error.message);
            throw new Error("No se pudo enviar la reseña. Inténtalo de nuevo.");
        }

        return data;
    } catch (error) {
        console.error("Error in submitReview:", error);
        throw error;
    }
};

// Función para obtener todas las reseñas de un piso específico
export const fetchReviewsByRoomId = async (roomId) => {
    try {
        const { data, error } = await supabase
            .from('reviews')
            .select(`
                *,
                user_profile:user_id (
                    id,
                    full_name,
                    avatar_url
                )
            `)
            .eq('room_id', roomId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching reviews by room ID:", error.message);
            throw new Error("No se pudieron cargar las reseñas de esta habitación.");
        }

        const mappedReviews = data.map(review => ({
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            created_at: review.created_at,
            room_id: review.room_id,
            user_id: review.user_id,
            user_profile: review.user_profile ? {
                id: review.user_profile.id,
                full_name: review.user_profile.full_name,
                avatar_url: review.user_profile.avatar_url,
            } : null,
        }));

        return mappedReviews;
    } catch (error) {
        console.error("Error in fetchReviewsByRoomId:", error);
        throw error;
    }
};