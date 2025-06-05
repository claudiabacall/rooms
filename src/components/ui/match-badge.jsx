
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Sparkles, Heart } from "lucide-react";

const MatchBadge = ({ score, size = "default", className }) => {
  let bgColor, textColor, Icon;

  if (score >= 85) {
    bgColor = "bg-green-500"; // Verde para alta compatibilidad
    textColor = "text-white";
    Icon = <Heart className={cn("h-3 w-3", size === "sm" ? "h-2.5 w-2.5" : "")} />;
  } else if (score >= 65) {
    bgColor = "bg-yellow-400"; // Amarillo para media-alta
    textColor = "text-black";
    Icon = <Sparkles className={cn("h-3 w-3", size === "sm" ? "h-2.5 w-2.5" : "")} />;
  } else if (score >= 40) {
    bgColor = "bg-orange-400"; // Naranja para media-baja
    textColor = "text-white";
    Icon = <Sparkles className={cn("h-3 w-3", size === "sm" ? "h-2.5 w-2.5" : "")} />;
  } else {
    bgColor = "bg-red-500"; // Rojo para baja (o gris si se prefiere menos negativo)
    textColor = "text-white";
    Icon = <Sparkles className={cn("h-3 w-3", size === "sm" ? "h-2.5 w-2.5" : "")} />;
  }

  const sizeClasses = {
    default: "px-2.5 py-1 text-xs",
    sm: "px-2 py-0.5 text-[10px]",
    lg: "px-3 py-1.5 text-sm",
  };

  return (
    <Badge className={cn(
      "inline-flex items-center font-semibold border-transparent",
      bgColor,
      textColor,
      sizeClasses[size] || sizeClasses.default,
      className
    )}>
      {Icon && <span className="mr-1">{Icon}</span>}
      {score}% Afinidad
    </Badge>
  );
};

export default MatchBadge;
