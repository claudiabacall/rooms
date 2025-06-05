// src/components/community/CommunitySidebar.jsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom'; // Se mantiene si se usa en otros lugares, aunque el botón de gestionar usa una función.

const CommunitySidebar = ({
    community,
    user,
    isMember,
    membersCount,
    onJoinCommunity,
    isJoining,
    isOwner,
    onManageCommunity // Recibe la función de navegación desde CommunityDetailPage
}) => {
    return (
        <div className="md:col-span-1 space-y-6">
            {/* Sección de Miembros */}
            <Card>
                <CardHeader>
                    <CardTitle>Miembros</CardTitle>
                    <CardDescription>Personas que forman parte de {community.name}</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-lg font-bold">{membersCount} Miembro{membersCount !== 1 ? 's' : ''}</p>
                    {/* Botón para unirse a la comunidad si no es miembro/propietario y es pública */}
                    {!isMember && !isOwner && !community.is_private && (
                        <Button onClick={onJoinCommunity} disabled={isJoining} className="mt-4 w-full">
                            {isJoining ? 'Uniéndote...' : 'Unirte a la Comunidad'}
                        </Button>
                    )}
                    {/* Mensaje para comunidades privadas si no es miembro/propietario */}
                    {!isMember && !isOwner && community.is_private && (
                        <p className="text-sm text-muted-foreground mt-4">Esta es una comunidad privada. Solo miembros pueden unirse.</p>
                    )}
                    {/* Mensaje si ya es miembro */}
                    {isMember && (
                        <p className="text-green-600 mt-4 font-semibold">
                            Ya eres miembro de esta comunidad.
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Sección de Ajustes de la Comunidad, visible solo para el propietario */}
            {isOwner && (
                <Card>
                    <CardHeader>
                        <CardTitle>Ajustes de la Comunidad</CardTitle>
                        <CardDescription>Gestiona tu comunidad.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Botón que, al hacer clic, llama a la función onManageCommunity para navegar */}
                        <Button onClick={onManageCommunity} className="w-full">
                            Gestionar Comunidad
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Sección "Acerca de" la comunidad */}
            <Card>
                <CardHeader>
                    <CardTitle>Acerca de {community.name}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{community.description || "Esta comunidad aún no tiene una descripción."}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                        {community.is_private ? 'Comunidad Privada' : 'Comunidad Pública'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Creada el: {new Date(community.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default CommunitySidebar;