
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarDays } from "lucide-react";

const BookingCard = ({ price }) => {
  return (
    <Card className="shadow-lg sticky top-24">
      <CardHeader>
        <CardTitle className="text-2xl">Reserva este piso</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold">Precio:</span>
          <span className="text-2xl font-bold text-primary">€{price}/mes</span>
        </div>
        <div>
          <Label htmlFor="checkin-date" className="block text-sm font-medium mb-1">Fecha de entrada deseada</Label>
          <Input type="date" id="checkin-date" className="w-full" />
        </div>
        <div>
          <Label htmlFor="message-to-host" className="block text-sm font-medium mb-1">Mensaje al propietario (opcional)</Label>
          <Input type="text" id="message-to-host" placeholder="¡Hola! Estoy interesado..." className="w-full" />
        </div>
        <Button size="lg" className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
          <CalendarDays className="mr-2 h-5 w-5" /> Enviar Solicitud de Reserva
        </Button>
        <p className="text-xs text-muted-foreground text-center">No se te cobrará nada hasta que el propietario acepte.</p>
      </CardContent>
    </Card>
  );
};

export default BookingCard;
