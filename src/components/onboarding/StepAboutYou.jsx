import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const StepAboutYou = ({ formData, onNext, onBack }) => {
  const { toast } = useToast();
  const [bio, setBio] = useState(formData.bio || "");

  const validateAndProceed = () => {
    if (bio.length > 280) {
      toast({
        title: "Bio demasiado larga",
        description: "Tu bio no debe exceder los 280 caracteres.",
        variant: "destructive"
      });
      return;
    }

    onNext({ bio }); // Pasamos solo la parte nueva del formulario
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="bio">Tu Bio (máx. 280 caracteres)</Label>
        <Textarea
          id="bio"
          name="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Cuéntanos algo sobre ti: tus hobbies, qué buscas en un compañero/a, tu estilo de vida..."
          rows={5}
          maxLength={280}
          className="mt-1"
        />
        <p className="text-xs text-muted-foreground mt-1 text-right">{bio.length}/280</p>
      </div>
      <div className="w-full pt-4 flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
        </Button>
        <Button type="button" onClick={validateAndProceed}>
          Siguiente <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default StepAboutYou;