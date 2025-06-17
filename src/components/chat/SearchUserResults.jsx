// src/components/chat/SearchUserResults.jsx
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const SearchUserResults = ({ searchTerm, searchResults, onUserClick }) => {
    // Si el término de búsqueda está vacío, no renderizamos nada.
    if (searchTerm.length === 0) {
        return null;
    }

    // Renderiza el mensaje de "No se encontraron usuarios" si searchResults está vacío
    if (searchResults.length === 0) {
        return (
            <div className="absolute left-0 right-0 top-full bg-popover border border-border rounded-md shadow-lg z-20 mt-1">
                <div className="p-3 text-center text-muted-foreground text-sm">
                    No se encontraron usuarios.
                </div>
            </div>
        );
    }

    // Helper para obtener las iniciales del nombre
    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.split(' ');
        if (parts.length > 1) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name[0].toUpperCase();
    };

    return (
        <div className="absolute left-0 right-0 top-full bg-popover border border-border rounded-md shadow-lg z-20 mt-1 max-h-60 overflow-y-auto">
            {searchResults.map((user) => (
                <div
                    key={user.id}
                    className="flex items-center space-x-3 p-3 hover:bg-accent cursor-pointer"
                    onClick={() => onUserClick(user.id)}
                >
                    <Avatar className="h-9 w-9">
                        <AvatarImage
                            // Usa user.avatar_url si existe, de lo contrario, genera uno con ui-avatars.com
                            src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'User')}&background=random&color=fff&bold=true`}
                            alt={user.full_name || "User Avatar"}
                        />
                        <AvatarFallback>
                            {getInitials(user.full_name)}
                        </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user.full_name}</span>
                </div>
            ))}
        </div>
    );
};

export default SearchUserResults;