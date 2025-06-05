// src/pages/VerifyEmailPage.jsx
import React, { useState, useEffect } from "react";
import { Mail, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/SupabaseAuthContext.jsx";
import { supabase } from "@/supabaseClient";
import { useNavigate, useLocation } from "react-router-dom"; // Import useLocation

const VerifyEmailPage = () => {
    const { toast } = useToast();
    const { user, isAuthenticated, loading: authLoading } = useAuth(); // Obtén el usuario del contexto
    const navigate = useNavigate();
    const location = useLocation(); // Para acceder al state de la navegación

    const [verifyMessage, setVerifyMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Obtener el email del usuario (preferiblemente del objeto `user` si está autenticado,
    // o del `location.state` si viene de un registro reciente)
    const userEmail = user?.email || location.state?.email || "";

    useEffect(() => {
        // Redirigir si el usuario ya verificó el email
        if (!authLoading && isAuthenticated) {
            if (user?.email_confirmed_at) {
                if (user?.onboarding_completed) {
                    navigate("/perfil", { replace: true });
                } else {
                    navigate("/onboarding", { replace: true });
                }
            }
        }
    }, [isAuthenticated, user, authLoading, navigate]);

    const resendVerificationEmail = async () => {
        if (!userEmail) {
            toast({
                title: "Error",
                description: "No se pudo determinar tu correo electrónico para reenviar la verificación.",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);
        const { error } = await supabase.auth.resend({
            type: "signup",
            email: userEmail,
        });
        if (error) {
            setVerifyMessage(`Error reenviando correo: ${error.message}`);
            toast({
                title: "Error al reenviar correo",
                description: error.message,
                variant: "destructive",
            });
        } else {
            setVerifyMessage("Correo de verificación reenviado. Revisa tu bandeja de entrada.");
            toast({
                title: "Correo reenviado",
                description: "Revisa tu bandeja de entrada o la carpeta de spam.",
            });
        }
        setIsSubmitting(false);
    };

    const checkEmailVerified = async () => {
        setIsSubmitting(true);
        // Fuerza la obtención de la sesión más reciente de Supabase
        const { data: { user: currentUserAfterRefresh }, error } = await supabase.auth.getUser();

        if (error) {
            setVerifyMessage(`Error al comprobar: ${error.message}`);
            toast({
                title: "Error de verificación",
                description: error.message,
                variant: "destructive",
            });
        } else if (currentUserAfterRefresh?.email_confirmed_at) {
            // Si el email está confirmado, el contexto de autenticación debería actualizarse.
            // La lógica en el `useEffect` de esta página o `PrivateRoute` manejará la redirección.
            toast({
                title: "Correo verificado",
                description: "¡Email verificado! Redirigiendo...",
                variant: "success",
            });
            // El `useEffect` se encargará de la navegación a /onboarding o /perfil
        } else {
            setVerifyMessage("El correo aún no ha sido verificado. Por favor, haz clic en el enlace de tu email.");
            toast({
                title: "Verificación pendiente",
                description: "Tu correo electrónico aún no ha sido verificado. Inténtalo de nuevo en unos segundos.",
                variant: "warning",
            });
        }
        setIsSubmitting(false);
    };

    if (authLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p>Cargando información de usuario...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-screen">
            <Card className="w-full max-w-xl shadow-lg">
                <CardHeader className="text-center">
                    <Mail className="h-12 w-12 mx-auto text-primary mb-3" />
                    <CardTitle className="text-2xl font-bold">Verifica tu Email</CardTitle>
                    <CardDescription>
                        Hemos enviado un enlace de verificación a{" "}
                        <strong className="text-primary">{userEmail || "tu correo electrónico"}</strong>. Por favor, revísalo para activar tu cuenta.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-center">
                    <p className="text-sm text-muted-foreground">{verifyMessage}</p>
                    <Button
                        onClick={resendVerificationEmail}
                        disabled={isSubmitting || !userEmail}
                        className="w-full"
                    >
                        {isSubmitting ? "Reenviando..." : "Reenviar Correo de Verificación"}
                    </Button>
                    <Button
                        onClick={checkEmailVerified}
                        disabled={isSubmitting}
                        variant="secondary"
                        className="w-full"
                    >
                        {isSubmitting ? "Comprobando..." : "Ya he verificado mi email"} <CheckCircle className="ml-2 h-4 w-4" />
                    </Button>
                    <p className="mt-4 text-sm text-muted-foreground">
                        ¿No encuentras el correo? Revisa tu carpeta de spam.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default VerifyEmailPage;