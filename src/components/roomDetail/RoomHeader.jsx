import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bed, Maximize, MapPin, Euro, Calendar } from "lucide-react";

const RoomHeader = ({ room }) => {
    return (
        <Card className="shadow-lg rounded-xl overflow-hidden">
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">{room.title}</h1>
                        <p className="text-lg text-muted-foreground flex items-center mt-2">
                            <MapPin className="h-5 w-5 mr-2" />
                            {room.address}, {room.location}
                        </p>
                    </div>
                    <div className="text-right">
                        <span className="text-5xl font-bold text-primary flex items-center">
                            {room.price} <Euro className="h-8 w-8 ml-2" />
                        </span>
                        <p className="text-muted-foreground text-sm">/mes</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3 mt-4">
                    <Badge variant="secondary" className="px-3 py-1 text-base flex items-center gap-2">
                        <Bed className="h-4 w-4" /> {room.number_of_beds} Camas
                    </Badge>
                    <Badge variant="secondary" className="px-3 py-1 text-base flex items-center gap-2">
                        <Maximize className="h-4 w-4" /> {room.area_sqm} m²
                    </Badge>
                    <Badge variant="secondary" className="px-3 py-1 text-base flex items-center gap-2">
                        <Calendar className="h-4 w-4 mr-1" /> Disponible desde: {new Date(room.availableFrom).toLocaleDateString('es-ES')}
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );
};

export default RoomHeader;