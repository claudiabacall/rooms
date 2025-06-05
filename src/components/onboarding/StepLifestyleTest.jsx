// src/components/onboarding/StepLifestyleTest.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PartyPopper, DogIcon, Bed, CigaretteIcon, User, Coffee } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { lifestyleQuestions } from '@/lib/lifestyleQuestions';


// Mapa de IDs de pregunta → componente de icono
const iconMap = {
  fiesta: PartyPopper,    // celebración
  mascotas: DogIcon,       // mascota
  orden: Bed,          // orden en la casa
  humo: CigaretteIcon,     // fumar
  visitas: User,       // recibir gente
  cocinas: Coffee,     // cocinar / café
};

const SwipeCard = ({ question, onSwipe }) => (
  <motion.div
    className="w-full max-w-xs mx-auto bg-white p-8 rounded-2xl shadow-lg cursor-grab
               hover:shadow-2xl hover:scale-105 transform transition"
    drag="x"
    dragConstraints={{ left: -150, right: 150 }}
    onDragEnd={(_e, info) => {
      if (Math.abs(info.offset.x) < 50) return;
      const dir = info.offset.x > 0 ? 'right' : 'left';
      const opts = question.options;
      const sel = dir === 'left' ? opts[0] : opts[opts.length - 1];
      onSwipe(question.id, sel.value, dir);
    }}
    whileDrag={{ scale: 1.1 }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
  >
    <p className="text-center text-xl font-bold mb-8">{question.text}</p>
    <div className="flex justify-around items-center">
      {question.options.slice(0, 2).map((opt, idx) => {
        // Selecciona el icono según el ID de la pregunta
        const Icon = iconMap[question.id] || (() => null);
        return (
          <div
            key={opt.value}
            className={`flex flex-col items-center space-y-2 cursor-pointer
                       ${idx === 0 ? 'text-red-500' : 'text-green-500'}`}
          >
            <div className="p-4 bg-gray-100 rounded-full">
              <Icon size={32} />
            </div>
            <span className="text-sm font-medium">{opt.label}</span>
          </div>
        );
      })}
    </div>
    <p className="text-xs text-center text-muted-foreground mt-6">
      Desliza para elegir
    </p>
  </motion.div>
);

const StepLifestyleTest = ({ formData, onNext, onBack, questions = lifestyleQuestions }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(formData.lifestyle || {});
  const { toast } = useToast();

  const handleSwipe = (questionId, value, direction) => {
    const updated = { ...answers, [questionId]: value };
    setAnswers(updated);
    toast({
      title: `¡Entendido! ${direction === 'left' ? '👎' : '👍'}`,
      description: `Has elegido "${questions[currentIndex].options.find(o => o.value === value)?.label
        }" para "${questions[currentIndex].text}"`,
      duration: 2000,
    });
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      onNext({ lifestyle: updated });
    }
  };

  if (!questions.length) {
    return <p>No hay preguntas de estilo de vida configuradas.</p>;
  }

  const question = questions[currentIndex];

  return (
    <div className="flex flex-col items-center space-y-8 min-h-[280px] justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full"
        >
          <SwipeCard question={question} onSwipe={handleSwipe} />
        </motion.div>
      </AnimatePresence>
      <div className="w-full max-w-xs pt-4 flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={currentIndex === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
        </Button>
      </div>
    </div>
  );
};

export default StepLifestyleTest;