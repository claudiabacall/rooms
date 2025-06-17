import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Heart, MessageSquare, Star } from "lucide-react";

const HostSidebar = ({
    hostProfile,
    authUser,
    isFavorited,
    onFavoriteToggle,
    toast, // Pasamos toast como prop para las notificaciones
}) => {
    const navigate = useNavigate();

    const hostAvatarInitial = hostProfile?.full_name
        ? hostProfile.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
        : (hostProfile?.email ? hostProfile.email.slice(0, 2).toUpperCase() : "HU");

    if (!hostProfile) {
        return null; // No renderizar si no hay perfil de anfitrión
    }

    return (
        <>
            <Card className="shadow-lg rounded-xl text-center p-6">
                <Link to={`/perfil/${hostProfile.id}`} className="block">
                    <Avatar className="h-28 w-28 mx-auto mb-4 border-4 border-primary shadow-lg">
                        {hostProfile.avatar_url
                            ? <AvatarImage src={hostProfile.avatar_url} alt={hostProfile.full_name} />
                            : <AvatarFallback className="h-full w-full flex items-center justify-center bg-secondary text-4xl text-secondary-foreground">
                                {hostAvatarInitial}
                            </AvatarFallback>
                        }
                    </Avatar>
                    <CardTitle className="text-2xl font-bold text-gray-900 mb-1">{hostProfile.full_name}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                        {hostProfile.age && `${hostProfile.age} años`}
                        {hostProfile.age && hostProfile.gender && " · "}
                        {hostProfile.gender && `${hostProfile.gender.charAt(0).toUpperCase() + hostProfile.gender.slice(1)}`}
                    </CardDescription>
                </Link>
                <Separator className="my-4" />
                <p className="text-muted-foreground italic mb-4">
                    {hostProfile.bio || "Este anfitrión aún no ha añadido una biografía."}
                </p>
                <div className="space-y-3">
                    <Button
                        onClick={onFavoriteToggle}
                        variant={isFavorited ? "destructive" : "outline"}
                        className="w-full gap-2"
                    >
                        <Heart className={`h-5 w-5 ${isFavorited ? "fill-current" : ""}`} />
                        {isFavorited ? "Eliminar de Favoritos" : "Añadir a Favoritos"}
                    </Button>
                    <Button
                        onClick={() => {
                            if (authUser) {
                                navigate(`/chat?with=${hostProfile.id}`);
                            } else {
                                toast({ title: "Inicia sesión para chatear", description: "Necesitas una cuenta para contactar al anfitrión.", variant: "default" });
                                navigate("/login");
                            }
                        }}
                        className="w-full gap-2"
                    >
                        <MessageSquare className="h-5 w-5" /> Contactar al anfitrión
                    </Button>
                    <Button variant="outline" className="w-full gap-2" onClick={() => navigate(`/reviews/user/${hostProfile.id}`)}>
                        <Star className="h-5 w-5" /> Ver Reseñas del Anfitrión
                    </Button>
                </div>
            </Card>

            {/* Se ha eliminado la Card "Interesado en esta habitación?" de aquí */}

        </>
    );
};

export default HostSidebar;