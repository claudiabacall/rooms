import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Edit, Trash2 } from "lucide-react";

const ManagePropertySection = ({ roomId, onDeleteRoom }) => {
    const navigate = useNavigate();

    return (
        <Card className="shadow-lg rounded-xl text-center p-6">
            <CardTitle className="text-2xl font-bold text-gray-900 mb-4">
                Gestionar tu Propiedad
            </CardTitle>
            <Separator className="my-4" />
            <div className="space-y-3">
                <Button
                    onClick={() => navigate(`/editar-habitacion/${roomId}`)}
                    className="w-full gap-2"
                >
                    <Edit className="h-5 w-5" /> Editar Propiedad
                </Button>
                <Button
                    onClick={onDeleteRoom}
                    variant="destructive"
                    className="w-full gap-2"
                >
                    <Trash2 className="h-5 w-5" /> Eliminar Propiedad
                </Button>
            </div>
        </Card>
    );
};

export default ManagePropertySection;