// src/pages/CommunitySettingsPage.jsx
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"; // Importar Card components
import { Separator } from "@/components/ui/separator"; // Importar Separator
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"; // Importar AlertDialog components
import useCommunityDetails from '@/hooks/useCommunityDetails';

const CommunitySettingsPage = () => {
    const { communityId } = useParams();
    const { toast } = useToast();
    const navigate = useNavigate();

    const {
        community,
        loading,
        accessDenied,
        isOwner,
        updateCommunityImage,
        toggleCommunityPrivacy,
        deleteCommunity,
        isUpdatingImage,
        isTogglingPrivacy,
        isDeletingCommunity,
    } = useCommunityDetails();

    const [imagePreviewUrl, setImagePreviewUrl] = useState(community?.image_url || null);

    // Muestra un mensaje de carga
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-xl text-muted-foreground animate-pulse">Cargando ajustes de la comunidad...</p>
            </div>
        );
    }

    // Manejo de acceso denegado
    if (!community || accessDenied || !isOwner) {
        return (
            <div className="text-center py-16 px-4">
                <Card className="max-w-md mx-auto p-6 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-red-600">Acceso Denegado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CardDescription className="text-muted-foreground mt-2 mb-6">
                            No tienes permiso para gestionar esta comunidad o la comunidad no existe.
                        </CardDescription>
                        <Link to="/comunidades">
                            <Button>Volver a Comunidades</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Handler para la carga de la imagen de la comunidad
    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) {
            setImagePreviewUrl(community.image_url); // Revert to original if no file selected
            return;
        }

        // Create a preview URL
        const preview = URL.createObjectURL(file);
        setImagePreviewUrl(preview);

        const { success, error } = await updateCommunityImage(file);
        if (success) {
            toast({ title: "Imagen actualizada", description: "La imagen de la comunidad se ha guardado." });
            // Cleanup the object URL after upload is complete and successful
            URL.revokeObjectURL(preview);
        } else {
            toast({ variant: "destructive", title: "Error al actualizar imagen", description: error });
            setImagePreviewUrl(community.image_url); // Revert to original on error
        }
    };

    // Handler para cambiar la privacidad de la comunidad
    const handleTogglePrivacy = async (checked) => {
        const { success, error } = await toggleCommunityPrivacy(checked);
        if (success) {
            toast({ title: "Privacidad actualizada", description: `La comunidad ahora es ${checked ? 'privada' : 'pública'}.` });
        } else {
            toast({ variant: "destructive", title: "Error al cambiar privacidad", description: error });
        }
    };

    // Handler para eliminar la comunidad
    const handleDeleteCommunity = async () => {
        const { success, error } = await deleteCommunity();
        if (success) {
            toast({ title: "Comunidad eliminada", description: "La comunidad ha sido borrada permanentemente." });
            navigate("/comunidades");
        } else {
            toast({ variant: "destructive", title: "Error al eliminar", description: error });
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-50 mb-4 text-center">
                Ajustes de <span className="text-indigo-600">{community.name}</span>
            </h1>
            <p className="text-center text-muted-foreground mb-10">Gestiona las configuraciones de tu comunidad.</p>

            <div className="space-y-8">
                {/* Sección para actualizar la imagen de la comunidad */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl font-semibold">Imagen de la Comunidad</CardTitle>
                        <CardDescription>
                            Actualiza la imagen principal de tu comunidad.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                        <div className="flex-shrink-0">
                            <img
                                src={imagePreviewUrl || community.image_url || 'https://via.placeholder.com/96x96?text=C'} // Fallback image
                                alt="Imagen de la comunidad"
                                className="w-24 h-24 rounded-full object-cover border-4 border-indigo-200 dark:border-indigo-700 shadow-md"
                            />
                        </div>
                        <div className="flex-grow w-full">
                            <Label htmlFor="community-image-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cambiar imagen de la comunidad</Label>
                            <Input
                                id="community-image-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                disabled={isUpdatingImage}
                                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                            />
                            {isUpdatingImage && <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-2">Subiendo imagen...</p>}
                        </div>
                    </CardContent>
                </Card>

                {/* Sección para cambiar la privacidad de la comunidad */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl font-semibold">Privacidad de la Comunidad</CardTitle>
                        <CardDescription>
                            Controla quién puede ver el contenido y unirse a tu comunidad.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between space-x-4 p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
                            <div className="flex flex-col">
                                <Label htmlFor="community-privacy" className="text-lg font-medium cursor-pointer">
                                    {community.is_private ? 'Comunidad Privada' : 'Comunidad Pública'}
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    {community.is_private
                                        ? 'Solo los miembros aprobados pueden ver y unirse.'
                                        : 'Cualquiera puede ver el contenido y unirse.'}
                                </p>
                            </div>
                            <Switch
                                id="community-privacy"
                                checked={community.is_private}
                                onCheckedChange={handleTogglePrivacy}
                                disabled={isTogglingPrivacy}
                                className="data-[state=checked]:bg-indigo-600"
                            />
                        </div>
                        {isTogglingPrivacy && <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-2 text-right">Cambiando privacidad...</p>}
                    </CardContent>
                </Card>

                {/* Sección para eliminar la comunidad */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl font-semibold text-red-600 dark:text-red-500">Eliminar Comunidad</CardTitle>
                        <CardDescription>
                            Esta acción es irreversible. Eliminará permanentemente la comunidad,
                            incluyendo todos sus posts y miembros asociados.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="destructive"
                                    disabled={isDeletingCommunity}
                                >
                                    {isDeletingCommunity ? 'Eliminando...' : 'Eliminar Comunidad'}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-red-600 dark:text-red-500">¿Estás absolutamente seguro?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta acción no se puede deshacer. Esto eliminará permanentemente la comunidad
                                        y todos los datos asociados a ella.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDeleteCommunity}
                                        className="bg-red-600 text-white hover:bg-red-700"
                                        disabled={isDeletingCommunity}
                                    >
                                        {isDeletingCommunity ? 'Eliminando...' : 'Confirmar Eliminación'}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardContent>
                </Card>
            </div>

            <Separator className="my-12" />

            {/* Botón para volver a la página de detalles de la comunidad */}
            <div className="text-center">
                <Link to={`/comunidades/${communityId}`}>
                    <Button variant="outline" className="px-8 py-3 text-lg">Volver a la Comunidad</Button>
                </Link>
            </div>
        </div>
    );
};

export default CommunitySettingsPage;