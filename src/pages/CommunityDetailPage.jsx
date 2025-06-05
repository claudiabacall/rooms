// src/pages/CommunityDetailPage.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import useCommunityDetails from "@/hooks/useCommunityDetails";
import CommunityHeader from "@/components/community/CommunityHeader";
import NewPostForm from "@/components/community/NewPostForm";
import PostCard from "@/components/community/PostCard";
import CommunitySidebar from "@/components/community/CommunitySidebar";

const CommunityDetailPage = () => {
    const navigate = useNavigate();

    const {
        community,
        posts,
        loading,
        isPosting,
        isJoining,
        isMember,
        membersCount,
        isOwner,
        user,
        handlePostSubmit,
        handleDeletePost,
        handleJoinCommunity,
        accessDenied,
    } = useCommunityDetails();

    // Función que se pasa a CommunitySidebar para manejar la navegación a la página de ajustes
    const handleManageCommunityClick = () => {
        if (community && isOwner) {
            navigate(`/comunidades/${community.id}/ajustes`); // Navega a la ruta de ajustes específica
        }
    };

    // Muestra un mensaje de carga mientras se obtienen los datos de la comunidad
    if (loading) {
        return <div className="text-center py-16 text-muted-foreground">Cargando comunidad...</div>;
    }

    // Maneja el escenario de acceso denegado (ej. comunidad privada sin permisos)
    if (accessDenied) {
        return (
            <div className="text-center py-16">
                <h1 className="text-2xl font-bold">Acceso Denegado</h1>
                <p className="text-muted-foreground mt-2">No tienes permiso para ver esta comunidad privada.</p>
                <Link to="/comunidades">
                    <Button className="mt-4">Volver a Comunidades</Button>
                </Link>
            </div>
        );
    }

    // Maneja el escenario donde la comunidad no fue encontrada (ej. ID inválido)
    if (!community) {
        return (
            <div className="text-center py-16">
                <h1 className="text-2xl font-bold">Comunidad no encontrada</h1>
                <Link to="/comunidades">
                    <Button className="mt-4">Volver a Comunidades</Button>
                </Link>
            </div>
        );
    }

    // Si la comunidad existe y hay acceso, renderiza el contenido principal
    return (
        <div className="container mx-auto px-4 py-8">
            {/* Encabezado de la comunidad con su nombre e imagen */}
            <CommunityHeader community={community} membersCount={membersCount} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Columna principal para el feed de publicaciones */}
                <div className="md:col-span-2">
                    <h2 className="text-2xl font-semibold mb-4">Feed de la Comunidad</h2>

                    {/* Formulario para crear nuevas publicaciones, visible solo para miembros o propietarios */}
                    {(isMember || isOwner) ? (
                        <NewPostForm
                            onPostSubmit={handlePostSubmit}
                            isPosting={isPosting}
                            user={user}
                        />
                    ) : (
                        // Mensaje para usuarios no miembros o no propietarios
                        <p className="p-4 bg-blue-100 text-blue-800 rounded-md mb-4">
                            Únete a la comunidad para poder publicar mensajes y participar activamente.
                        </p>
                    )}

                    {/* Lista de publicaciones de la comunidad */}
                    <div className="space-y-4 mt-4">
                        {posts && posts.length > 0 ? (
                            posts.map((post) => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    user={user}
                                    onDeletePost={handleDeletePost}
                                    isOwner={isOwner} // Permite al propietario eliminar cualquier publicación
                                />
                            ))
                        ) : (
                            <p className="text-muted-foreground">No hay publicaciones todavía. ¡Sé el primero!</p>
                        )}
                    </div>
                </div>

                {/* Barra lateral de la comunidad con información y acciones */}
                <CommunitySidebar
                    community={community}
                    user={user}
                    isMember={isMember}
                    membersCount={membersCount}
                    onJoinCommunity={handleJoinCommunity}
                    isJoining={isJoining}
                    isOwner={isOwner}
                    onManageCommunity={handleManageCommunityClick} // <-- ¡COMENTARIO ELIMINADO COMPLETAMENTE DE ESTA LÍNEA!
                />
            </div>
        </div>
    );
};

export default CommunityDetailPage;