import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from 'react-router-dom';

const ChatHeader = ({ currentChat, onlineUsers, setShowChatList }) => {
    const navigate = useNavigate();

    return (
        <header className="p-4 border-b flex justify-between items-center bg-muted/20">
            <div className="flex items-center space-x-3">
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden mr-2"
                    onClick={() => {
                        navigate('/chat');
                        setShowChatList(true);
                    }}
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <Avatar className="h-10 w-10">
                    <AvatarImage src={currentChat.avatar_url || "https://images.unsplash.com/photo-1694388001616-1176f594d72f"} alt={currentChat.name} />
                    <AvatarFallback>{currentChat.name ? currentChat.name.substring(0, 1) : '?'}</AvatarFallback>
                </Avatar>
                <div>
                    <h2 className="text-lg font-semibold">{currentChat.name}</h2>
                    {currentChat.type === 'direct' && currentChat.otherParticipantId && onlineUsers.has(currentChat.otherParticipantId) ? (
                        <p className="text-xs text-green-500">En línea</p>
                    ) : (
                        <p className="text-xs text-muted-foreground">Desconectado</p>
                    )}
                </div>
            </div>
        </header>
    );
};

export default ChatHeader;