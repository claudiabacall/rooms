import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import MatchBadge from "@/components/ui/match-badge.jsx";
import { useAuth } from "@/contexts/SupabaseAuthContext.jsx";
import { lifestyleQuestions } from "@/lib/lifestyleQuestions";
import ReactStars from 'react-rating-stars-component'; // <-- Importa esto
import { Star } from 'lucide-react'; // <-- Importa el icono Star si lo necesitas, aunque ReactStars ya lo hace

import {
  Instagram as InstagramIcon,
  Linkedin as LinkedinIcon,
  Twitter as TwitterIcon,
  Globe2 as WebsiteIcon,
  Briefcase as BriefcaseIcon,
  User as UserIcon,
  Facebook as FacebookIcon,
  Youtube as YoutubeIcon,
  // Asegúrate de importar TiktokIcon si lo estás usando
} from "lucide-react";

// Agrega ratingSummary a las props
const ProfileCard = ({ userProfile, onReportUser, isOwnProfile, ratingSummary }) => { // <-- AÑADE ratingSummary AQUÍ
  const { user: authUser } = useAuth();

  if (!userProfile) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No se pudo cargar la información del perfil.
      </div>
    );
  }

  const matchScore = (!isOwnProfile && authUser && userProfile)
    ? Math.floor(Math.random() * 60) + 40
    : null;

  const avatarInitial = userProfile.fullName
    ? userProfile.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : (userProfile.email ? userProfile.email.slice(0, 2).toUpperCase() : "UR");

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
  }).filter(Boolean);

  const getSocialIcon = (url) => {
    if (url.includes("instagram.com")) return InstagramIcon;
    if (url.includes("linkedin.com")) return LinkedinIcon;
    if (url.includes("twitter.com") || url.includes("x.com")) return TwitterIcon;
    if (url.includes("facebook.com")) return FacebookIcon;
    if (url.includes("youtube.com")) return YoutubeIcon; // Corregido el patrón para YouTube
    if (url.includes("tiktok.com")) return TiktokIcon;     // Asegúrate de que TiktokIcon esté importado en este archivo si lo usas
    return WebsiteIcon;
  };

  return (
    <Card className="shadow-xl">
      <CardHeader className="items-center text-center p-6 bg-gradient-to-br from-primary to-purple-600 rounded-t-lg relative">
        {matchScore && (
          <div className="absolute top-3 right-3">
            <MatchBadge score={matchScore} size="lg" />
          </div>
        )}

        <Avatar className="h-28 w-28 mb-4 border-4 border-background shadow-lg">
          {userProfile.avatar_url ? (
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

        <CardTitle className="text-2xl font-bold text-primary-foreground">
          {userProfile.fullName || "Usuario Desconocido"}
        </CardTitle>

        <div className="flex items-center justify-center gap-2 text-sm text-primary-foreground/70 mt-1">
          {userProfile.age && <span>{userProfile.age} años</span>}
          {userProfile.age && userProfile.gender && <span className="mx-1">•</span>}
          {userProfile.gender && <span>{userProfile.gender.charAt(0).toUpperCase() + userProfile.gender.slice(1)}</span>}
        </div>

        {/* Sección de Reseñas - DENTRO DE CardHeader, debajo de edad/género */}
        {ratingSummary && (ratingSummary.average_rating > 0 || ratingSummary.total_reviews > 0) ? (
          <div className="flex items-center mt-3 text-primary-foreground">
            <ReactStars
              count={5}
              value={ratingSummary.average_rating}
              size={24}
              activeColor="#ffd700"
              edit={false} // No editable, solo para mostrar
              isHalf={true} // Permite medias estrellas
              classNames="mr-2" // Añade un poco de margen a la derecha de las estrellas
            />
            <span className="text-lg font-semibold">
              {ratingSummary.average_rating.toFixed(1)}
            </span>
            <span className="ml-1 text-sm opacity-80">({ratingSummary.total_reviews} reseñas)</span>
          </div>
        ) : (
          // Mensaje si no hay reseñas aún
          <p className="text-primary-foreground/70 text-sm mt-3">Aún no hay reseñas.</p>
        )}

      </CardHeader>

      <CardContent className="p-6 space-y-4">
        <div className="flex items-start text-sm">
          <Sparkles className="h-4 w-4 mr-3 mt-0.5 text-muted-foreground shrink-0" />
          <p className="text-muted-foreground italic leading-relaxed">
            {userProfile.bio || "Aún no ha añadido una bio. ¡Sé el primero en contactar!"}
          </p>
        </div>

        {userProfile.budget?.min && userProfile.budget?.max && (
          <div className="text-sm text-muted-foreground">
            Presupuesto:{" "}
            <span className="text-foreground font-medium">
              {userProfile.budget.min}€ - {userProfile.budget.max}€
            </span>
          </div>
        )}

        {userProfile.occupation && (
          <div className="flex items-center text-sm text-muted-foreground">
            <BriefcaseIcon className="h-4 w-4 mr-3 text-muted-foreground shrink-0" />
            Ocupación: <span className="text-foreground font-medium ml-1">{userProfile.occupation}</span>
          </div>
        )}

        {userProfile.pronouns && (
          <div className="flex items-center text-sm text-muted-foreground">
            <UserIcon className="h-4 w-4 mr-3 text-muted-foreground shrink-0" />
            Pronombres: <span className="text-foreground font-medium ml-1">{userProfile.pronouns}</span>
          </div>
        )}

        {lifestyleLabels.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t pt-4 -mx-6 px-6">
            {lifestyleLabels}
          </div>
        )}

        {userProfile.socialLinks && userProfile.socialLinks.length > 0 && (
          <div className="flex justify-center gap-4 pt-2 border-t -mx-6 px-6">
            {userProfile.socialLinks.map((link, idx) => {
              const IconComponent = getSocialIcon(link);
              return (
                <a
                  key={idx}
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