// src/components/community/PostCard.jsx
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Asegúrate de importar Avatar si lo usas

// Importar date-fns para un formato de fecha más amigable
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale"; // Para fechas en español


// Asegúrate de que CommunityDetailPage.jsx está pasando isOwner como prop
// <PostCard
//     key={post.id}
//     post={post}
//     user={user}
//     onDeletePost={handleDeletePost}
//     isOwner={isOwner} // <-- Asegúrate de que esta línea esté en CommunityDetailPage.jsx
// />

const PostCard = ({ post, user, onDeletePost, isOwner }) => { // <-- ¡NUEVO! Recibe isOwner
    // Lógica para determinar si el usuario actual puede borrar este post
    // 1. Es el autor del post.
    // 2. Es el propietario de la comunidad (isOwner es true).
    const canDelete = user && (user.id === post.author_id || isOwner);

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2"> {/* Cambiado a items-start para alinear bien */}
                    <div className="flex items-center">
                        {/* Usar el componente Avatar si lo tienes, es más consistente */}
                        <Avatar className="w-8 h-8 rounded-full mr-3">
                            <AvatarImage src={post.profiles?.avatar_url || "/placeholder-avatar.jpg"} alt={post.profiles?.full_name || "Usuario Desconocido"} />
                            <AvatarFallback>{post.profiles?.full_name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold text-sm">{post.profiles?.full_name || "Usuario Desconocido"}</p>
                            <p className="text-xs text-muted-foreground/70">
                                {/* Formato de fecha más amigable */}
                                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: es })}
                            </p>
                        </div>
                    </div>
                    {/* Mostrar el botón de eliminar solo si canDelete es true */}
                    {canDelete && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDeletePost(post.id, post.author_id)} // <-- IMPORTANTE: Pasa post.author_id al onDeletePost
                            className="text-red-500 hover:text-red-700" // Colores para el icono de basura
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                <p className="text-sm text-foreground leading-relaxed mt-2">{post.content}</p> {/* Añadido mt-2 para espacio */}
            </CardContent>
        </Card>
    );
};

export default PostCard;