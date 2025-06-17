// src/components/chat/ChatListSidebar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Trash2, MessageSquareText } from "lucide-react";

import SearchUserResults from './SearchUserResults';

const ChatListSidebar = ({
    chats,
    chatId,
    searchTerm,
    setSearchTerm,
    searchResults,
    handleUserClick,
    handleDeleteChat,
    onlineUsers,
    setShowChatList,
}) => {
    const getAvatarFallback = (name) => {
        if (!name) return '?';
        const parts = name.split(' ');
        if (parts.length > 1) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name[0].toUpperCase();
    };

    return (
        <aside className="flex flex-col border-r bg-background/50 h-full">
            {/* Sección de búsqueda sticky en la parte superior */}
            <div className="p-4 border-b bg-background sticky top-0 z-10">
                <div className="relative"> {/* Este es el contenedor 'relative' */}
                    <Input
                        placeholder="Buscar chats o personas..."
                        className="pl-10 pr-2 py-2 rounded-lg"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    {/* Renderizamos SearchUserResults directamente aquí.
                        SearchUserResults es ahora responsable de su propio 'absolute' y 'z-index'.
                    */}
                    <SearchUserResults
                        searchTerm={searchTerm}
                        searchResults={searchResults}
                        onUserClick={(id) => {
                            handleUserClick(id);
                            setSearchTerm(""); // Limpiar búsqueda al hacer clic en un resultado
                            setShowChatList(false); // Ocultar la lista de chats en móvil
                        }}
                    />
                </div>
            </div>

            {/* Lista de Chats Desplazable */}
            <nav className="flex-1 overflow-y-auto">
                {chats.length > 0 ? (
                    chats.map(chat => (
                        <div key={chat.id} className="relative group">
                            <Link to={`/chat/${chat.id}`} className="block" onClick={() => setShowChatList(false)}>
                                <motion.div
                                    className={`
                                        p-4 flex items-center space-x-3 transition-colors duration-200 ease-in-out
                                        ${chatId === chat.id ? 'bg-accent/70' : 'hover:bg-accent/30'}
                                        ${chat.unread > 0 ? 'font-semibold bg-blue-500/10 dark:bg-blue-300/10' : ''}
                                    `}
                                >
                                    <Avatar className="h-12 w-12 flex-shrink-0">
                                        <AvatarImage
                                            src={chat.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.name || 'User')}&background=random&color=fff&bold=true`}
                                            alt={chat.name || "User Avatar"}
                                        />
                                        <AvatarFallback className="text-sm">
                                            {getAvatarFallback(chat.name)}
                                        </AvatarFallback>
                                        {chat.type === 'direct' && chat.otherParticipantId && onlineUsers.has(chat.otherParticipantId) && (
                                            <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background z-20"></div>
                                        )}
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold truncate text-foreground">
                                            {chat.name}
                                        </p>
                                        <p className="text-sm text-muted-foreground truncate">
                                            {chat.lastMessage}
                                        </p>
                                    </div>
                                    {chat.unread > 0 && (
                                        <div className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">
                                            {chat.unread}
                                        </div>
                                    )}
                                </motion.div>
                            </Link>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-1/2 right-4 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                                onClick={(e) => handleDeleteChat(e, chat.id)}
                                title="Eliminar chat"
                            >
                                <Trash2 className="h-5 w-5 text-destructive" />
                            </Button>
                        </div>
                    ))
                ) : (
                    <div className="p-6 text-center text-muted-foreground flex flex-col items-center justify-center h-full">
                        <MessageSquareText className="h-16 w-16 text-muted-foreground/50 mb-4" />
                        <p className="mb-4 text-lg">
                            ¡Bienvenido al chat de Rooms!
                        </p>
                        <p className="mb-6">
                            Parece que no tienes conversaciones activas.
                        </p>
                        <Link to="/comunidades">
                            <Button className="px-6 py-3">
                                Explorar Comunidades para chatear
                            </Button>
                        </Link>
                        <p className="mt-6 text-sm">
                            También puedes usar la barra de búsqueda para encontrar usuarios y comenzar una conversación.
                        </p>
                    </div>
                )}
            </nav>
        </aside>
    );
};

export default ChatListSidebar;