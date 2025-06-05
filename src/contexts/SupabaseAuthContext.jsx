// src/contexts/SupabaseAuthContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback } from "react"; // Añadido useCallback
import { supabase } from "@/supabaseClient";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const SupabaseAuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Función auxiliar para obtener el perfil y enriquecer el objeto de usuario
    // Envuelto en useCallback para estabilidad y evitar re-creación innecescesaria
    const fetchUserProfileAndEnrich = useCallback(async (supabaseUser) => {
        if (!supabaseUser) return null;

        let onboardingCompleted = false;

        // PRIORIDAD 1: Intentar obtener 'onboarding_completed' de user_metadata de la sesión actual
        // Esta es la fuente más inmediata de verdad tras un `updateUser` o un `onAuthStateChange`.
        if (supabaseUser.user_metadata && typeof supabaseUser.user_metadata.onboarding_completed === 'boolean') {
            onboardingCompleted = supabaseUser.user_metadata.onboarding_completed;
        } else {
            // PRIORIDAD 2: Si no está en user_metadata o no es un booleano, intentar obtenerlo de la tabla 'profiles'
            // Esto es importante para usuarios existentes o si la metadata no se ha sincronizado aún.
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('onboarding_completed')
                .eq('id', supabaseUser.id)
                .single();

            if (profileError && profileError.code !== 'PGRST116') { // PGRST116: no rows found (perfil no existe aún, normal para un nuevo registro antes del onboarding)
                console.warn("Error fetching profile for user:", supabaseUser.id, profileError);
            }
            // Si el perfil existe, usa su valor; de lo contrario, por defecto es false.
            onboardingCompleted = profile?.onboarding_completed || false;
        }

        return {
            ...supabaseUser,
            // email_confirmed_at ya viene en el objeto `supabaseUser` de Supabase Auth
            onboarding_completed: onboardingCompleted,
            // Puedes añadir otras propiedades de `profiles` aquí si las quieres en `user` directamente
            // Por ejemplo: `full_name: supabaseUser.user_metadata?.full_name || profile?.full_name || null,`
            // O, si `full_name` se actualiza durante el onboarding, podrías sacarlo de `profile`
            // En tu caso, `full_name` ya lo tienes en `user_metadata`
        };
    }, []); // Sin dependencias para useCallback, ya que no usa variables del scope externo que puedan cambiar.

    useEffect(() => {
        const handleAuthChange = async (event, currentSession) => {
            setSession(currentSession);
            if (currentSession) {
                // Si hay una sesión activa, enriquecer el usuario
                const enrichedUser = await fetchUserProfileAndEnrich(currentSession.user);
                setUser(enrichedUser);
            } else {
                // Si no hay sesión, limpiar el usuario
                setUser(null);
            }
            setLoading(false); // Una vez que se maneja el primer estado, ya no estamos cargando
        };

        // Escuchar cambios de autenticación en tiempo real
        const { data: listener } = supabase.auth.onAuthStateChange(handleAuthChange);

        // Obtener la sesión inicial al cargar el componente
        const getInitialSession = async () => {
            const { data: { session: initialSession }, error } = await supabase.auth.getSession();
            if (error) {
                console.error("Error getting initial session:", error);
            }
            // Disparar el manejador de cambio de autenticación para procesar la sesión inicial
            // Esto asegura que `user` y `session` se establezcan correctamente al cargar la app.
            handleAuthChange(null, initialSession);
        };

        getInitialSession();

        // Limpiar el listener al desmontar el componente
        return () => {
            listener.subscription.unsubscribe();
        };
    }, [fetchUserProfileAndEnrich]); // Dependencia de fetchUserProfileAndEnrich

    const register = async ({ email, password, fullName }) => {
        // Al registrar, establecemos 'full_name' y 'onboarding_completed: false' en user_metadata
        // Esto es útil para que Supabase Auth mantenga un registro y para que la metadata esté lista.
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    onboarding_completed: false, // Inicializar en user_metadata para el nuevo usuario
                },
            },
        });
        if (error) throw error;

        // Crear una entrada inicial en la tabla 'profiles' para el nuevo usuario.
        // Es crucial que esta entrada tenga `onboarding_completed: false` para que la lógica
        // de `PrivateRoute` y `OnboardingPage` funcione correctamente.
        if (data && data.user) {
            const { error: profileCreationError } = await supabase
                .from('profiles')
                .insert({
                    id: data.user.id,
                    full_name: fullName, // Duplicar aquí si quieres tenerlo en profiles también
                    onboarding_completed: false, // También inicializar en la tabla profiles
                    email: email // Opcional: guardar email en profiles si es necesario
                });
            if (profileCreationError) {
                console.error("Error creating initial profile:", profileCreationError);
                // NOTA: Si el perfil no se crea aquí, `fetchUserProfileAndEnrich`
                // en el `onAuthStateChange` tendrá que manejar el caso de `profile` ser `null`.
                // Tu actual `fetchUserProfileAndEnrich` ya lo maneja bien con `profile?.onboarding_completed || false`.
            }
        }
        // onAuthStateChange se encargará de actualizar el estado `user` del contexto con el user enriquecido.
        return { user: data.user };
    };

    const login = async ({ email, password }) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // onAuthStateChange se encargará de actualizar 'user' y 'session'
        return { user: data.user }; // Devuelve `data.user` que es el user de Supabase
    };

    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Error during logout:", error);
            throw error;
        }
        // Limpiar el estado local al cerrar sesión
        setUser(null);
        setSession(null);
        navigate("/login", { replace: true }); // Redirigir al login y reemplazar el historial
    };

    /**
     * Función genérica para actualizar el perfil del usuario (tabla 'profiles')
     * y, opcionalmente, la metadata del usuario de autenticación de Supabase.
     * @param {object} profileUpdates - Objeto con los datos a actualizar en la tabla 'profiles'.
     * @param {object} [authMetadataUpdates={}] - Objeto con los datos a actualizar en la user_metadata de Auth.
     * Ej: { full_name: 'Nuevo Nombre', onboarding_completed: true }
     */
    const updateProfile = async (profileUpdates, authMetadataUpdates = {}) => {
        try {
            if (!user) throw new Error("No user logged in to update profile.");

            // 1. Actualiza la tabla 'profiles'
            const { error: profileError } = await supabase
                .from("profiles")
                .update(profileUpdates)
                .eq('id', user.id); // Asegurarse de que el ID sea el del usuario actual

            if (profileError) throw profileError;

            // 2. Opcional: Actualiza la user_metadata de la autenticación de Supabase
            // Esto es crucial para que `user.user_metadata` esté siempre sincronizado
            // y para que propiedades como `onboarding_completed` se reflejen de inmediato
            // en el objeto user que viene de Supabase Auth.
            let latestSupabaseUser = user; // Inicializar con el user actual

            if (Object.keys(authMetadataUpdates).length > 0) {
                const { data: updateData, error: authUpdateError } = await supabase.auth.updateUser({
                    data: authMetadataUpdates,
                });
                if (authUpdateError) throw authUpdateError;
                // Si la actualización de auth fue exitosa, usa el user devuelto
                // Supabase.auth.updateUser devuelve { user, session } o { data: { user, session } }
                // Dependiendo de la versión de Supabase JS, podría ser data.user
                latestSupabaseUser = updateData.user || latestSupabaseUser; // Usar el user actualizado si está disponible
            }

            // 3. Forzar una actualización del estado del usuario en el contexto
            // Incluso si `supabase.auth.updateUser` devuelve el user actualizado,
            // `onAuthStateChange` no siempre se dispara para `updateUser` de metadata.
            // Es buena práctica asegurarse de que el `user` del contexto se refresque.
            const { data: { user: refreshedUser }, error: getUserError } = await supabase.auth.getUser();
            if (getUserError) {
                console.error("Error fetching latest user after profile update:", getUserError);
                // No lanzar error aquí si el update de profile ya fue exitoso, solo loguear
            } else {
                latestSupabaseUser = refreshedUser; // Usar el user más reciente de la sesión si se obtuvo correctamente
            }

            // Enriquecer el usuario con los últimos datos de la tabla 'profiles' y metadata.
            const enrichedLatestUser = await fetchUserProfileAndEnrich(latestSupabaseUser);
            setUser(enrichedLatestUser); // Actualiza el estado `user` del contexto

            return { user: enrichedLatestUser }; // Devolver el user actualizado
        } catch (error) {
            console.error("Error updating profile:", error);
            throw error;
        }
    };

    const value = {
        user,
        session,
        isAuthenticated: !!user,
        register,
        login,
        logout,
        updateProfile, // Ahora exportamos esta función
        loading, // Estado de carga inicial del contexto de autenticación
    };

    return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);