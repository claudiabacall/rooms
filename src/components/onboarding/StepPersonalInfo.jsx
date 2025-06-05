import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const StepPersonalInfo = ({ formData, setFormData, onNext, onBack }) => {
  const { toast } = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenderChange = (value) => {
    setFormData(prev => ({ ...prev, gender: value }));
  };

  const validateAndProceed = () => {
    const { fullName = "", age = "", gender = "", phone_number = "" } = formData;

    if (!fullName.trim() || !age || !gender || !phone_number.trim()) {
      toast({
        title: "Campos incompletos",
        description: "Por favor, rellena todos los campos.",
        variant: "destructive",
      });
      return;
    }

    const parsedAge = parseInt(age);
    if (isNaN(parsedAge) || parsedAge < 18 || parsedAge > 99) {
      toast({
        title: "Edad inválida",
        description: "Debes tener entre 18 y 99 años.",
        variant: "destructive",
      });
      return;
    }

    const phoneDigits = phone_number.replace(/[\s\-\+\(\)]/g, '');
    if (!/^\d{9,15}$/.test(phoneDigits)) {
      toast({
        title: "Teléfono inválido",
        description: "Introduce un número de teléfono válido (9-15 dígitos).",
        variant: "destructive",
      });
      return;
    }

    onNext({ fullName, age: parsedAge, gender, phone_number: phoneDigits });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="fullName">Nombre completo</Label>
        <Input
          id="fullName"
          name="fullName"
          value={formData.fullName || ''}
          onChange={handleChange}
          placeholder="Ej: Ana García"
        />
      </div>
      <div>
        <Label htmlFor="age">Edad</Label>
        <Input
          id="age"
          name="age"
          type="number"
          value={formData.age || ''}
          onChange={handleChange}
          placeholder="Ej: 23"
        />
      </div>
      <div>
        <Label>Género</Label>
        <RadioGroup
          name="gender"
          onValueChange={handleGenderChange}
          value={formData.gender || ""}
          className="grid grid-cols-3 gap-3 pt-2"
        >
          {['chica', 'chico', 'otro'].map(opt => (
            <Label
              key={opt}
              htmlFor={`gender-${opt}`}
              className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary cursor-pointer"
            >
              <RadioGroupItem value={opt} id={`gender-${opt}`} className="sr-only" />
              <span className="text-sm font-medium capitalize">{opt}</span>
            </Label>
          ))}
        </RadioGroup>
      </div>
      <div>
        <Label htmlFor="phone_number">Teléfono</Label>
        <Input
          id="phone_number"
          name="phone_number"
          type="tel"
          value={formData.phone_number || ''}
          onChange={handleChange}
          placeholder="Ej: 612345678"
        />
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

export default StepPersonalInfo;