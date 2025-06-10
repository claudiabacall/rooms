// src/pages/EditRoomPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchRoomById, updateRoom } from '@/services/roomsService'; // Necesitarás crear updateRoom
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';
import { useToast } from '@/components/ui/use-toast';

// Componentes UI de Shadcn/ui
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

const EditRoomPage = () => {
    const { id: roomId } = useParams(); // Obtiene el ID de la habitación de la URL
    const navigate = useNavigate();
    const { user: authUser, loading: authLoading } = useAuth();
    const { toast } = useToast();

    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Estado para el formulario de edición
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price_per_month: '',
        address: '',
        city: '',
        number_of_beds: '',
        area_sqm: '',
        available_from: '',
        is_furnished: false,
        has_private_bathroom: false,
        has_kitchen_access: false,
        has_wifi: false,
        has_washing_room: false,
        has_air_condition: false,
        has_tv: false,
        has_parking: false,
        house_rules: '',
        ideal_flatmate: '',
        // image_urls no se edita directamente aquí, se gestionaría en un componente de subida de imágenes
        // o si es un campo de texto para URLs, se actualizaría así.
    });

    useEffect(() => {
        const loadRoomData = async () => {
            if (authLoading) return; // Esperar a que la autenticación cargue

            if (!authUser) {
                setError("No autorizado. Debes iniciar sesión para editar una propiedad.");
                setLoading(false);
                return;
            }

            try {
                const fetchedRoom = await fetchRoomById(roomId);

                if (!fetchedRoom) {
                    setError("Habitación no encontrada.");
                    setLoading(false);
                    return;
                }

                // Verificar si el usuario logueado es el anfitrión de la habitación
                if (authUser.id !== fetchedRoom.host_profile?.id) {
                    setError("No tienes permiso para editar esta propiedad.");
                    toast({
                        title: "Acceso Denegado",
                        description: "No eres el anfitrión de esta propiedad.",
                        variant: "destructive",
                    });
                    navigate(`/habitacion/${roomId}`); // Redirigir a la página de detalles
                    return;
                }

                setRoom(fetchedRoom);
                // Pre-rellenar el formulario con los datos existentes
                setFormData({
                    title: fetchedRoom.title || '',
                    description: fetchedRoom.description || '',
                    price_per_month: fetchedRoom.price || '', // Mapeado de 'price' de roomsService
                    address: fetchedRoom.address || '',
                    city: fetchedRoom.location || '', // Mapeado de 'location' de roomsService
                    number_of_beds: fetchedRoom.number_of_beds || '',
                    area_sqm: fetchedRoom.area_sqm || '',
                    available_from: fetchedRoom.availableFrom ? new Date(fetchedRoom.availableFrom).toISOString().split('T')[0] : '', // Formato YYYY-MM-DD
                    is_furnished: fetchedRoom.is_furnished || false,
                    has_private_bathroom: fetchedRoom.has_private_bathroom || false,
                    has_kitchen_access: fetchedRoom.has_kitchen_access || false,
                    has_wifi: fetchedRoom.has_wifi || false,
                    has_washing_room: fetchedRoom.has_washing_room || false,
                    has_air_condition: fetchedRoom.has_air_condition || false,
                    has_tv: fetchedRoom.has_tv || false,
                    has_parking: fetchedRoom.has_parking || false,
                    house_rules: fetchedRoom.house_rules || '',
                    ideal_flatmate: fetchedRoom.ideal_flatmate || '',
                });
                setLoading(false);
            } catch (err) {
                console.error("Error al cargar la habitación para edición:", err);
                setError("No se pudo cargar la habitación para edición. " + err.message);
                setLoading(false);
            }
        };

        loadRoomData();
    }, [roomId, authUser, authLoading, navigate, toast]);

    const handleChange = (e) => {
        const { id, value, type, checked } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [id]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            // Asegúrate de que los IDs coincidan para la seguridad en la actualización
            const updatedRoom = await updateRoom(roomId, authUser.id, formData); // Necesitarás crear updateRoom en roomsService

            toast({
                title: "Propiedad actualizada",
                description: "Los detalles de la propiedad han sido guardados exitosamente.",
            });
            navigate(`/habitacion/${roomId}`); // Redirigir a la página de detalles después de la actualización
        } catch (err) {
            console.error("Error al actualizar la habitación:", err);
            setError(err.message || "Hubo un problema al actualizar la propiedad.");
            toast({
                title: "Error al actualizar",
                description: err.message || "No se pudo actualizar la propiedad.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto py-12 text-center">
                <p>Cargando datos de la habitación...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto py-12 text-center text-red-600">
                <h2 className="text-2xl font-semibold mb-4">Error</h2>
                <p>{error}</p>
                <Button onClick={() => navigate('/mis-propiedades')} className="mt-4">Volver a Mis Propiedades</Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-3xl">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">Editar Propiedad: {room?.title}</h1>
            <Separator className="mb-8" />

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-2xl">Información Básica</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="title">Título de la Publicación</Label>
                            <Input type="text" id="title" value={formData.title} onChange={handleChange} required />
                        </div>
                        <div>
                            <Label htmlFor="description">Descripción</Label>
                            <Textarea id="description" value={formData.description} onChange={handleChange} rows={4} required />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="price_per_month">Precio por Mes (€)</Label>
                                <Input type="number" id="price_per_month" value={formData.price_per_month} onChange={handleChange} required min="0" />
                            </div>
                            <div>
                                <Label htmlFor="available_from">Disponible Desde</Label>
                                <Input type="date" id="available_from" value={formData.available_from} onChange={handleChange} required />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="address">Dirección</Label>
                                <Input type="text" id="address" value={formData.address} onChange={handleChange} required />
                            </div>
                            <div>
                                <Label htmlFor="city">Ciudad</Label>
                                <Input type="text" id="city" value={formData.city} onChange={handleChange} required />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="number_of_beds">Número de Camas</Label>
                                <Input type="number" id="number_of_beds" value={formData.number_of_beds} onChange={handleChange} required min="1" />
                            </div>
                            <div>
                                <Label htmlFor="area_sqm">Área (m²)</Label>
                                <Input type="number" id="area_sqm" value={formData.area_sqm} onChange={handleChange} required min="1" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-2xl">Comodidades</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="is_furnished" checked={formData.is_furnished} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_furnished: checked }))} />
                            <Label htmlFor="is_furnished">Amueblado</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="has_private_bathroom" checked={formData.has_private_bathroom} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_private_bathroom: checked }))} />
                            <Label htmlFor="has_private_bathroom">Baño Privado</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="has_kitchen_access" checked={formData.has_kitchen_access} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_kitchen_access: checked }))} />
                            <Label htmlFor="has_kitchen_access">Acceso a Cocina</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="has_wifi" checked={formData.has_wifi} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_wifi: checked }))} />
                            <Label htmlFor="has_wifi">Wi-Fi</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="has_washing_room" checked={formData.has_washing_room} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_washing_room: checked }))} />
                            <Label htmlFor="has_washing_room">Lavadora</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="has_air_condition" checked={formData.has_air_condition} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_air_condition: checked }))} />
                            <Label htmlFor="has_air_condition">Aire Acondicionado</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="has_tv" checked={formData.has_tv} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_tv: checked }))} />
                            <Label htmlFor="has_tv">TV</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="has_parking" checked={formData.has_parking} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_parking: checked }))} />
                            <Label htmlFor="has_parking">Parking</Label>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-2xl">Reglas y Compañero Ideal</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="house_rules">Reglas de la Casa</Label>
                            <Textarea id="house_rules" value={formData.house_rules} onChange={handleChange} rows={3} />
                        </div>
                        <div>
                            <Label htmlFor="ideal_flatmate">Compañero de Piso Ideal</Label>
                            <Textarea id="ideal_flatmate" value={formData.ideal_flatmate} onChange={handleChange} rows={3} />
                        </div>
                    </CardContent>
                </Card>

                <CardFooter className="flex justify-end gap-2 p-4">
                    <Button type="button" variant="outline" onClick={() => navigate(`/habitacion/${roomId}`)} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </CardFooter>
            </form>
        </div>
    );
};

export default EditRoomPage;