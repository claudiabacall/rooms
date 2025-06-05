
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const RoomImageGallery = ({ title, gallery, fallbackImage }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imagesToDisplay = gallery && gallery.length > 0 ? gallery : fallbackImage ? [fallbackImage] : [];

  if (imagesToDisplay.length === 0) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
        No hay imágenes disponibles
      </div>
    );
  }
  
  const imageName = imagesToDisplay[currentImageIndex];

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % imagesToDisplay.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + imagesToDisplay.length) % imagesToDisplay.length);
  };

  return (
    <div className="relative">
      <div className="relative aspect-video rounded-lg overflow-hidden shadow-xl bg-muted">
        <img 
          className="w-full h-full object-cover transition-opacity duration-300"
          alt={`${title} - Imagen ${currentImageIndex + 1}`}
         src="https://images.unsplash.com/photo-1565761427976-00b99e567d7f" />
        {imagesToDisplay.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/70 hover:bg-white dark:bg-black/50 dark:hover:bg-black/70"
              onClick={prevImage}
              aria-label="Imagen anterior"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/70 hover:bg-white dark:bg-black/50 dark:hover:bg-black/70"
              onClick={nextImage}
              aria-label="Siguiente imagen"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {imagesToDisplay.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`h-2.5 w-2.5 rounded-full transition-colors ${index === currentImageIndex ? 'bg-primary' : 'bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500'}`}
                  aria-label={`Ir a imagen ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RoomImageGallery;
