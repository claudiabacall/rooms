import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { LogIn, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/SupabaseAuthContext.jsx";

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  // No necesitamos el 'user' del contexto aquí para la lógica de redirección post-login
  // porque esperaremos que 'login' nos devuelva el user más actualizado.
  const { login, isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = (name, value) => {
    let errorMsg = "";
    if (name === "email") {
      if (!value.trim()) errorMsg = "El correo electrónico es obligatorio.";
      else if (!/\S+@\S+\.\S+/.test(value)) errorMsg = "Formato de correo inválido.";
    } else if (name === "password") {
      if (!value) errorMsg = "La contraseña es obligatoria.";
    }
    setErrors((prev) => ({ ...prev, [name]: errorMsg }));
    return !errorMsg;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    let isValid = true;
    // Validar todos los campos antes de enviar
    Object.keys(formData).forEach((key) => {
      if (!validateField(key, formData[key])) isValid = false;
    });

    if (isValid) {
      try {
        // La función 'login' del contexto ahora debe devolver el objeto 'user'
        // con la propiedad 'onboarding_completed' y 'email_confirmed_at'
        const { user: loggedInUser } = await login({
          email: formData.email,
          password: formData.password,
        });

        // Redirigir según el estado del usuario retornado
        if (loggedInUser?.onboarding_completed) {
          navigate("/"); // Redirigir a la home si el onboarding está completo
        } else if (!loggedInUser?.email_confirmed_at) {
          navigate("/verify-email"); // Redirigir a verificación de email si no está confirmado
        }
        else {
          navigate("/registro"); // Redirigir al flujo de registro/onboarding si no está completo
        }
      } catch (error) {
        toast({
          title: "Error de inicio de sesión",
          description: error.message || "Credenciales inválidas. Inténtalo de nuevo.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Errores en el formulario",
        description: "Por favor, corrige los errores antes de enviar.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  };

  // Determinar si el formulario es válido para habilitar el botón de envío
  const isFormValid =
    Object.values(errors).every((error) => !error) &&
    formData.email &&
    formData.password;

  // Si ya está autenticado, redirigir a la página de inicio
  // Este chequeo es independiente de la lógica post-submit y asegura que
  // los usuarios autenticados no puedan acceder a la página de login.
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-128px)]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <LogIn className="h-12 w-12 mx-auto text-primary mb-3" />
            <CardTitle className="text-3xl font-bold">Bienvenido/a de Nuevo</CardTitle>
            <CardDescription>Inicia sesión para continuar en Rooms.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Correo electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="tu@email.com"
                    className={`pl-10 mt-1 ${errors.email ? "border-destructive" : ""}`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive mt-1">{errors.email}</p>
                )}
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">Contraseña</Label>
                  {/* Asegúrate de que esta ruta exista en tu App.jsx */}
                  <Link
                    to="/forgot-password"
                    tabIndex={-1}
                    className="text-xs text-primary hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Tu contraseña"
                    className={`pl-10 mt-1 ${errors.password ? "border-destructive" : ""}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive mt-1">{errors.password}</p>
                )}
              </div>

              <motion.div whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  className="w-full btn-primary"
                  disabled={!isFormValid || isSubmitting}
                >
                  {isSubmitting ? "Iniciando Sesión..." : "Entrar"}{" "}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              ¿No tienes cuenta?{" "}
              <Link to="/registro" className="font-medium text-primary hover:underline">
                Regístrate aquí
              </Link>
            </p>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  O inicia sesión con
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Button variant="outline" className="w-full" disabled>
                Google (Próximamente)
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default LoginPage;