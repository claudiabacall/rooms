import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRoom } from "@/services/roomsService"; // Ruta corregida a alias original
import { Input } from "@/components/ui/input"; // Ruta corregida a alias original
import { Button } from "@/components/ui/button"; // Ruta corregida a alias original
import { Textarea } from "@/components/ui/textarea"; // Ruta corregida a alias original
import { useToast } from "@/components/ui/use-toast"; // Ruta corregida a alias original
import { useAuth } from "@/contexts/SupabaseAuthContext"; // Ruta corregida a alias original
import { Label } from "@/components/ui/label"; // Ruta corregida a alias original
import { Checkbox } from "@/components/ui/checkbox"; // Ruta corregida a alias original
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Ruta corregida a alias original
import { PlusCircle, ArrowLeft } from "lucide-react"; // Icons

const AddRoomPage = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const navigate = useNavigate();

    // Estado para todos los campos de la habitación, mapeando directamente a nombres de columna de la DB
    // excepto para `imageFile` que se maneja aparte.
    const [roomData, setRoomData] = useState({
        title: "",
        description: "",
        price_per_month: "",
        address: "",
        city: "",
        number_of_beds: "",
        area_sqm: "",
        available_from: "", // Format 'YYYY-MM-DD'
        house_rules: "",
        ideal_flatmate: "",
        // Propiedades booleanas (comodidades)
        is_furnished: false,
        has_private_bathroom: false,
        has_kitchen_access: false,
        has_wifi: false,
        has_washing_room: false,
        has_air_condition: false,
        has_tv: false,
        has_parking: false,
    });
    const [imageFile, setImageFile] = useState(null); // Para el archivo de la imagen de portada
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Maneja los cambios en inputs de texto y número
    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setRoomData(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value
        }));
    };

    // Maneja los cambios en checkboxes
    const handleCheckboxChange = (name, checked) => {
        setRoomData(prev => ({ ...prev, [name]: checked }));
    };

    // Maneja el cambio del archivo de imagen de portada
    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Asegúrate de que un usuario esté logueado antes de intentar crear una habitación
        if (!user) {
            toast({
                title: "Error de autenticación",
                description: "Debes iniciar sesión para añadir una habitación.",
                variant: "destructive"
            });
            setIsSubmitting(false);
            return;
        }

        try {
            // Prepara los datos para enviar al servicio 'createRoom'
            // Los nombres de las propiedades aquí deben coincidir exactamente con los nombres de las columnas de tu DB
            const roomDataToSend = {
                title: roomData.title,
                description: roomData.description,
                price_per_month: Number(roomData.price_per_month), // Convertir a número
                address: roomData.address,
                city: roomData.city,
                number_of_beds: Number(roomData.number_of_beds), // Convertir a número
                area_sqm: Number(roomData.area_sqm),             // Convertir a número
                available_from: roomData.available_from,         // Asegurarse de que el formato sea 'YYYY-MM-DD'

                house_rules: roomData.house_rules,
                ideal_flatmate: roomData.ideal_flatmate,
                // Propiedades booleanas directamente del estado
                is_furnished: roomData.is_furnished,
                has_private_bathroom: roomData.has_private_bathroom,
                has_kitchen_access: roomData.has_kitchen_access,
                has_wifi: roomData.has_wifi,
                has_washing_room: roomData.has_washing_room,
                has_air_condition: roomData.has_air_condition,
                has_tv: roomData.has_tv,
                has_parking: roomData.has_parking,
            };

            // Llama al servicio createRoom, pasando los datos y el archivo de imagen
            const newRoomId = await createRoom(roomDataToSend, imageFile);

            toast({
                title: "Habitación añadida",
                description: "Se ha guardado correctamente en Supabase.",
            });

            // Limpia el formulario después de un envío exitoso y redirige
            setRoomData({
                title: "", description: "", price_per_month: "", address: "", city: "",
                number_of_beds: "", area_sqm: "", available_from: "",
                house_rules: "", ideal_flatmate: "",
                is_furnished: false, has_private_bathroom: false, has_kitchen_access: false,
                has_wifi: false, has_washing_room: false, has_air_condition: false,
                has_tv: false, has_parking: false,
            });
            setImageFile(null);
            navigate(`/rooms/${newRoomId}`); // Redirige a la página de detalles de la nueva habitación

        } catch (error) {
            console.error("Error al crear habitación:", error); // Log el error para depuración
            toast({
                title: "Error al guardar",
                description: error.message || "Ha ocurrido un error al añadir la habitación.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <Button variant="ghost" onClick={() => navigate("/rooms")} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver
            </Button>
            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl flex items-center">
                            <PlusCircle className="mr-2" /> Añadir Nueva Habitación
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Campos obligatorios */}
                            <div>
                                <Label htmlFor="title">Título</Label>
                                <Input name="title" id="title" placeholder="Ej. Habitación luminosa en el centro" value={roomData.title} onChange={handleChange} required />
                            </div>
                            <div>
                                <Label htmlFor="description">Descripción</Label>
                                <Textarea name="description" id="description" placeholder="Describe la habitación, el piso, la zona..." value={roomData.description} onChange={handleChange} required rows={4} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="price_per_month">Precio por Mes (€)</Label>
                                    <Input name="price_per_month" id="price_per_month" type="number" placeholder="Ej. 350" value={roomData.price_per_month} onChange={handleChange} required min="0" />
                                </div>
                                <div>
                                    <Label htmlFor="number_of_beds">Número de Camas</Label>
                                    <Input name="number_of_beds" id="number_of_beds" type="number" placeholder="Ej. 1" value={roomData.number_of_beds} onChange={handleChange} required min="1" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="address">Dirección</Label>
                                    <Input name="address" id="address" placeholder="Ej. Calle Mayor, 10" value={roomData.address} onChange={handleChange} required />
                                </div>
                                <div>
                                    <Label htmlFor="city">Ciudad</Label>
                                    <Input name="city" id="city" placeholder="Ej. Madrid" value={roomData.city} onChange={handleChange} required />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="area_sqm">Superficie (m²)</Label>
                                    <Input name="area_sqm" id="area_sqm" type="number" placeholder="Ej. 15" value={roomData.area_sqm} onChange={handleChange} required min="0" />
                                </div>
                                <div>
                                    <Label htmlFor="available_from">Disponible Desde</Label>
                                    <Input name="available_from" id="available_from" type="date" value={roomData.available_from} onChange={handleChange} required />
                                </div>
                            </div>

                            {/* Reglas de la casa y compañero ideal */}
                            <div>
                                <Label htmlFor="house_rules">Reglas de la Casa</Label>
                                <Textarea name="house_rules" id="house_rules" placeholder="Ej. No fiestas, no fumar, limpieza semanal..." value={roomData.house_rules} onChange={handleChange} rows={3} />
                            </div>
                            <div>
                                <Label htmlFor="ideal_flatmate">Compañero Ideal</Label>
                                <Textarea name="ideal_flatmate" id="ideal_flatmate" placeholder="Ej. Estudiante o joven profesional, ordenado..." value={roomData.ideal_flatmate} onChange={handleChange} rows={3} />
                            </div>

                            {/* Comodidades (Checkboxes) */}
                            <div className="space-y-3">
                                <Label className="text-lg font-semibold">Comodidades</Label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="is_furnished"
                                            checked={roomData.is_furnished}
                                            onCheckedChange={(checked) => handleCheckboxChange("is_furnished", checked)}
                                        />
                                        <Label htmlFor="is_furnished">Amueblado</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="has_private_bathroom"
                                            checked={roomData.has_private_bathroom}
                                            onCheckedChange={(checked) => handleCheckboxChange("has_private_bathroom", checked)}
                                        />
                                        <Label htmlFor="has_private_bathroom">Baño Privado</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="has_kitchen_access"
                                            checked={roomData.has_kitchen_access}
                                            onCheckedChange={(checked) => handleCheckboxChange("has_kitchen_access", checked)}
                                        />
                                        <Label htmlFor="has_kitchen_access">Acceso a Cocina</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="has_wifi"
                                            checked={roomData.has_wifi}
                                            onCheckedChange={(checked) => handleCheckboxChange("has_wifi", checked)}
                                        />
                                        <Label htmlFor="has_wifi">Wi-Fi</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="has_washing_room"
                                            checked={roomData.has_washing_room}
                                            onCheckedChange={(checked) => handleCheckboxChange("has_washing_room", checked)}
                                        />
                                        <Label htmlFor="has_washing_room">Lavadora</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="has_air_condition"
                                            checked={roomData.has_air_condition}
                                            onCheckedChange={(checked) => handleCheckboxChange("has_air_condition", checked)}
                                        />
                                        <Label htmlFor="has_air_condition">Aire Acondicionado</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="has_tv"
                                            checked={roomData.has_tv}
                                            onCheckedChange={(checked) => handleCheckboxChange("has_tv", checked)}
                                        />
                                        <Label htmlFor="has_tv">TV</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="has_parking"
                                            checked={roomData.has_parking}
                                            onCheckedChange={(checked) => handleCheckboxChange("has_parking", checked)}
                                        />
                                        <Label htmlFor="has_parking">Parking</Label>
                                    </div>
                                </div>
                            </div>

                            {/* Campo de imagen de portada */}
                            <div>
                                <Label htmlFor="image_upload">Imagen de Portada (opcional)</Label>
                                <Input
                                    id="image_upload"
                                    type="file"
                                    onChange={handleImageChange}
                                    accept="image/*"
                                    className="file:text-primary file:bg-primary-foreground file:border-primary-foreground file:hover:bg-primary-foreground/90 file:mr-4 file:px-4 file:py-2 file:rounded-md file:border file:text-sm file:font-semibold"
                                />
                                {imageFile && (
                                    <p className="text-sm text-muted-foreground mt-2">Archivo seleccionado: {imageFile.name}</p>
                                )}
                            </div>

                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? "Guardando..." : "Guardar habitación"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AddRoomPage;