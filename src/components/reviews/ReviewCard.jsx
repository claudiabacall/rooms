
import React from 'react';
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

const ReviewCard = ({ review }) => {
  if (!review) return null;

  const { author, authorAvatar, rating, text, date, tags } = review;

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center space-x-3 pb-2">
        <Avatar className="h-10 w-10">
          <img  src={authorAvatar || `https://avatar.vercel.sh/${author}.png`} alt={author} className="h-full w-full object-cover" src="https://images.unsplash.com/photo-1587950058042-f8f0393f7cfb"/>
          <AvatarFallback>{author ? author.substring(0, 1).toUpperCase() : 'U'}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-md">{author || "Anónimo"}</p>
          <p className="text-xs text-muted-foreground">{new Date(date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex items-center mb-2">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-5 w-5 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
            />
          ))}
           <span className="ml-2 text-sm font-medium text-muted-foreground">({rating}/5)</span>
        </div>
        <p className="text-body text-foreground leading-relaxed">{text}</p>
        {tags && tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map(tag => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
        )}
      </CardContent>
      {/* Placeholder for helpfulness buttons or actions */}
      {/* <CardFooter className="pt-2 justify-end space-x-2">
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
          <ThumbsUp className="h-4 w-4 mr-1" /> Útil
        </Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
          <ThumbsDown className="h-4 w-4 mr-1" /> No útil
        </Button>
      </CardFooter> */}
    </Card>
  );
};

export default ReviewCard;
