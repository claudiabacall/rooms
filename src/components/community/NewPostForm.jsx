// src/components/community/NewPostForm.jsx
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

// Eliminamos isMember de las props aquí, ya que el componente padre controla esto.
// user se mantiene para validar si hay usuario logueado para publicar.
const NewPostForm = ({ onPostSubmit, isPosting, user }) => { // isMember y isOwner ya no son props directas para controlar la visibilidad.
    const [newPostText, setNewPostText] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        await onPostSubmit(newPostText);
        setNewPostText(""); // Clear the input after submission
    };

    // La lógica de si el formulario se muestra o no ahora reside completamente en CommunityDetailPage.jsx
    // Este componente NewPostForm solo necesita saber si hay un usuario logueado.
    if (!user) { // Este chequeo todavía es bueno para prevenir si el usuario se desloguea mientras está en la página.
        return (
            <p className="text-muted-foreground mb-6">
                Inicia sesión para publicar.
            </p>
        );
    }

    // Eliminamos esta comprobación, ya que CommunityDetailPage ya la hace
    // if (!isMember) {
    //     return (
    //         <p className="text-muted-foreground mb-6">
    //             Debes unirte a la comunidad para publicar.
    //         </p>
    //     );
    // }

    return (
        <Card className="mb-6">
            <CardContent className="p-4">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <Textarea
                        value={newPostText}
                        onChange={(e) => setNewPostText(e.target.value)}
                        placeholder="Comparte algo con la comunidad..."
                        className="flex-grow"
                        disabled={isPosting}
                    />
                    <Button type="submit" disabled={isPosting}>
                        <MessageSquare className="mr-2 h-4 w-4" /> {isPosting ? "Publicando..." : "Publicar"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default NewPostForm;