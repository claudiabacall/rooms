// src/components/community/CommunityMembersList.jsx
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Assuming you have these components
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const CommunityMembersList = ({ members, onClose }) => {
    return (
        <Card className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="relative w-full max-w-md max-h-[90vh] overflow-y-auto">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl">Miembros de la Comunidad</CardTitle>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </CardHeader>
                <CardContent>
                    {members.length > 0 ? (
                        <div className="space-y-4">
                            {members.map((member) => (
                                <div key={member.user_id} className="flex items-center space-x-3">
                                    <Avatar>
                                        <AvatarImage src={member.profiles?.avatar_url} alt={member.profiles?.full_name} />
                                        <AvatarFallback>{member.profiles?.full_name ? member.profiles.full_name[0] : '?'}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{member.profiles?.full_name || "Usuario Desconocido"}</p>
                                        <p className="text-sm text-muted-foreground capitalize">{member.role}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm">No hay miembros para mostrar.</p>
                    )}
                </CardContent>
            </Card>
        </Card>
    );
};

export default CommunityMembersList;