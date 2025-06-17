import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

const ChatWelcomeScreen = () => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <MessageSquare className="h-24 w-24 text-muted-foreground mb-6" />
            <h2 className="text-2xl font-semibold text-foreground">Bienvenido a Rooms Chat</h2>
            <p className="text-muted-foreground mt-2 max-w-sm">Selecciona una conversación para empezar a chatear o explora comunidades para conectar con gente nueva.</p>
            <Link to="/comunidades" className="mt-6">
                <Button>Explorar Comunidades</Button>
            </Link>
        </div>
    );
};

export default ChatWelcomeScreen;