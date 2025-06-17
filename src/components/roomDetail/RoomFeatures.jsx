import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bed, Bath, Utensils, Wifi, WashingMachine, Fan, Tv, ParkingCircle } from "lucide-react";

// Mapeo de propiedades booleanas a iconos de Lucide (puedes pasarlo como prop si quieres)
const featureIcons = {
    is_furnished: <Bed className="h-5 w-5 text-primary" />,
    has_private_bathroom: <Bath className="h-5 w-5 text-primary" />,
    has_kitchen_access: <Utensils className="h-5 w-5 text-primary" />,
    has_wifi: <Wifi className="h-5 w-5 text-primary" />,
    has_washing_room: <WashingMachine className="h-5 w-5 text-primary" />,
    has_air_condition: <Fan className="h-5 w-5 text-primary" />,
    has_tv: <Tv className="h-5 w-5 text-primary" />,
    has_parking: <ParkingCircle className="h-5 w-5 text-primary" />,
};

const RoomFeatures = ({ room }) => {
    const amenities = [
        { label: "Amueblado", key: "is_furnished" },
        { label: "Baño privado", key: "has_private_bathroom" },
        { label: "Acceso a Cocina", key: "has_kitchen_access" },
        { label: "Wi-Fi", key: "has_wifi" },
        { label: "Lavadora", key: "has_washing_room" },
        { label: "Aire acondicionado", key: "has_air_condition" },
        { label: "TV", key: "has_tv" },
        { label: "Parking", key: "has_parking" },
    ].filter(a => room[a.key]); // Filtra solo las comodidades que son true

    if (amenities.length === 0) {
        return null;
    }

    return (
        <Card className="shadow-lg rounded-xl">
            <CardHeader><CardTitle>Características y servicios</CardTitle></CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {amenities.map((amenity, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-foreground font-medium">
                            {featureIcons[amenity.key]}
                            <span>{amenity.label}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default RoomFeatures;