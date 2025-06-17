import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const RoomAdditionalDetails = ({ houseRules, idealFlatmate }) => {
    return (
        <Card className="shadow-lg rounded-xl">
            <CardHeader><CardTitle>Detalles adicionales</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h4 className="font-semibold text-foreground mb-1">Normas de la casa</h4>
                    <p className="text-muted-foreground text-sm">{houseRules || "No hay normas específicas mencionadas."}</p>
                </div>
                <div>
                    <h4 className="font-semibold text-foreground mb-1">Compañero/a de piso ideal</h4>
                    <p className="text-muted-foreground text-sm">{idealFlatmate || "El propietario no ha especificado el perfil del compañero ideal."}</p>
                </div>
            </CardContent>
        </Card>
    );
};

export default RoomAdditionalDetails;