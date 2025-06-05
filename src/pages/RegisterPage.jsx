// src/pages/RegisterPage.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/SupabaseAuthContext.jsx";

// Importaciones de UI
import {
    UserPlus,
    Mail,
    ArrowRight,
    Eye,
    EyeOff,
    UserCircle2,
} from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";

// Componente para el indicador de fuerza de contraseña
const PasswordStrengthIndicator = ({ password }) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    const colors = ["bg-destructive", "bg-orange-500", "bg-yellow-500", "bg-green-500"];
    const labels = ["Muy Débil", "Débil", "Aceptable", "Fuerte"];

    return (
        <div className="mt-1">
            <div className="flex h-1.5 rounded-full overflow-hidden">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className={`w-1/4 ${i < strength ? colors[i] : "bg-muted"}`} />
                ))}
            </div>
            {password && <p className="text-xs mt-1 text-right">{labels[strength - 1] || ""}</p>}
        </div>
    );
};

const RegisterPage = () => {
    const { register } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        acceptTerms: false,
        acceptPrivacy: false,
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const validateField = (name, value) => {
        let error = "";
        switch (name) {
            case "fullName":
                if (!value.trim()) error = "El nombre completo es obligatorio.";
                break;
            case "email":
                if (!value.trim()) error = "El correo electrónico es obligatorio.";
                else if (!/\S+@\S+\.\S+/.test(value)) error = "Formato de correo inválido.";
                break;
            case "password":
                if (!value) error = "La contraseña es obligatoria.";
                else if (value.length < 8) error = "La contraseña debe tener al menos 8 caracteres.";
                break;
            case "confirmPassword":
                if (!value) error = "Confirma tu contraseña.";
                else if (value !== formData.password) error = "Las contraseñas no coinciden.";
                break;
            case "acceptTerms":
                if (!value) error = "Debes aceptar los términos y condiciones.";
                break;
            case "acceptPrivacy":
                if (!value) error = "Debes aceptar la política de privacidad.";
                break;
            default:
                break;
        }
        setErrors((prev) => ({ ...prev, [name]: error }));
        return !error;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === "checkbox" ? checked : value;
        setFormData((prev) => ({ ...prev, [name]: val }));
        validateField(name, val);
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        validateField(name, value);
    };

    const canRegister = formData.acceptTerms && formData.acceptPrivacy;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const fieldsToValidate = ["fullName", "email", "password", "confirmPassword", "acceptTerms", "acceptPrivacy"];
        let formIsValid = true;
        for (const field of fieldsToValidate) {
            if (!validateField(field, formData[field])) {
                formIsValid = false;
            }
        }

        if (formIsValid && canRegister) {
            try {
                const { user: registeredUser } = await register({
                    email: formData.email,
                    password: formData.password,
                    fullName: formData.fullName,
                });

                if (registeredUser && !registeredUser.email_confirmed_at) {
                    // Si el email NO está confirmado, redirige a la página de verificación.
                    // Aquí asumimos que VerifyEmailPage puede tomar el email como prop o leerlo del contexto.
                    navigate("/verify-email", { state: { email: formData.email }, replace: true });
                    toast({
                        title: "Registro exitoso",
                        description: "Por favor, verifica tu correo electrónico para continuar. Hemos enviado un email.",
                        variant: "success",
                    });
                } else {
                    // Esto es raro para un nuevo registro, pero si el email ya está confirmado (ej. auto-confirm)
                    // entonces el usuario puede ir directamente al onboarding.
                    navigate("/onboarding", { replace: true });
                    toast({
                        title: "Registro exitoso",
                        description: "¡Bienvenido a Rooms! Por favor, completa tu perfil.",
                        variant: "success",
                    });
                }
            } catch (err) {
                console.error("Registration error:", err);
                toast({
                    title: "Error al registrar",
                    description: err.message || "Ha ocurrido un error inesperado.",
                    variant: "destructive",
                });
            }
        } else {
            toast({
                title: "Errores en el formulario",
                description: "Por favor, corrige los errores y acepta los términos.",
                variant: "destructive",
            });
        }
        setIsSubmitting(false);
    };

    return (
        <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-screen">
            <Card className="w-full max-w-xl shadow-lg">
                <CardHeader className="text-center">
                    <UserPlus className="h-12 w-12 mx-auto text-primary mb-3" />
                    <CardTitle className="text-3xl font-bold">Crear Cuenta</CardTitle>
                    <CardDescription>Únete a Rooms para encontrar tu próximo hogar y compañeros de piso.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key="register-form"
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            transition={{ duration: 0.3 }}
                        >
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label htmlFor="fullName">Nombre completo</Label>
                                    <div className="relative">
                                        <UserCircle2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="fullName"
                                            name="fullName"
                                            type="text"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            placeholder="Tu nombre y apellidos"
                                            className={`pl-10 ${errors.fullName ? "border-destructive" : ""}`}
                                        />
                                    </div>
                                    {errors.fullName && (
                                        <p className="text-xs text-destructive mt-1">{errors.fullName}</p>
                                    )}
                                </div>
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
                                            className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="text-xs text-destructive mt-1">{errors.email}</p>
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="password">Contraseña</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            value={formData.password}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            placeholder="Crea una contraseña"
                                            className={`pr-10 ${errors.password ? "border-destructive" : ""}`}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                    <PasswordStrengthIndicator password={formData.password} />
                                    {errors.password && (
                                        <p className="text-xs text-destructive mt-1">{errors.password}</p>
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                                    <div className="relative">
                                        <Input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            placeholder="Repite tu contraseña"
                                            className={`pr-10 ${errors.confirmPassword ? "border-destructive" : ""}`}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                    {errors.confirmPassword && (
                                        <p className="text-xs text-destructive mt-1">{errors.confirmPassword}</p>
                                    )}
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="acceptTerms"
                                        name="acceptTerms"
                                        checked={formData.acceptTerms}
                                        onCheckedChange={(checked) => handleChange({ target: { name: "acceptTerms", type: "checkbox", checked } })}
                                    />
                                    <label
                                        htmlFor="acceptTerms"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Acepto los{" "}
                                        <Link to="/terminos" className="underline hover:text-primary">
                                            Términos y Condiciones
                                        </Link>
                                        .
                                    </label>
                                </div>
                                {errors.acceptTerms && (
                                    <p className="text-xs text-destructive mt-1">{errors.acceptTerms}</p>
                                )}
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="acceptPrivacy"
                                        name="acceptPrivacy"
                                        checked={formData.acceptPrivacy}
                                        onCheckedChange={(checked) => handleChange({ target: { name: "acceptPrivacy", type: "checkbox", checked } })}
                                    />
                                    <label
                                        htmlFor="acceptPrivacy"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Acepto la{" "}
                                        <Link to="/privacidad" className="underline hover:text-primary">
                                            Política de Privacidad
                                        </Link>
                                        .
                                    </label>
                                </div>
                                {errors.acceptPrivacy && (
                                    <p className="text-xs text-destructive mt-1">{errors.acceptPrivacy}</p>
                                )}
                                <motion.div whileTap={{ scale: 0.98 }}>
                                    <Button
                                        type="submit"
                                        className="w-full btn-primary"
                                        disabled={isSubmitting || !canRegister || Object.values(errors).some(err => err)}
                                    >
                                        {isSubmitting ? "Registrando..." : "Crear Cuenta"} <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </motion.div>
                                <p className="mt-6 text-center text-sm text-muted-foreground">
                                    ¿Ya tienes cuenta?{" "}
                                    <Link to="/login" className="underline hover:text-primary">
                                        Inicia sesión
                                    </Link>
                                </p>
                            </form>
                        </motion.div>
                    </AnimatePresence>
                </CardContent>
            </Card>
        </div>
    );
};

export default RegisterPage;