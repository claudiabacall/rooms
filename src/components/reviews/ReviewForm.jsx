
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Star, Send, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const ReviewForm = ({ onSubmit, className, propertyName, userName }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState('');
  const [tags, setTags] = useState([]);
  const [currentTag, setCurrentTag] = useState('');
  const { toast } = useToast();

  const handleTagChange = (e) => setCurrentTag(e.target.value);

  const addTag = () => {
    if (currentTag && !tags.includes(currentTag) && tags.length < 5) {
      setTags([...tags, currentTag]);
      setCurrentTag('');
    } else if (tags.length >= 5) {
        toast({title: "Límite de etiquetas", description: "Puedes añadir hasta 5 etiquetas.", variant: "default"});
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast({ title: "Puntuación requerida", description: "Por favor, selecciona una puntuación.", variant: "destructive" });
      return;
    }
    if (!text.trim()) {
      toast({ title: "Comentario requerido", description: "Por favor, escribe tu reseña.", variant: "destructive" });
      return;
    }
    onSubmit({ rating, text, tags });
    setRating(0);
    setText('');
    setTags([]);
  };

  const titleText = propertyName ? `Reseña para ${propertyName}` : (userName ? `Reseña para ${userName}` : 'Escribe tu reseña');

  return (
    <Card className={cn("shadow-lg", className)}>
      <CardHeader>
        <CardTitle>{titleText}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label className="mb-2 block font-medium">Tu Puntuación:</Label>
            <div className="flex items-center space-x-1">
              {[...Array(5)].map((_, index) => {
                const starValue = index + 1;
                return (
                  <Star
                    key={starValue}
                    className={`h-8 w-8 cursor-pointer transition-colors 
                      ${(hoverRating || rating) >= starValue ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                    onClick={() => setRating(starValue)}
                    onMouseEnter={() => setHoverRating(starValue)}
                    onMouseLeave={() => setHoverRating(0)}
                  />
                );
              })}
            </div>
          </div>

          <div>
            <Label htmlFor="reviewText" className="font-medium">Tu Comentario:</Label>
            <Textarea
              id="reviewText"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Comparte tu experiencia detallada..."
              rows={5}
              className="mt-1"
              maxLength={1000}
            />
             <p className="text-xs text-muted-foreground mt-1 text-right">{text.length}/1000</p>
          </div>
          
          <div>
            <Label htmlFor="reviewTags" className="font-medium">Etiquetas (opcional, máx. 5):</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input 
                id="reviewTags" 
                value={currentTag} 
                onChange={handleTagChange} 
                placeholder="Ej: Limpio, Ruidoso, Céntrico" 
                className="flex-grow"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag();}}}
              />
              <Button type="button" variant="outline" size="icon" onClick={addTag} aria-label="Añadir etiqueta">
                <Tag className="h-5 w-5" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-sm">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="ml-1.5 text-muted-foreground hover:text-destructive text-xs">✕</button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" className="w-full">
            <Send className="mr-2 h-4 w-4" /> Enviar Reseña
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ReviewForm;
