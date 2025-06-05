import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // <--- Corregido de '=>' a 'from'
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/supabaseClient";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { Checkbox } from "@/components/ui/checkbox";

const CreateCommunityPage = () => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [isPrivate, setIsPrivate] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user } = useAuth(); // Obtenemos el usuario del contexto

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Usar el usuario del contexto directamente
        if (!user) {
            toast({
                title: "Error de autenticación",
                description: "Debes iniciar sesión para crear una comunidad.",
                variant: "destructive"
            });
            setIsSubmitting(false);
            return;
        }

        let imageUrl = "https://via.placeholder.com/400x200.png?text=Nueva+Comunidad";

        try {
            // 1. Subir la imagen a Supabase Storage si se ha seleccionado una
            if (imageFile) {
                const fileExt = imageFile.name.split(".").pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
                const filePath = `community_covers/${user.id}/${fileName}`; // Usar user.id del contexto

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from("community-images") // <-- Asegúrate que este es el nombre correcto de tu bucket
                    .upload(filePath, imageFile, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) {
                    throw uploadError;
                }

                const { data: publicUrlData } = supabase.storage
                    .from("community-images") // <-- El mismo nombre del bucket
                    .getPublicUrl(filePath);

                imageUrl = publicUrlData.publicUrl;
            }

            // 2. Insertar los datos de la comunidad
            const newCommunity = {
                name,
                description,
                image_url: imageUrl,
                owner_id: user.id, // Aquí usamos el user.id del contexto
                is_private: isPrivate,
            };

            const { data: communityData, error: communityError } = await supabase
                .from("communities")
                .insert([newCommunity])
                .select()
                .single();

            if (communityError) {
                throw communityError;
            }

            // 3. Insertar al creador de la comunidad en la tabla community_members como 'admin'
            const { error: memberError } = await supabase
                .from("community_members")
                .insert([
                    {
                        community_id: communityData.id,
                        user_id: user.id, // Aquí también usamos el user.id del contexto
                        role: "admin",
                    },
                ]);

            if (memberError) {
                console.error("Error inserting community creator as member:", memberError);
                // Si falla la inserción del miembro, intenta borrar la comunidad para mantener la consistencia
                await supabase.from("communities").delete().eq("id", communityData.id);
                throw new Error("Comunidad creada, pero error al asignarte como administrador. La comunidad ha sido eliminada.");
            }

            toast({ title: "Comunidad creada", description: `"${name}" fue creada con éxito.` });
            navigate(`/comunidades/${communityData.id}`);
        } catch (error) {
            console.error("Error al crear comunidad:", error);
            toast({
                title: "Error",
                description: error.message || "No se pudo crear la comunidad.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <Button variant="ghost" onClick={() => navigate("/comunidades")} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver
            </Button>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl flex items-center">
                            <PlusCircle className="mr-2" /> Crear Nueva Comunidad
                        </CardTitle>
                        <CardDescription>Dale vida a un nuevo espacio para conectar.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <Label htmlFor="comm-name">Nombre de la Comunidad</Label>
                                <Input
                                    id="comm-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    placeholder="Ej. Amantes del Senderismo"
                                />
                            </div>
                            <div>
                                <Label htmlFor="comm-desc">Descripción</Label>
                                <Textarea
                                    id="comm-desc"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                    placeholder="Describe de qué trata tu comunidad, qué tipo de actividades se harán..."
                                    rows={5}
                                />
                            </div>
                            <div>
                                <Label htmlFor="comm-image">Imagen de Portada (opcional)</Label>
                                <Input
                                    id="comm-image"
                                    type="file"
                                    onChange={handleImageChange}
                                    accept="image/*"
                                    className="file:text-primary file:bg-primary-foreground file:border-primary-foreground file:hover:bg-primary-foreground/90 file:mr-4 file:px-4 file:py-2 file:rounded-md file:border file:text-sm file:font-semibold"
                                />
                                {imageFile && (
                                    <p className="text-sm text-muted-foreground mt-2">Archivo seleccionado: {imageFile.name}</p>
                                )}
                            </div>

                            <div className="flex items-center space-x-2 mt-4">
                                <Checkbox
                                    id="isPrivate"
                                    checked={isPrivate}
                                    onCheckedChange={setIsPrivate}
                                />
                                <label
                                    htmlFor="isPrivate"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Hacer esta comunidad privada (solo miembros aprobados podrán ver y unirse)
                                </label>
                            </div>

                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? "Creando..." : "Crear Comunidad"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default CreateCommunityPage;