
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users2 as PeopleIcon, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PotentialRoommates = ({ roommates }) => {
  if (!roommates || roommates.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-lg mt-8">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <PeopleIcon className="mr-3 h-7 w-7 text-primary" />
          Posibles Compañeros de Piso
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {roommates.map((mate) => (
          <div key={mate.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <img  src={mate.avatarUrl} alt={mate.name} className="h-full w-full object-cover" src="https://images.unsplash.com/photo-1495224814653-94f36c0a31ea" />
                <AvatarFallback>{mate.name.substring(0,1)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{mate.name}, {mate.age}</p>
                <p className="text-sm text-muted-foreground">{mate.occupation}</p>
              </div>
            </div>
            <Link to={`/perfil/${mate.id}`}> {/* Asumiendo una ruta de perfil de usuario */}
              <Button variant="ghost" size="sm">Ver Perfil</Button>
            </Link>
          </div>
        ))}
        <div className="text-center mt-4">
          <Button variant="outline">
            <Sparkles className="mr-2 h-4 w-4" /> Ver compatibilidad y más perfiles
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PotentialRoommates;
