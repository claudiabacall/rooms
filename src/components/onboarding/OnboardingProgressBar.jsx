import React from "react";
import { motion } from "framer-motion";

const OnboardingProgressBar = ({ currentStep, totalSteps }) => {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full bg-muted rounded-full h-2.5 mt-4">
      <motion.div
        className="bg-primary h-2.5 rounded-full"
        initial={{ width: "0%" }}
        animate={{ width: `${progressPercentage}%` }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />
    </div>
  );
};

export default OnboardingProgressBar;