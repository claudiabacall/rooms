import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const RoomDescription = ({ description }) => {
    return (
        <Card className="shadow-lg rounded-xl">
            <CardHeader><CardTitle>Descripción</CardTitle></CardHeader>
            <CardContent>
                <p className="text-muted-foreground leading-relaxed">{description || "No hay descripción disponible para esta habitación."}</p>
            </CardContent>
        </Card>
    );
};

export default RoomDescription;