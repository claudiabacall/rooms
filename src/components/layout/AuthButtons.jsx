import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, LogOut, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/SupabaseAuthContext.jsx";
import { useToast } from "@/components/ui/use-toast";
import { Link, useNavigate } from "react-router-dom";

const AuthButtons = ({ isMobile }) => {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, logout, user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const buttonClass = isMobile ? "w-full mt-2" : "ml-2";
  const emailId = isMobile ? "mobile-email" : "email";
  const passwordId = isMobile ? "mobile-password" : "password";

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // *** CORRECCIÓN CRÍTICA AQUÍ ***
      // La función `login` en tu `SupabaseAuthContext.jsx` espera un OBJETO
      // con las propiedades `email` y `password`, no argumentos separados.
      await login({ email: loginEmail, password: loginPassword }); // <-- Cambio aquí

      setLoginEmail('');
      setLoginPassword('');
      setOpenDialog(false);
      toast({
        title: "Inicio de sesión exitoso",
        description: "¡Bienvenido de nuevo a Rooms!",
        variant: "success",
      });
    } catch (error) {
      console.error("Login error:", error); // Esto es bueno para depurar
      toast({
        title: "Error de inicio de sesión",
        description: error.message || "Por favor, verifica tus credenciales e inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoutClick = async () => {
    try {
      await logout();
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente.",
      });
      navigate("/"); // Redirige a la home o a la página de login después de cerrar sesión
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error al cerrar sesión",
        description: error.message || "No se pudo cerrar la sesión.",
        variant: "destructive",
      });
    }
  };

  const handleNavigateToRegister = () => {
    setOpenDialog(false);
    navigate('/registro');
  };

  // Usa isAuthenticated de useAuth
  if (isAuthenticated) {
    return (
      <Button variant="outline" onClick={handleLogoutClick} className={buttonClass}>
        <LogOut className="mr-2 h-4 w-4" />
        Cerrar sesión
      </Button>
    );
  }

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild>
        <Button className={buttonClass} onClick={() => setOpenDialog(true)}>
          <LogIn className="mr-2 h-4 w-4" />
          Iniciar sesión
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Iniciar sesión en Rooms</DialogTitle>
          <DialogDescription>
            Ingresa tus credenciales para conectar con tu comunidad.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleLoginSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor={emailId}>Correo electrónico</Label>
            <Input
              id={emailId}
              type="email"
              placeholder="tu@email.com"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={passwordId}>Contraseña</Label>
            <div className="relative">
              <Input
                id={passwordId}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                disabled={isSubmitting}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <Link to="/recuperar-contrasena" className="text-sm text-primary hover:underline mt-1 block text-right">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between items-center">
            <p className="text-sm text-muted-foreground mt-2 sm:mt-0 order-2 sm:order-1">
              ¿No tienes cuenta?{" "}
              <Button variant="link" className="p-0 h-auto text-primary" onClick={handleNavigateToRegister}>
                Regístrate aquí
              </Button>
            </p>
            <div className="flex gap-2 order-1 sm:order-2 w-full sm:w-auto mt-4 sm:mt-0">
              <Button type="button" variant="outline" onClick={() => setOpenDialog(false)} disabled={isSubmitting}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Iniciando..." : "Iniciar sesión"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AuthButtons;