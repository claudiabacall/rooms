
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LogOut, ShieldAlert } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const SecuritySettings = () => {
  const { toast } = useToast();

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("userPhone");
    localStorage.removeItem("userAddress");
    localStorage.removeItem("userAvatarUrl");
    localStorage.removeItem("userBio");
    localStorage.removeItem("userInterests");
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente. Serás redirigido.",
    });
    // Idealmente, aquí se redirigiría al usuario a la página de inicio o login.
    // Ejemplo: navigate("/"); (si se usa useNavigate de react-router-dom)
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    toast({
      title: "Funcionalidad no implementada",
      description: "El cambio de contraseña aún no está disponible en este prototipo.",
      variant: "destructive"
    });
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Configuración de Seguridad</CardTitle>
        <CardDescription>Administra la seguridad de tu cuenta Rooms.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <Label htmlFor="current-password">Contraseña Actual</Label>
            <Input id="current-password" type="password" className="mt-1" placeholder="••••••••" />
          </div>
          <div>
            <Label htmlFor="new-password">Nueva Contraseña</Label>
            <Input id="new-password" type="password" className="mt-1" placeholder="••••••••" />
          </div>
          <div>
            <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
            <Input id="confirm-password" type="password" className="mt-1" placeholder="••••••••" />
          </div>
          <Button type="submit" className="w-full">
            <ShieldAlert className="mr-2 h-4 w-4" /> Cambiar Contraseña
          </Button>
        </form>
        <Button variant="destructive" className="w-full mt-4" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión en Rooms
        </Button>
      </CardContent>
    </Card>
  );
};

export default SecuritySettings;
