// src/services/roomsService.js
import { supabase } from "@/supabaseClient";

// Obtener todas las habitaciones
export const fetchRooms = async () => {
    const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data;
};

// Obtener una habitación por ID
export const fetchRoomById = async (roomId) => {
    const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();

    if (error) throw new Error(error.message);
    return data;
};

// Crear una nueva habitación
export const createRoom = async (roomData) => {
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) throw new Error("Usuario no autenticado");

    const { data, error } = await supabase.from("rooms").insert([
        {
            ...roomData,
            user_id: user.id,
        },
    ]).select().single();

    if (error) throw new Error(error.message);
    return data.id;
};
