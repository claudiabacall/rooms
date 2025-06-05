import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import MatchBadge from "@/components/ui/match-badge.jsx";
import { useAuth } from "@/contexts/SupabaseAuthContext.jsx";
import { lifestyleQuestions } from "@/lib/lifestyleQuestions";

import {
  Instagram as InstagramIcon,
  Linkedin as LinkedinIcon,
  Twitter as TwitterIcon,
  Globe2 as WebsiteIcon,
  Briefcase as BriefcaseIcon, // Ícono para ocupación
  User as UserIcon, // Ícono para pronombres
  Facebook as FacebookIcon, // Puedes añadir más iconos si lo necesitas
  Youtube as YoutubeIcon,
} from "lucide-react";

const ProfileCard = ({ userProfile, onReportUser, isOwnProfile }) => {
  const { user: authUser } = useAuth();

  // Si userProfile es null o undefined, muestra un mensaje de carga/error
  if (!userProfile) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No se pudo cargar la información del perfil.
      </div>
    );
  }

  // Calcula el score de compatibilidad solo si no es el propio perfil y hay un usuario autenticado
  const matchScore = (!isOwnProfile && authUser && userProfile)
    ? Math.floor(Math.random() * 60) + 40
    : null;

  // Genera las iniciales para el AvatarFallback
  const avatarInitial = userProfile.fullName
    ? userProfile.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : (userProfile.email ? userProfile.email.slice(0, 2).toUpperCase() : "UR");

  // Mapea las preferencias de estilo de vida a etiquetas (Badges)
  const lifestyleLabels = lifestyleQuestions.map(q => {
    const val = userProfile.lifestyle?.[q.id];
    if (!val) return null;

    let label;
    switch (q.id) {
      case "fiesta": label = val === "nunca" ? "Tranquilo/a en casa" : "Amante de las fiestas"; break;
      case "mascotas": label = val === "sin_mascotas" ? "Sin mascotas" : "Ama a los peludos"; break;
      case "orden": label = val === "no_mucho" ? "Desordenado/a" : "Orden total"; break;
      case "humo": label = val === "molesta" ? "No fumador/a" : "Ok con fumar"; break;
      case "visitas": label = val === "casi_nunca" ? "Pocas visitas" : "Recibo gente a menudo"; break;
      case "cocinas": label = val === "muy_poco" ? "Casi no cocino" : "Me encanta cocinar"; break;
      default: label = val;
    }
    return <Badge key={q.id}>{label}</Badge>;
  }).filter(Boolean); // Filtra los elementos nulos

  // Función para determinar el ícono de la red social basado en la URL
  const getSocialIcon = (url) => {
    if (url.includes("instagram.com")) return InstagramIcon;
    if (url.includes("linkedin.com")) return LinkedinIcon;
    if (url.includes("twitter.com") || url.includes("x.com")) return TwitterIcon;
    if (url.includes("facebook.com")) return FacebookIcon; // Añadido para Facebook
    if (url.includes("youtube.com")) return YoutubeIcon;   // Añadido para YouTube
    if (url.includes("tiktok.com")) return TiktokIcon;     // Añadido para TikTok
    return WebsiteIcon; // Icono por defecto para cualquier otro enlace
  };

  return (
    <Card className="shadow-xl">
      <CardHeader className="items-center text-center p-6 bg-gradient-to-br from-primary to-purple-600 rounded-t-lg relative">
        {/* Insignia de compatibilidad si aplica */}
        {matchScore && (
          <div className="absolute top-3 right-3">
            <MatchBadge score={matchScore} size="lg" />
          </div>
        )}

        {/* Avatar del usuario */}
        <Avatar className="h-28 w-28 mb-4 border-4 border-background shadow-lg">
          {userProfile.avatar_url ? ( // Si hay una URL de avatar
            <AvatarImage
              src={userProfile.avatar_url}
              alt={userProfile.fullName || userProfile.email}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://avatar.vercel.sh/${userProfile.email || 'guest'}.png`;
              }}
            />
          ) : (
            <AvatarImage
              src={`https://avatar.vercel.sh/${userProfile.email || 'guest'}.png`}
              alt={userProfile.fullName || userProfile.email}
            />
          )}
          <AvatarFallback className="h-full w-full flex items-center justify-center bg-secondary text-4xl text-secondary-foreground">
            {avatarInitial}
          </AvatarFallback>
        </Avatar>

        {/* Nombre del usuario */}
        <CardTitle className="text-2xl font-bold text-primary-foreground">
          {userProfile.fullName || "Usuario Desconocido"}
        </CardTitle>

        {/* Edad y Género más bonitos debajo del nombre */}
        <div className="flex items-center justify-center gap-2 text-sm text-primary-foreground/70 mt-1">
          {userProfile.age && <span>{userProfile.age} años</span>}
          {userProfile.age && userProfile.gender && <span className="mx-1">•</span>}
          {userProfile.gender && <span>{userProfile.gender.charAt(0).toUpperCase() + userProfile.gender.slice(1)}</span>}
        </div>

      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {/* Biografía del usuario */}
        <div className="flex items-start text-sm">
          <Sparkles className="h-4 w-4 mr-3 mt-0.5 text-muted-foreground shrink-0" />
          <p className="text-muted-foreground italic leading-relaxed">
            {userProfile.bio || "Aún no ha añadido una bio. ¡Sé el primero en contactar!"}
          </p>
        </div>

        {/* Presupuesto (min y max) */}
        {userProfile.budget?.min && userProfile.budget?.max && (
          <div className="text-sm text-muted-foreground">
            Presupuesto:{" "}
            <span className="text-foreground font-medium">
              {userProfile.budget.min}€ - {userProfile.budget.max}€
            </span>
          </div>
        )}

        {/* Ocupación */}
        {userProfile.occupation && (
          <div className="flex items-center text-sm text-muted-foreground">
            <BriefcaseIcon className="h-4 w-4 mr-3 text-muted-foreground shrink-0" />
            Ocupación: <span className="text-foreground font-medium ml-1">{userProfile.occupation}</span>
          </div>
        )}

        {/* Pronombres */}
        {userProfile.pronouns && (
          <div className="flex items-center text-sm text-muted-foreground">
            <UserIcon className="h-4 w-4 mr-3 text-muted-foreground shrink-0" />
            Pronombres: <span className="text-foreground font-medium ml-1">{userProfile.pronouns}</span>
          </div>
        )}

        {/* Etiquetas de estilo de vida */}
        {lifestyleLabels.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t pt-4 -mx-6 px-6">
            {lifestyleLabels}
          </div>
        )}

        {/* Enlaces a redes sociales */}
        {/* Solo muestra si socialLinks es un array y no está vacío */}
        {userProfile.socialLinks && userProfile.socialLinks.length > 0 && (
          <div className="flex justify-center gap-4 pt-2 border-t -mx-6 px-6">
            {userProfile.socialLinks.map((link, idx) => {
              const IconComponent = getSocialIcon(link); // Determina el ícono según la URL
              return (
                <a
                  key={idx} // Usar el índice como key, o un ID único si lo tuvieras
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition"
                >
                  <IconComponent className="h-5 w-5" />
                </a>
              );
            })}
          </div>
        )}

        {/* Botón de reportar usuario (solo visible para otros usuarios) */}
        {!isOwnProfile && onReportUser && (
          <Button onClick={onReportUser} variant="destructive" className="w-full mt-6">
            Reportar Usuario
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileCard;