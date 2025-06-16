// src/services/roomsService.js
// La ruta es "../supabaseClient" porque supabaseClient.js está directamente en src/
import { supabase } from "../supabaseClient";

// Función auxiliar para mapear los datos de la DB a la estructura del frontend
// Esto es CRUCIAL para que los nombres de las propiedades coincidan
const mapRoomData = (room) => {
    if (!room) return null;

    // Los campos average_rating y review_count se añadirán *después* de llamar a mapRoomData
    // en la función fetchRooms, no vienen directamente del objeto 'room' aquí.
    return {
        id: room.id,
        title: room.title,
        description: room.description,
        price: room.price_per_month,
        address: room.address,
        location: room.city, // Mapeo de city de DB a location para el frontend
        number_of_beds: room.number_of_beds,
        area_sqm: room.area_sqm,
        availableFrom: room.available_from, // Mapeo de available_from de DB a availableFrom para el frontend

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

        imageUrl: room.image_urls && room.image_urls.length > 0 ? room.image_urls[0] : null,
        imageUrls: room.image_urls,

        host_profile: room.host_profile ? {
            id: room.host_profile.id,
            full_name: room.host_profile.full_name,
            avatar_url: room.host_profile.avatar_url,
            age: room.host_profile.age,
            gender: room.host_profile.gender,
            bio: room.host_profile.bio,
        } : null,

        // Genera el array de amenities a partir de los booleanos de la DB
        amenities: [
            room.has_wifi && 'Wi-Fi',
            room.has_washing_room && 'Lavadora',
            room.has_air_condition && 'Aire Acondicionado',
            room.has_tv && 'TV',
            room.has_parking && 'Parking',
            room.is_furnished && 'Amueblado',
            room.has_private_bathroom && 'Baño Privado',
            room.has_kitchen_access && 'Acceso Cocina',
        ].filter(Boolean),
    };
};

// Obtener todas las habitaciones con sus anfitriones y calificaciones
export const fetchRooms = async () => {
    try {
        const { data, error } = await supabase
            .from("rooms")
            .select(`
                *,
                host_profile:host_id (
                    id,
                    full_name,
                    avatar_url,
                    age,
                    gender,
                    bio
                ),
                reviews(rating) // <<--- ¡IMPORTANTE! Aquí solicitamos los ratings de las reviews
            `)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching rooms:", error);
            throw new Error(error.message);
        }

        // Mapeamos y calculamos las calificaciones para cada habitación
        const roomsWithAggregates = data.map(room => {
            // Calcular promedio y conteo de reseñas
            const ratings = room.reviews ? room.reviews.map(r => r.rating) : [];
            const totalRating = ratings.reduce((sum, r) => sum + (r || 0), 0);
            const reviewCount = ratings.length;
            const averageRating = reviewCount > 0 ? parseFloat((totalRating / reviewCount).toFixed(1)) : 0;

            // Usamos mapRoomData para la estructura base y luego añadimos las propiedades de reseña
            const mappedRoom = mapRoomData(room);

            return {
                ...mappedRoom,
                average_rating: averageRating,
                review_count: reviewCount,
            };
        });

        return roomsWithAggregates;

    } catch (error) {
        console.error("Error en fetchRooms:", error);
        return [];
    }
};

// Obtener una habitación por ID (no trae las reseñas agregadas porque la página de detalle
// las carga por separado si es necesario)
export const fetchRoomById = async (roomId) => {
    try {
        const { data, error } = await supabase
            .from("rooms")
            .select(`
                *,
                host_profile:host_id (
                    id,
                    full_name,
                    avatar_url,
                    age,
                    gender,
                    bio
                )
            `)
            .eq("id", roomId)
            .single();

        if (error) {
            console.error("Error fetching room by ID:", error);
            throw new Error(error.message);
        }
        return mapRoomData(data); // mapRoomData no necesita info de review para esta función
    } catch (error) {
        console.error("Error en fetchRoomById:", error);
        return null;
    }
};

// Crear una nueva habitación (con manejo de imagen)
export const createRoom = async (roomData, imageFile) => {
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new Error("Usuario no autenticado");
    }

    let imageUrlsToStore = []; // Array para almacenar las URLs de las imágenes

    try {
        // 1. Subir la imagen a Supabase Storage SI imageFile existe
        if (imageFile) {
            const fileExt = imageFile.name.split(".").pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
            const filePath = `room_images/${user.id}/${fileName}`; // Carpeta por usuario para organizar

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from("room-images")
                .upload(filePath, imageFile, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error("Error uploading room image:", uploadError);
                throw uploadError;
            }

            const { data: publicUrlData } = supabase.storage
                .from("room-images")
                .getPublicUrl(filePath);

            if (publicUrlData && publicUrlData.publicUrl) {
                imageUrlsToStore.push(publicUrlData.publicUrl); // Añadimos la URL al array
            }
        }

        // 2. Insertar los datos de la habitación en la base de datos
        const { data, error } = await supabase.from("rooms").insert([
            {
                ...roomData,
                host_id: user.id,
                image_urls: imageUrlsToStore, // Asignamos el ARRAY
            },
        ]).select().single();

        if (error) {
            console.error("Error creating room:", error);
            throw new Error(error.message);
        }

        return data; // Devuelve los datos completos de la habitación creada (incluido el ID)
    } catch (error) {
        console.error("Error completo en createRoom:", error);
        throw error;
    }
};

// Función para eliminar una habitación
export const deleteRoom = async (roomId) => {
    try {
        const { error } = await supabase
            .from('rooms')
            .delete()
            .eq('id', roomId); // Condición para eliminar por ID

        if (error) {
            console.error('Error deleting room:', error);
            throw error;
        }
        return true; // Éxito
    } catch (error) {
        console.error('Failed to delete room:', error);
        throw error;
    }
};

// Función para actualizar una habitación
export const updateRoom = async (roomId, hostId, roomData) => {
    try {
        // Validación de seguridad: Asegurarse de que el usuario que intenta actualizar
        // es el anfitrión real de la habitación.
        const { data: existingRoom, error: fetchError } = await supabase
            .from('rooms')
            .select('host_id')
            .eq('id', roomId)
            .single();

        if (fetchError || !existingRoom) {
            throw new Error('Habitación no encontrada o error de acceso.');
        }

        if (existingRoom.host_id !== hostId) {
            throw new Error('No tienes permiso para editar esta propiedad.');
        }

        // Realizar la actualización
        const { data, error } = await supabase
            .from('rooms')
            .update(roomData)
            .eq('id', roomId)
            .select() // Devuelve la fila actualizada
            .single();

        if (error) {
            console.error('Error updating room:', error);
            throw new Error(error.message);
        }

        return data; // Devuelve los datos de la habitación actualizada
    } catch (error) {
        console.error('Failed to update room:', error);
        throw error;
    }
};