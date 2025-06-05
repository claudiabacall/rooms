
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SaveAll } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";


const NotificationSettings = () => {
  const { toast } = useToast();

  const handleSavePreferences = (e) => {
    e.preventDefault();
    toast({
      title: "Preferencias guardadas",
      description: "Tus preferencias de notificación han sido actualizadas (simulación).",
    });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Preferencias de Notificación</CardTitle>
        <CardDescription>Elige cómo quieres que Rooms te mantenga informado.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSavePreferences} className="space-y-6">
          <div className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <Label htmlFor="match-notifications" className="flex flex-col space-y-1 cursor-pointer flex-grow pr-4">
              <span>Nuevos Matches y Conexiones</span>
              <span className="font-normal leading-snug text-muted-foreground text-sm">
                Recibe alertas cuando tengas un nuevo match con un piso o compañero.
              </span>
            </Label>
            <Checkbox id="match-notifications" defaultChecked />
          </div>
          <div className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <Label htmlFor="message-notifications" className="flex flex-col space-y-1 cursor-pointer flex-grow pr-4">
              <span>Mensajes de Chat</span>
              <span className="font-normal leading-snug text-muted-foreground text-sm">
                Notificaciones de nuevos mensajes en tus conversaciones.
              </span>
            </Label>
            <Checkbox id="message-notifications" defaultChecked />
          </div>
          <div className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <Label htmlFor="community-notifications" className="flex flex-col space-y-1 cursor-pointer flex-grow pr-4">
              <span>Actividad en Comunidades</span>
              <span className="font-normal leading-snug text-muted-foreground text-sm">
                Alertas sobre nuevos posts o actividad relevante en tus comunidades.
              </span>
            </Label>
            <Checkbox id="community-notifications" />
          </div>
          <div className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <Label htmlFor="newsletter-notifications" className="flex flex-col space-y-1 cursor-pointer flex-grow pr-4">
              <span>Newsletter y Novedades de Rooms</span>
              <span className="font-normal leading-snug text-muted-foreground text-sm">
                Recibe nuestro boletín con consejos, guías y nuevas funcionalidades.
              </span>
            </Label>
            <Checkbox id="newsletter-notifications" />
          </div>
          <Button type="submit" className="w-full mt-4">
            <SaveAll className="mr-2 h-4 w-4" /> Guardar Preferencias
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
