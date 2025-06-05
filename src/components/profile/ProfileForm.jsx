// src/components/profile/ProfileForm.jsx
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Save, XCircle, PlusCircle, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const barriosDeMadrid = [
  "Arganzuela", "Barajas", "Carabanchel", "Centro", "Chamartín", "Chamberí",
  "Ciudad Lineal", "Fuencarral-El Pardo", "Hortaleza", "Latina", "Moncloa-Aravaca",
  "Moratalaz", "Puente de Vallecas", "Retiro", "Salamanca", "San Blas-Canillejas",
  "Tetuán", "Usera", "Vicálvaro", "Villa de Vallecas", "Villaverde"
];

const idiomasEnEspaña = [
  "Español", "Catalán", "Gallego", "Euskera", "Inglés",
  "Francés", "Alemán", "Árabe", "Chino", "Rumano"
];

const ProfileForm = ({ initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    ...initialData,
    interests: initialData.interests || [],
    hobbies: initialData.hobbies || [],
    languages: initialData.languages || [],
    socialLinks: initialData.socialLinks || [],
    budget: initialData.budget || { min: "", max: "" },
    zonas: initialData.zonas || [],
  });

  const [newInterest, setNewInterest] = useState("");
  const [newHobby, setNewHobby] = useState("");
  const [newSocialLink, setNewSocialLink] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (setter) => (e) => setter(e.target.value);

  const addItem = (key, valueSetter, value) => {
    if (value && !formData[key].includes(value)) {
      setFormData(prev => ({ ...prev, [key]: [...prev[key], value] }));
      valueSetter("");
    }
  };

  const removeItem = (key, itemToRemove) => {
    setFormData(prev => ({
      ...prev,
      [key]: prev[key].filter(item => item !== itemToRemove),
    }));
  };

  const handleBudgetChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      budget: {
        ...prev.budget,
        [name]: value,
      },
    }));
  };

  const toggleZona = (zona) => {
    setFormData(prev => ({
      ...prev,
      zonas: prev.zonas.includes(zona)
        ? prev.zonas.filter(z => z !== zona)
        : [...prev.zonas, zona],
    }));
  };

  const toggleIdioma = (idioma) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(idioma)
        ? prev.languages.filter(l => l !== idioma)
        : [...prev.languages, idioma],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Editar Perfil</CardTitle>
        <CardDescription>Actualiza tu información personal y de convivencia.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Básicos */}
          <div>
            <Label htmlFor="fullName">Nombre Completo</Label>
            <Input id="fullName" name="fullName" value={formData.fullName || ""} onChange={handleInputChange} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" value={formData.email || ""} onChange={handleInputChange} />
          </div>
          <div>
            <Label htmlFor="age">Edad</Label>
            <Input id="age" name="age" value={formData.age || ""} onChange={handleInputChange} />
          </div>
          <div>
            <Label htmlFor="gender">Género</Label>
            <Input id="gender" name="gender" value={formData.gender || ""} onChange={handleInputChange} />
          </div>
          <div>
            <Label htmlFor="pronouns">Pronombres</Label>
            <Input id="pronouns" name="pronouns" value={formData.pronouns || ""} onChange={handleInputChange} />
          </div>

          {/* Zonas */}
          <div>
            <Label>Zonas preferidas de Madrid</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {barriosDeMadrid.map((barrio) => (
                <label key={barrio} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.zonas.includes(barrio)}
                    onChange={() => toggleZona(barrio)}
                  />
                  {barrio}
                </label>
              ))}
            </div>
          </div>

          {/* Profesional */}
          <div>
            <Label htmlFor="occupation">Ocupación o Estudios</Label>
            <Input id="occupation" name="occupation" value={formData.occupation || ""} onChange={handleInputChange} />
          </div>

          <div>
            <Label>Presupuesto (€/mes)</Label>
            <div className="flex gap-2">
              <Input
                name="min"
                type="number"
                placeholder="Mínimo"
                value={formData.budget.min}
                onChange={handleBudgetChange}
              />
              <Input
                name="max"
                type="number"
                placeholder="Máximo"
                value={formData.budget.max}
                onChange={handleBudgetChange}
              />
            </div>
          </div>

          {/* Idiomas */}
          <div>
            <Label>Idiomas que hablas</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {idiomasEnEspaña.map((idioma) => (
                <label key={idioma} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.languages.includes(idioma)}
                    onChange={() => toggleIdioma(idioma)}
                  />
                  {idioma}
                </label>
              ))}
            </div>
          </div>

          {/* Redes sociales */}
          <div>
            <Label htmlFor="socialLinks">Añadir Red Social</Label>
            <div className="flex gap-2">
              <Input value={newSocialLink} onChange={handleArrayChange(setNewSocialLink)} placeholder="https://instagram.com/..." />
              <Button type="button" onClick={() => addItem("socialLinks", setNewSocialLink, newSocialLink)}>
                <PlusCircle className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.socialLinks.map((link, idx) => (
                <Badge key={idx} className="flex items-center gap-1 text-xs">
                  {link}
                  <button type="button" onClick={() => removeItem("socialLinks", link)}>
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div>
            <Label htmlFor="bio">Sobre mí</Label>
            <Textarea id="bio" name="bio" rows={4} value={formData.bio || ""} onChange={handleInputChange} />
          </div>

          {/* Intereses */}
          <div>
            <Label>Intereses</Label>
            <div className="flex gap-2">
              <Input value={newInterest} onChange={handleArrayChange(setNewInterest)} placeholder="Ej: Cine" />
              <Button type="button" onClick={() => addItem("interests", setNewInterest, newInterest)}>
                <PlusCircle className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.interests.map((item, idx) => (
                <Badge key={idx} className="flex items-center gap-1 text-xs">
                  {item}
                  <button type="button" onClick={() => removeItem("interests", item)}>
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Hobbies */}
          <div>
            <Label>Hobbies</Label>
            <div className="flex gap-2">
              <Input value={newHobby} onChange={handleArrayChange(setNewHobby)} placeholder="Ej: Leer, Escalar" />
              <Button type="button" onClick={() => addItem("hobbies", setNewHobby, newHobby)}>
                <PlusCircle className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.hobbies.map((item, idx) => (
                <Badge key={idx} className="flex items-center gap-1 text-xs">
                  {item}
                  <button type="button" onClick={() => removeItem("hobbies", item)}>
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex justify-end space-x-3 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                <XCircle className="mr-2 h-4 w-4" /> Cancelar
              </Button>
            )}
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" /> Guardar Cambios
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProfileForm;
