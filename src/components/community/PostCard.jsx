// src/components/community/PostCard.jsx
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom"; // <-- ¡IMPORTA Link!

// Importar date-fns para un formato de fecha más amigable
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale"; // Para fechas en español

const PostCard = ({ post, user, onDeletePost, isOwner }) => {
    const canDelete = user && (user.id === post.author_id || isOwner);

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center">
                        <Avatar className="w-8 h-8 rounded-full mr-3">
                            <AvatarImage src={post.profiles?.avatar_url || "/placeholder-avatar.jpg"} alt={post.profiles?.full_name} />
                            <AvatarFallback>{post.profiles?.full_name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <div>
                            {/* Envuelve el nombre del autor con Link */}
                            {post.profiles?.id ? (
                                <Link to={`/perfil/${post.profiles.id}`} className="font-semibold text-sm hover:underline">
                                    {post.profiles?.full_name || "Usuario Desconocido"}
                                </Link>
                            ) : (
                                <p className="font-semibold text-sm">{post.profiles?.full_name || "Usuario Desconocido"}</p>
                            )}
                            <p className="text-xs text-muted-foreground/70">
                                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: es })}
                            </p>
                        </div>
                    </div>
                    {canDelete && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDeletePost(post.id, post.author_id)}
                            className="text-red-500 hover:text-red-700"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                <p className="text-sm text-foreground leading-relaxed mt-2">{post.content}</p>
            </CardContent>
        </Card>
    );
};

export default PostCard;