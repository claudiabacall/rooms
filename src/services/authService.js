// src/services/authService.js
import { supabase } from "@/supabaseClient";

// Registrar usuario
export const registerUser = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { full_name: fullName },
        },
    });

    if (error) throw new Error(error.message);
    return data;
};

// Iniciar sesión
export const loginUser = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) throw new Error(error.message);
    return data;
};

// Cerrar sesión
export const logoutUser = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
};

// Escuchar cambios de sesión
export const onAuthStateChangedListener = (callback) => {
    return supabase.auth.onAuthStateChange((_event, session) => {
        callback(session?.user || null);
    });
};
