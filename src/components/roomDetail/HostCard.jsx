
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

const HostCard = ({ host }) => {
  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center space-x-4">
        <Avatar className="h-16 w-16">
          <img  src={host.avatarUrl} alt={host.name} className="h-full w-full object-cover" src="https://images.unsplash.com/photo-1680674497655-49cdf30878ff" />
          <AvatarFallback>{host.avatarName}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-xl">{host.name}</CardTitle>
          <CardDescription>Anfitrión desde {new Date(host.joinDate).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Button variant="outline" className="w-full">
          <MessageSquare className="mr-2 h-5 w-5" /> Contactar al Anfitrión
        </Button>
      </CardContent>
    </Card>
  );
};

export default HostCard;
