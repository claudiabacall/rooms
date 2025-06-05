import React from "react";
import { motion } from "framer-motion";

const Logo = () => {
  return (
    <motion.img
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
      src="/roomslogo.png"
      alt="Logo"
      className="h-10 w-10 object-contain"
    />
  );
};

export default Logo;
