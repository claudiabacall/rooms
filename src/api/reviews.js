// src/api/reviews.js
import { supabase } from '../supabaseClient'; // Asegúrate de que la ruta sea correcta

/**
 * Envía una nueva reseña de un usuario a otro.
 * @param {string} reviewerId - UUID del usuario que deja la reseña.
 * @param {string} reviewedUserId - UUID del usuario que recibe la reseña.
 * @param {number} rating - Puntuación de 1 a 5.
 * @param {string} reviewText - Texto opcional de la reseña.
 * @param {string|null} contextRoomId - UUID opcional de la habitación relacionada con la reseña.
 * @returns {Promise<Object>} El objeto de la reseña creada.
 */
export const submitReview = async (reviewerId, reviewedUserId, rating, reviewText, contextRoomId = null) => {
    if (!reviewerId || !reviewedUserId || !rating || rating < 1 || rating > 5) {
        throw new Error('Datos de reseña incompletos o inválidos.');
    }
    try {
        const { data, error } = await supabase
            .from('user_ratings')
            .insert({
                reviewer_id: reviewerId,
                reviewed_user_id: reviewedUserId,
                rating: rating,
                review_text: reviewText,
                context_room_id: contextRoomId // Guarda el ID de la habitación si es relevante
            })
            .select() // Devuelve la reseña insertada
            .single(); // Esperamos un solo resultado

        if (error) {
            console.error('Error submitting review:', error);
            throw error;
        }
        return data;
    } catch (error) {
        console.error('Error en submitReview:', error.message);
        throw error;
    }
};

/**
 * Obtiene todas las reseñas para un usuario dado.
 * Incluye información del revisor.
 * @param {string} userId - UUID del usuario cuyas reseñas se quieren obtener.
 * @returns {Promise<Array>} Un array de objetos de reseña.
 */
export const fetchUserReviews = async (userId) => {
    if (!userId) {
        console.warn('fetchUserReviews: userId no proporcionado.');
        return [];
    }
    try {
        const { data, error } = await supabase
            .from('user_ratings')
            .select(`
        id,
        rating,
        review_text,
        created_at,
        reviewer:reviewer_id(id, full_name, avatar_url) // Fetch reviewer's details
      `)
            .eq('reviewed_user_id', userId)
            .order('created_at', { ascending: false }); // Las reseñas más recientes primero

        if (error) {
            console.error('Error fetching user reviews:', error);
            throw error;
        }
        return data;
    } catch (error) {
        console.error('Error en fetchUserReviews:', error.message);
        throw error;
    }
};

/**
 * Obtiene el promedio de calificación y el número total de reseñas para un usuario.
 * Esto asume que tienes 'average_rating' y 'total_reviews' en la tabla 'profiles'.
 * @param {string} userId - UUID del usuario.
 * @returns {Promise<Object|null>} Objeto con average_rating y total_reviews, o null si no se encuentra.
 */
export const fetchUserRatingSummary = async (userId) => {
    if (!userId) {
        console.warn('fetchUserRatingSummary: userId no proporcionado.');
        return null;
    }
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('average_rating, total_reviews')
            .eq('id', userId)
            .single(); // Esperamos un solo resultado

        if (error && error.code !== 'PGRST116') { // PGRST116 es 'No rows found', lo cual es normal si el usuario no tiene reseñas aún
            console.error('Error fetching user rating summary:', error);
            throw error;
        }
        return data; // Retorna null si no se encuentra o el objeto si se encuentra
    } catch (error) {
        console.error('Error en fetchUserRatingSummary:', error.message);
        throw error;
    }
};