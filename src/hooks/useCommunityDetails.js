// src/hooks/useCommunityDetails.js
import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/SupabaseAuthContext";

const useCommunityDetails = () => {
    const { communityId } = useParams();
    const [community, setCommunity] = useState(null);
    const [posts, setPosts] = useState([]);
    const [membersCount, setMembersCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isPosting, setIsPosting] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [isMember, setIsMember] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [accessDenied, setAccessDenied] = useState(false);

    // Obtener el usuario y el estado de carga de la autenticación desde el contexto
    const { user, loading: authLoading } = useAuth();

    // Inicializar el hook useToast()
    const { toast } = useToast();

    // Nuevos estados para las operaciones de ajustes (¡DECLARADOS AQUÍ!)
    const [isUpdatingImage, setIsUpdatingImage] = useState(false);
    const [isTogglingPrivacy, setIsTogglingPrivacy] = useState(false);
    const [isDeletingCommunity, setIsDeletingCommunity] = useState(false);

    // LOG DE ESTADO CLAVE (mantener para depuración)
    useEffect(() => {
        console.log("--- CommunityDetails State Update ---");
        console.log("Community ID:", communityId);
        console.log("Loading (hook):", loading);
        console.log("Auth Loading:", authLoading);
        console.log("User ID:", user ? user.id : "null");
        console.log("Community Data (exists):", !!community);
        console.log("isMember:", isMember);
        console.log("isOwner:", isOwner);
        console.log("Access Denied:", accessDenied);
        console.log("------------------------------------");
    }, [communityId, loading, authLoading, user, community, isMember, isOwner, accessDenied]);


    const fetchCommunityAndMembership = useCallback(async () => {
        if (authLoading || !communityId) {
            if (!communityId) setLoading(false);
            return;
        }

        setLoading(true);
        setAccessDenied(false);

        try {
            const { data: communityData, error: communityError } = await supabase
                .from('communities')
                .select('*')
                .eq('id', communityId)
                .single();

            if (communityError && communityError.code === '42P17') {
                console.error("RLS recursion error when fetching community:", communityError);
                setCommunity(null);
                setAccessDenied(true);
                return;
            }
            if (communityError || !communityData) {
                console.error("Error fetching community or not found:", communityError);
                setCommunity(null);
                setAccessDenied(false);
                return;
            }

            setCommunity(communityData);

            let currentIsOwner = false;
            let currentIsMember = false;

            if (user) {
                currentIsOwner = communityData.owner_id === user.id;
                setIsOwner(currentIsOwner);

                console.log("DEBUG fetch: Community Owner ID:", communityData.owner_id);
                console.log("DEBUG fetch: Current User ID:", user.id);
                console.log("DEBUG fetch: User is owner?", currentIsOwner);

                const { data: memberData, error: memberError } = await supabase
                    .from('community_members')
                    .select('id')
                    .eq('community_id', communityId)
                    .eq('user_id', user.id)
                    .single();

                if (memberError && memberError.code !== 'PGRST116') {
                    console.error("Error fetching membership:", memberError);
                } else if (memberData) {
                    currentIsMember = true;
                }
                setIsMember(currentIsMember);
                console.log("DEBUG fetch: User is member?", currentIsMember);

            } else {
                setIsOwner(false);
                setIsMember(false);
            }

            if (communityData.is_private && !currentIsMember && !currentIsOwner) {
                console.warn("Access denied for private community:", communityId);
                setAccessDenied(true);
                setCommunity(null);
            } else {
                setAccessDenied(false);
            }

        } catch (error) {
            console.error("Unexpected error fetching community details:", error);
            setCommunity(null);
            setAccessDenied(true);
        } finally {
            setLoading(false);
        }
    }, [communityId, user, authLoading]);


    const fetchPosts = useCallback(async () => {
        if (!communityId || !community || accessDenied) {
            setPosts([]);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('community_posts')
                .select(`
                    *,
                    profiles (full_name, avatar_url)
                `)
                .eq('community_id', communityId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching posts:", error);
                setPosts([]);
            } else {
                setPosts(data);
            }
        } catch (error) {
            console.error("Error fetching posts:", error);
            setPosts([]);
        }
    }, [communityId, community, accessDenied]);

    const fetchMembersCount = useCallback(async () => {
        if (!communityId || !community || accessDenied) {
            setMembersCount(0);
            return;
        }
        try {
            const { count, error } = await supabase
                .from('community_members')
                .select('*', { count: 'exact', head: true })
                .eq('community_id', communityId);

            if (error) {
                console.error("Error fetching members count:", error);
            } else {
                setMembersCount(count);
            }
        } catch (error) {
            console.error("Error fetching members count:", error);
        }
    }, [communityId, community, accessDenied]);


    useEffect(() => {
        if (!authLoading) {
            fetchCommunityAndMembership();
        }
    }, [authLoading, fetchCommunityAndMembership]);


    useEffect(() => {
        if (community && !accessDenied) {
            fetchPosts();
            fetchMembersCount();

            const postsChannel = supabase
                .channel(`public:community_posts:community_id=eq.${communityId}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'community_posts',
                        filter: `community_id=eq.${communityId}`,
                    },
                    (payload) => {
                        console.log("Realtime Post Change:", payload.eventType, payload.new, payload.old); // DEBUG REALTIME
                        if (payload.eventType === 'INSERT') {
                            supabase
                                .from('profiles')
                                .select('full_name, avatar_url')
                                .eq('id', payload.new.author_id)
                                .single()
                                .then(({ data: profileData, error: profileError }) => {
                                    if (!profileError) {
                                        setPosts((prevPosts) => [
                                            { ...payload.new, profiles: profileData },
                                            ...prevPosts,
                                        ]);
                                    } else {
                                        console.error("Error fetching profile for new post from Realtime:", profileError);
                                        setPosts((prevPosts) => [
                                            { ...payload.new, profiles: null },
                                            ...prevPosts,
                                        ]);
                                    }
                                });
                        } else if (payload.eventType === 'DELETE') {
                            // Si payload.old.id viene vacío, no hará nada
                            if (payload.old && payload.old.id) {
                                setPosts((prevPosts) => prevPosts.filter((post) => post.id !== payload.old.id));
                            }
                        } else if (payload.eventType === 'UPDATE') {
                            supabase
                                .from('profiles')
                                .select('full_name, avatar_url')
                                .eq('id', payload.new.author_id)
                                .single()
                                .then(({ data: profileData, error: profileError }) => {
                                    setPosts((prevPosts) =>
                                        prevPosts.map((post) =>
                                            post.id === payload.new.id
                                                ? { ...payload.new, profiles: profileData || null }
                                                : post
                                        )
                                    );
                                });
                        }
                    }
                )
                .subscribe();

            const membersChannel = supabase
                .channel(`public:community_members:community_id=eq.${communityId}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'community_members',
                        filter: `community_id=eq.${communityId}`,
                    },
                    (payload) => {
                        fetchMembersCount();
                    }
                )
                .subscribe();


            return () => {
                supabase.removeChannel(postsChannel);
                supabase.removeChannel(membersChannel);
            };
        }
    }, [communityId, community, accessDenied, fetchPosts, fetchMembersCount]);


    // --- Funciones para las acciones de la comunidad ---

    const handlePostSubmit = async (content) => {
        console.log("DEBUG: handlePostSubmit called.");
        console.log("DEBUG: User object for posting:", user);
        console.log("DEBUG: Community ID for posting:", communityId);
        console.log("DEBUG: isMember status:", isMember);
        console.log("DEBUG: isOwner status:", isOwner);

        if (!user || !communityId || (!isMember && !isOwner)) {
            toast({ variant: "destructive", title: "Error", description: "Debes ser miembro para publicar." });
            return { success: false, error: "Not authorized" };
        }
        setIsPosting(true);
        try {
            const { data, error } = await supabase
                .from('community_posts')
                .insert({ community_id: communityId, author_id: user.id, content })
                .select();

            if (error) {
                console.error("Error creating post:", error);
                toast({ variant: "destructive", title: "Error al publicar", description: error.message });
                return { success: false, error: error.message };
            }

            // ELIMINADA LA ACTUALIZACIÓN LOCAL DE setPosts para INSERT.
            // Confiamos en la suscripción en tiempo real (postsChannel) para añadir el post
            // al estado una vez que Realtime lo notifique. Esto evita duplicaciones.

            toast({ title: "Publicación creada", description: "Tu mensaje ha sido publicado." });
            return { success: true };
        } finally {
            setIsPosting(false);
        }
    };

    const handleDeletePost = async (postId, authorId) => {
        if (!user) {
            toast({ variant: "destructive", title: "Error", description: "Debes iniciar sesión para realizar esta acción." });
            return { success: false, error: "Not authenticated" };
        }

        if (user.id !== authorId && user.id !== community?.owner_id) {
            toast({ variant: "destructive", title: "Acceso Denegado", description: "No tienes permiso para eliminar esta publicación." });
            return { success: false, error: "No autorizado" };
        }

        try {
            const { error } = await supabase
                .from('community_posts')
                .delete()
                .eq('id', postId);

            if (error) {
                console.error("Error deleting post:", error);
                toast({ variant: "destructive", title: "Error al eliminar", description: error.message });
                return { success: false, error: error.message };
            }

            // Actualizar local state inmediatamente al eliminar
            setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));

            toast({ title: "Publicación eliminada", description: "El mensaje ha sido borrado." });
            return { success: true };
        } catch (error) {
            console.error("Error deleting post:", error);
            toast({ variant: "destructive", title: "Error", description: error.message });
            return { success: false, error: error.message };
        }
    };

    const handleJoinCommunity = async () => {
        if (!user) {
            toast({ variant: "destructive", title: "Error", description: "Debes iniciar sesión para unirte." });
            return { success: false, error: "Not authenticated" };
        }
        setIsJoining(true);
        try {
            const { data, error } = await supabase
                .from('community_members')
                .insert({ community_id: communityId, user_id: user.id })
                .select();

            if (error) {
                console.error("Error joining community:", error);
                if (error.code === '23505') { // Duplicate key error
                    toast({ variant: "destructive", title: "Error", description: "Ya eres miembro de esta comunidad." });
                } else {
                    toast({ variant: "destructive", title: "Error al unirte", description: error.message });
                }
                return { success: false, error: error.message };
            }
            setIsMember(true);
            setMembersCount(prevCount => prevCount + 1);
            toast({ title: "¡Te has unido!", description: `Ahora eres miembro de ${community.name}.` });
            return { success: true };
        } finally {
            setIsJoining(false);
        }
    };

    const updateCommunityImage = useCallback(async (file) => {
        if (!user || !community || !isOwner) {
            console.log("DEBUG: Update Image Auth Check - User:", !!user, "Community:", !!community, "Is Owner:", isOwner);
            toast({ variant: "destructive", title: "Acceso Denegado", description: "No tienes permiso para actualizar la imagen." });
            return { success: false, error: "No autorizado." };
        }
        setIsUpdatingImage(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `${community.id}_${Date.now()}.${fileExt}`;
        const filePath = `community_banners/${fileName}`;

        console.log("DEBUG: Attempting image upload.");
        console.log("DEBUG: FilePath:", filePath);
        console.log("DEBUG: Bucket Name:", 'community-images');

        try {
            const { error: uploadError } = await supabase.storage
                .from('community-images')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true,
                });

            if (uploadError) {
                console.error("Supabase Storage Upload Error:", uploadError);
                throw uploadError;
            }

            const { data: publicUrlData } = supabase.storage
                .from('community-images')
                .getPublicUrl(filePath);

            if (!publicUrlData || !publicUrlData.publicUrl) {
                throw new Error("No se pudo obtener la URL pública de la imagen después de la subida.");
            }

            const { error: updateError } = await supabase
                .from('communities')
                .update({ image_url: publicUrlData.publicUrl })
                .eq('id', community.id)
                .select();

            if (updateError) {
                console.error("Supabase DB Update Error:", updateError);
                throw updateError;
            }

            setCommunity(prev => ({ ...prev, image_url: publicUrlData.publicUrl }));
            toast({ title: "Imagen actualizada", description: "La imagen de la comunidad ha sido actualizada." });
            return { success: true };

        } catch (error) {
            console.error("Error general al actualizar imagen de la comunidad:", error);
            toast({ variant: "destructive", title: "Error", description: error.message || "Error desconocido al actualizar la imagen." });
            return { success: false, error: error.message || "Error desconocido al actualizar la imagen." };
        } finally {
            setIsUpdatingImage(false);
        }
    }, [community, isOwner, user, toast]);


    const toggleCommunityPrivacy = useCallback(async (newIsPrivate) => {
        if (!user || !community || !isOwner) {
            toast({ variant: "destructive", title: "Acceso Denegado", description: "No tienes permiso para cambiar la privacidad." });
            return { success: false, error: "No autorizado." };
        }
        setIsTogglingPrivacy(true);
        try {
            const { data, error } = await supabase
                .from('communities')
                .update({ is_private: newIsPrivate })
                .eq('id', community.id)
                .select();

            if (error) {
                throw error;
            }
            setCommunity(prev => ({ ...prev, is_private: newIsPrivate }));
            toast({ title: "Privacidad de la comunidad", description: `La comunidad ahora es ${newIsPrivate ? 'privada' : 'pública'}.` });
            return { success: true };
        } catch (error) {
            console.error("Error toggling community privacy:", error);
            toast({ variant: "destructive", title: "Error", description: error.message || "No se pudo cambiar la privacidad." });
            return { success: false, error: error.message };
        } finally {
            setIsTogglingPrivacy(false);
        }
    }, [community, isOwner, user, toast]);

    const deleteCommunity = useCallback(async () => {
        if (!user || !community || !isOwner) {
            toast({ variant: "destructive", title: "Acceso Denegado", description: "No tienes permiso para eliminar la comunidad." });
            return { success: false, error: "No autorizado." };
        }
        setIsDeletingCommunity(true);
        try {
            if (community.image_url) {
                try {
                    const publicUrlParts = community.image_url.split('/');
                    const bucketIndex = publicUrlParts.indexOf('community-images');
                    let filePathInBucket = '';
                    if (bucketIndex !== -1 && bucketIndex + 1 < publicUrlParts.length) {
                        filePathInBucket = publicUrlParts.slice(bucketIndex + 1).join('/');
                    }

                    if (filePathInBucket) {
                        const { error: storageDeleteError } = await supabase.storage
                            .from('community-images')
                            .remove([filePathInBucket]);

                        if (storageDeleteError) {
                            console.warn("Error al eliminar la imagen del storage (continuando con eliminación de comunidad):", storageDeleteError);
                        }
                    } else {
                        console.warn("No se pudo extraer la ruta del archivo para eliminar desde la URL:", community.image_url);
                    }
                } catch (storageError) {
                    console.warn("Error inesperado al intentar eliminar la imagen del storage:", storageError);
                }
            }

            const { error: deleteError } = await supabase
                .from('communities')
                .delete()
                .eq('id', community.id);

            if (deleteError) {
                console.error("Error al eliminar la comunidad de la base de datos:", deleteError);
                throw deleteError;
            }

            setCommunity(null);
            setPosts([]);
            setMembersCount(0);
            setIsMember(false);
            setIsOwner(false);
            toast({ title: "Comunidad eliminada", description: `"${community.name}" ha sido eliminada.` });

            return { success: true };
        } catch (error) {
            console.error("Error deleting community:", error);
            toast({ variant: "destructive", title: "Error", description: error.message || "Error desconocido al eliminar la comunidad." });
            return { success: false, error: error.message || "Error desconocido al eliminar la comunidad." };
        } finally {
            setIsDeletingCommunity(false);
        }
    }, [community, isOwner, user, toast]);


    return {
        community,
        posts,
        loading,
        isPosting,
        isJoining,
        isMember,
        membersCount,
        isOwner,
        user,
        accessDenied,
        handlePostSubmit,
        handleDeletePost,
        handleJoinCommunity,
        updateCommunityImage,
        toggleCommunityPrivacy,
        deleteCommunity,
        isUpdatingImage,
        isTogglingPrivacy,
        isDeletingCommunity,
    };
};

export default useCommunityDetails;
