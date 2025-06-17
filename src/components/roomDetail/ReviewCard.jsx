import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const ReviewCard = ({ review }) => {
    const userProfile = review.user_profile;
    const displayRating = review.rating || 0;
    const initial = userProfile?.full_name ? userProfile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'UN';

    return (
        <div className="border rounded-lg p-4 mb-4 bg-card shadow-sm">
            <div className="flex items-center mb-2">
                <Avatar className="h-9 w-9 mr-3">
                    {userProfile?.avatar_url
                        ? <AvatarImage src={userProfile.avatar_url} alt={userProfile.full_name} />
                        : <AvatarFallback>{initial}</AvatarFallback>
                    }
                </Avatar>
                <div>
                    <p className="font-semibold text-lg">{userProfile?.full_name || "Usuario Anónimo"}</p>
                    <p className="text-sm text-muted-foreground">
                        {review.created_at ? formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: es }) : 'Fecha desconocida'}
                    </p>
                </div>
            </div>
            <div className="flex items-center mb-2">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={`h-5 w-5 ${i < displayRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    />
                ))}
                <span className="ml-2 text-sm text-muted-foreground">({displayRating} estrellas)</span>
            </div>
            <p className="text-foreground">{review.comment || "Sin comentario."}</p>
        </div>
    );
};

export default ReviewCard;