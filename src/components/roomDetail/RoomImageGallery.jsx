import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const RoomImageGallery = ({ imageUrls }) => {
    if (!imageUrls || imageUrls.length === 0) {
        return null; // No renderizar si no hay imágenes
    }

    return (
        <Card className="shadow-lg rounded-xl overflow-hidden">
            <CardHeader>
                <CardTitle>Imágenes de la habitación</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {imageUrls.map((imageUrl, index) => (
                        <img
                            key={index}
                            src={imageUrl}
                            alt={`Imagen de la habitación ${index + 1}`}
                            className="w-full h-48 object-cover rounded-md shadow-sm"
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default RoomImageGallery;