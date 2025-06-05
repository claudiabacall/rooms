// src/pages/OnboardingPage.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/SupabaseAuthContext.jsx";
import { supabase } from "@/supabaseClient";
import { v4 as uuidv4 } from 'uuid';

// Componentes de UI/Iconos
import {
    ArrowRight,
    CheckCircle,
    UserCircle2,
    MessageSquare,
    Smile,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import OnboardingProgressBar from "@/components/onboarding/OnboardingProgressBar.jsx";
import StepPersonalInfo from "@/components/onboarding/StepPersonalInfo.jsx";
import StepAboutYou from "@/components/onboarding/StepAboutYou.jsx";
import StepLifestyleTest from "@/components/onboarding/StepLifestyleTest.jsx";
import StepPhotoUpload from "@/components/onboarding/StepPhotoUpload.jsx";
import { generateLifestyleTags } from "@/lib/lifestyleTags";
import { lifestyleQuestions } from "@/lib/lifestyleQuestions";

const onboardingSteps = [
    {
        id: "personalInfo",
        title: "Información Personal",
        icon: <UserCircle2 size={48} className="text-primary" />,
        component: StepPersonalInfo,
    },
    {
        id: "aboutYou",
        title: "Sobre Ti",
        icon: <MessageSquare size={48} className="text-primary" />,
        component: StepAboutYou,
    },
    {
        id: "lifestyle",
        title: "Tu Estilo de Vida",
        icon: <Smile size={48} className="text-primary" />,
        component: StepLifestyleTest,
        questions: lifestyleQuestions,
    },
    {
        id: "photoUpload",
        title: "Tu Foto de Perfil",
        icon: <UserCircle2 size={48} className="text-primary" />,
        component: StepPhotoUpload,
    },
    {
        id: "summary",
        title: "¡Todo Listo!",
        icon: <CheckCircle size={48} className="text-green-500" />,
        component: ({ formData, onNext }) => (
            <div className="text-center">
                <p className="text-lg text-muted-foreground mb-4">
                    ¡Genial! Tu perfil está listo.
                </p>
                {/* Fallback with vercel.sh for email if no profile picture, or local URL for File object */}
                <img
                    src={formData.profilePicture instanceof File ? URL.createObjectURL(formData.profilePicture) : `https://avatar.vercel.sh/${formData.email || 'guest'}.png?size=256`}
                    alt="Avatar"
                    className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                />
                <p className="font-semibold text-xl mb-1">
                    {formData.fullName}, {formData.age}
                </p>
                <p className="text-muted-foreground mb-4">{formData.bio?.substring(0, 100)}{formData.bio?.length > 100 ? "..." : ""}</p>
                <Button
                    onClick={() => onNext()} // onNext for summary will trigger handleCompleteOnboarding
                    size="lg"
                    className="bg-green-500 hover:bg-green-600 text-white"
                >
                    Ir a Rooms <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
            </div>
        ),
    },
];

const OnboardingPage = () => {
    const { updateProfile, user, isAuthenticated, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [formData, setFormData] = useState({
        fullName: user?.user_metadata?.full_name || "",
        email: user?.email || "",
        age: "",
        gender: "",
        phone_number: "",
        bio: "",
        lifestyle: {},
        profilePicture: null,
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated) {
                navigate("/login", { replace: true });
            } else if (!user?.email_confirmed_at) {
                navigate("/verify-email", { replace: true });
            } else if (user?.onboarding_completed) {
                navigate("/perfil", { replace: true });
            }
        }
    }, [isAuthenticated, user, authLoading, navigate]);

    const validateField = (name, value) => {
        let error = "";
        setErrors((prev) => ({ ...prev, [name]: error }));
        return !error;
    };

    const handleNext = async (data) => {
        // Combinar los datos del paso actual con el formData general
        setFormData((prev) => ({ ...prev, ...data }));

        let stepIsValid = true;
        const currentStepId = onboardingSteps[currentStepIndex].id;

        // Basic validation for mandatory fields in each step
        if (currentStepId === "personalInfo") {
            if (!data.fullName || !data.age || !data.gender) {
                stepIsValid = false;
                toast({
                    title: "Datos incompletos",
                    description: "Por favor, completa todos los campos obligatorios de información personal.",
                    variant: "destructive",
                });
            }
        } else if (currentStepId === "aboutYou") {
            // Bio can be optional, no specific validation here unless you want to enforce it.
            // if (!data.bio) { /* validation logic */ }
        }
        // Lifestyle and PhotoUpload steps might have their own internal validation or are optional.

        if (!stepIsValid) {
            return; // Do not advance if the current step is not valid
        }

        if (currentStepIndex < onboardingSteps.length - 1) {
            setCurrentStepIndex((i) => i + 1);
        } else {
            // If it's the last step (summary), complete the onboarding
            handleCompleteOnboarding();
        }
    };

    const handlePrevious = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex((i) => i - 1);
        }
    };

    const handleCompleteOnboarding = async () => {
        setIsSubmitting(true);
        const lifestyleTags = generateLifestyleTags(formData.lifestyle);
        let avatarUrl = null;

        try {
            // 1. Upload profile picture if available
            if (formData.profilePicture) {
                const file = formData.profilePicture;
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}/${uuidv4()}.${fileExt}`;
                const filePath = `public/${fileName}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: false,
                    });

                if (uploadError) {
                    console.error("Error uploading avatar:", uploadError);
                    toast({
                        title: "Error al subir la foto",
                        description: uploadError.message || "No se pudo subir la foto de perfil. Puedes subirla más tarde.",
                        variant: "warning",
                    });
                } else {
                    const { data: publicUrlData } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(filePath);
                    avatarUrl = publicUrlData.publicUrl;
                }
            }

            // 2. Prepare data for 'profiles' table
            const profileUpdates = {
                age: formData.age ? parseInt(formData.age, 10) : null,
                gender: formData.gender,
                phone_number: formData.phone_number,
                bio: formData.bio,
                lifestyle_preferences: lifestyleTags,
                onboarding_completed: true,
                updated_at: new Date().toISOString(),
                avatar_url: avatarUrl,
            };

            // 3. Prepare data for user_metadata in Supabase Auth (if needed)
            const authMetadataUpdates = {
                onboarding_completed: true,
            };

            console.log("Datos de perfil a enviar a Supabase (profiles):", profileUpdates);
            console.log("Datos de metadata a enviar a Supabase Auth:", authMetadataUpdates);

            // 4. Call the generic updateProfile function from useAuth
            await updateProfile(profileUpdates, authMetadataUpdates);

            toast({
                title: "Onboarding completado",
                description: "¡Tu perfil está listo! Bienvenido a Rooms.",
                variant: "success",
            });
            navigate("/perfil", { replace: true });
        } catch (err) {
            console.error("Error al completar el onboarding:", err);
            toast({
                title: "Error al completar onboarding",
                description: err.message || "No se pudo finalizar el proceso de onboarding.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p>Cargando información de usuario...</p>
            </div>
        );
    }

    if (!user || !user.id) {
        return <div className="flex justify-center items-center min-h-screen">Redirigiendo...</div>;
    }

    const CurrentStepComponent = onboardingSteps[currentStepIndex].component;
    const currentStepConfig = onboardingSteps[currentStepIndex];

    return (
        <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-screen">
            <Card className="w-full max-w-xl shadow-lg">
                <CardHeader className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center rounded-full bg-primary/10">
                        {currentStepConfig.icon}
                    </div>
                    <CardTitle className="text-2xl font-bold">
                        {currentStepConfig.title}
                    </CardTitle>
                    <OnboardingProgressBar
                        currentStep={currentStepIndex + 1}
                        totalSteps={onboardingSteps.length}
                    />
                </CardHeader>
                <CardContent>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStepConfig.id}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            transition={{ duration: 0.3 }}
                        >
                            <CurrentStepComponent
                                formData={formData}
                                setFormData={setFormData}
                                onNext={handleNext}
                                onPrevious={handlePrevious}
                                questions={currentStepConfig.questions}
                                isSubmitting={isSubmitting}
                                errors={errors}
                                validateField={validateField}
                                user={user}
                                // Pass these to allow step components to conditionally render buttons
                                currentStepIndex={currentStepIndex}
                                totalSteps={onboardingSteps.length}
                            />
                            {/* The navigation buttons are now expected to be rendered INSIDE each CurrentStepComponent */}
                        </motion.div>
                    </AnimatePresence>
                </CardContent>
            </Card>
        </div>
    );
};

export default OnboardingPage;