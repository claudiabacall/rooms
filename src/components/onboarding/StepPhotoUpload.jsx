import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const StepPhotoUpload = ({ formData, setFormData, onNext, onBack }) => {
  // Initialize preview with the existing profilePicture or null
  // If formData.profilePicture is a File object, create a URL
  // If it's a URL (e.g., coming from a saved profile), use it directly
  const [preview, setPreview] = useState(() => {
    if (formData.profilePicture instanceof File) {
      return URL.createObjectURL(formData.profilePicture);
    }
    // If formData.profilePicture is already a URL string from DB or initial load
    return formData.profilePicture || null;
  });
  const { toast } = useToast();

  // Clean up the object URL when the component unmounts or preview changes
  useEffect(() => {
    return () => {
      if (preview && typeof preview === 'string' && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({ title: "Archivo demasiado grande", description: "La imagen no debe superar los 2MB.", variant: "destructive" });
        return;
      }
      // Revoke previous blob URL if it exists to prevent memory leaks
      if (preview && typeof preview === 'string' && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
      setFormData(prev => ({ ...prev, profilePicture: file }));
      setPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="space-y-6 flex flex-col items-center">
      <Label htmlFor="profilePictureInput" className="cursor-pointer">
        <Avatar className="w-40 h-40 border-4 border-dashed border-primary/50 hover:border-primary transition-colors duration-300">
          <AvatarImage src={preview || undefined} alt="Previsualización de foto de perfil" />
          <AvatarFallback className="bg-muted hover:bg-accent text-muted-foreground">
            <Camera size={48} />
          </AvatarFallback>
        </Avatar>
      </Label>
      <Input
        id="profilePictureInput"
        name="profilePicture"
        type="file"
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
      />
      <p className="text-sm text-muted-foreground text-center">
        {preview ? "¡Genial! ¿Cambiamos de foto?" : "Sube una foto clara de ti. ¡Ayuda a generar confianza!"}
      </p>
      <div className="w-full pt-4 flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
        </Button>
        <Button
          type="button"
          onClick={() => onNext({ profilePicture: formData.profilePicture })}
        >
          {formData.profilePicture ? <Check className="mr-2 h-4 w-4" /> : ''}
          Siguiente <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default StepPhotoUpload;