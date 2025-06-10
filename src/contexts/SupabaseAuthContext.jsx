// src/contexts/SupabaseAuthContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/supabaseClient";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const SupabaseAuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Helper function to fetch the user profile and enrich the user object
    // Wrapped in useCallback for stability and to prevent unnecessary re-creation
    const fetchUserProfileAndEnrich = useCallback(async (supabaseUser) => {
        if (!supabaseUser) return null;

        let onboardingCompleted = false;

        // PRIORITY 1: Try to get 'onboarding_completed' from user_metadata of the current session
        // This is the most immediate source of truth after a `updateUser` or an `onAuthStateChange`.
        if (supabaseUser.user_metadata && typeof supabaseUser.user_metadata.onboarding_completed === 'boolean') {
            onboardingCompleted = supabaseUser.user_metadata.onboarding_completed;
        } else {
            // PRIORITY 2: If not in user_metadata or not a boolean, try to get it from the 'profiles' table
            // This is important for existing users or if metadata hasn't synced yet.
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('onboarding_completed')
                .eq('id', supabaseUser.id)
                .single();

            if (profileError && profileError.code !== 'PGRST116') { // PGRST116: no rows found (profile doesn't exist yet, normal for a new registration before onboarding)
                console.warn("Error fetching profile for user:", supabaseUser.id, profileError);
            }
            // If the profile exists, use its value; otherwise, default to false.
            onboardingCompleted = profile?.onboarding_completed || false;
        }

        return {
            ...supabaseUser,
            // email_confirmed_at already comes in the `supabaseUser` object from Supabase Auth
            onboarding_completed: onboardingCompleted,
            // You can add other `profiles` properties here if you want them directly in `user`
            // For example: `full_name: supabaseUser.user_metadata?.full_name || profile?.full_name || null,`
            // Or, if `full_name` is updated during onboarding, you could get it from `profile`
            // In your case, `full_name` is already in `user_metadata`
        };
    }, []); // No dependencies for useCallback, as it doesn't use external scope variables that might change.

    useEffect(() => {
        const handleAuthChange = async (event, currentSession) => {
            setSession(currentSession);
            if (currentSession) {
                // If there's an active session, enrich the user
                const enrichedUser = await fetchUserProfileAndEnrich(currentSession.user);
                setUser(enrichedUser);
            } else {
                // If there's no session, clear the user
                setUser(null);
            }
            setLoading(false); // Once the initial state is handled, we are no longer loading
        };

        // Listen for real-time authentication changes
        const { data: listener } = supabase.auth.onAuthStateChange(handleAuthChange);

        // Get the initial session when the component loads
        const getInitialSession = async () => {
            const { data: { session: initialSession }, error } = await supabase.auth.getSession();
            if (error) {
                console.error("Error getting initial session:", error);
            }
            // Trigger the authentication change handler to process the initial session
            // This ensures that `user` and `session` are set correctly when the app loads.
            handleAuthChange(null, initialSession);
        };

        getInitialSession();

        // Clean up the listener when the component unmounts
        return () => {
            listener.subscription.unsubscribe();
        };
    }, [fetchUserProfileAndEnrich]); // Dependency on fetchUserProfileAndEnrich

    const register = async ({ email, password, fullName }) => {
        // Upon registration, set 'full_name' and 'onboarding_completed: false' in user_metadata
        // This is useful for Supabase Auth to keep a record and for metadata to be ready.
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    onboarding_completed: false, // Initialize in user_metadata for the new user
                },
            },
        });
        if (error) throw error;

        // Create an initial entry in the 'profiles' table for the new user.
        // It's crucial that this entry has `onboarding_completed: false` for the
        // `PrivateRoute` and `OnboardingPage` logic to work correctly.
        if (data && data.user) {
            const { error: profileCreationError } = await supabase
                .from('profiles')
                .upsert({ // <-- KEY CHANGE: Use upsert instead of insert
                    id: data.user.id,
                    full_name: fullName, // Duplicate here if you want it in profiles too
                    onboarding_completed: false, // Also initialize in the profiles table
                    email: email // Optional: save email in profiles if necessary
                }, { onConflict: 'id' }); // <-- Specify the conflict column (your primary key, which should be 'id')
            if (profileCreationError) {
                console.error("Error creating initial profile:", profileCreationError);
                // NOTE: If the profile is not created here, `fetchUserProfileAndEnrich`
                // in `onAuthStateChange` will have to handle the case where `profile` is `null`.
                // Your current `fetchUserProfileAndEnrich` already handles this well with `profile?.onboarding_completed || false`.
            }
        }
        // onAuthStateChange will take care of updating the context's `user` state with the enriched user.
        return { user: data.user };
    };

    const login = async ({ email, password }) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // onAuthStateChange will take care of updating 'user' and 'session'
        return { user: data.user }; // Returns `data.user` which is the Supabase user
    };

    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Error during logout:", error);
            throw error;
        }
        // Clear local state upon logout
        setUser(null);
        setSession(null);
        navigate("/login", { replace: true }); // Redirect to login and replace history
    };

    /**
     * Generic function to update the user profile ('profiles' table)
     * and, optionally, the Supabase authentication user metadata.
     * @param {object} profileUpdates - Object with data to update in the 'profiles' table.
     * @param {object} [authMetadataUpdates={}] - Object with data to update in Auth user_metadata.
     * Ex: { full_name: 'New Name', onboarding_completed: true }
     */
    const updateProfile = async (profileUpdates, authMetadataUpdates = {}) => {
        try {
            if (!user) throw new Error("No user logged in to update profile.");

            // 1. Update the 'profiles' table
            const { error: profileError } = await supabase
                .from("profiles")
                .update(profileUpdates)
                .eq('id', user.id); // Ensure the ID is that of the current user

            if (profileError) throw profileError;

            // 2. Optional: Update Supabase authentication user_metadata
            // This is crucial for `user.user_metadata` to always be in sync
            // and for properties like `onboarding_completed` to reflect immediately
            // in the user object coming from Supabase Auth.
            let latestSupabaseUser = user; // Initialize with the current user

            if (Object.keys(authMetadataUpdates).length > 0) {
                const { data: updateData, error: authUpdateError } = await supabase.auth.updateUser({
                    data: authMetadataUpdates,
                });
                if (authUpdateError) throw authUpdateError;
                // If auth update was successful, use the returned user
                // Supabase.auth.updateUser returns { user, session } or { data: { user, session } }
                // Depending on the Supabase JS version, it might be data.user
                latestSupabaseUser = updateData.user || latestSupabaseUser; // Use the updated user if available
            }

            // 3. Force an update of the user state in the context
            // Even if `supabase.auth.updateUser` returns the updated user,
            // `onAuthStateChange` does not always fire for `updateUser` of metadata.
            // It's good practice to ensure the context's `user` is refreshed.
            const { data: { user: refreshedUser }, error: getUserError } = await supabase.auth.getUser();
            if (getUserError) {
                console.error("Error fetching latest user after profile update:", getUserError);
                // Do not throw error here if the profile update was already successful, just log
            } else {
                latestSupabaseUser = refreshedUser; // Use the most recent user from the session if successfully obtained
            }

            // Enrich the user with the latest data from the 'profiles' table and metadata.
            const enrichedLatestUser = await fetchUserProfileAndEnrich(latestSupabaseUser);
            setUser(enrichedLatestUser); // Update the context's `user` state

            return { user: enrichedLatestUser }; // Return the updated user
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
        updateProfile, // Now export this function
        loading, // Initial loading state of the authentication context
    };

    return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);