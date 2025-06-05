
import React from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import MobileNavItem from "@/components/layout/MobileNavItem.jsx";
import AuthButtons from "@/components/layout/AuthButtons.jsx";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus } from "lucide-react";

const MobileMenu = ({ isOpen, setIsOpen, navItems, currentPath, isLoggedIn, handleLogout }) => {
  const menuVariants = {
    closed: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.2, ease: "easeOut" },
      transitionEnd: { display: "none" },
    },
    open: {
      opacity: 1,
      y: 0,
      display: "block",
      transition: { duration: 0.3, ease: "easeIn" },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial="closed"
          animate="open"
          exit="closed"
          variants={menuVariants}
          className="md:hidden absolute top-16 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-lg p-4 z-30"
        >
          <nav className="flex flex-col space-y-2">
            {navItems.map((item) => {
              if ((item.path === "/login" || item.path === "/registro") && isLoggedIn) {
                return null;
              }
              if (item.path === "/login") {
                return (
                  <AuthButtons
                    key="mobile-auth"
                    isLoggedIn={false}
                    isMobile={true}
                  />
                );
              }
              if (item.path === "/registro") {
                return (
                  <Button
                    key="mobile-register"
                    asChild
                    variant="default"
                    className="w-full mt-2"
                    onClick={() => setIsOpen(false)}
                  >
                    <Link to="/registro">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Registrarse
                    </Link>
                  </Button>
                );
              }
              return (
                <MobileNavItem
                  key={item.path}
                  path={item.path}
                  label={item.label}
                  icon={item.icon}
                  currentPath={currentPath}
                  onClick={() => setIsOpen(false)}
                />
              );
            })}
            {isLoggedIn && (
              <AuthButtons
                isLoggedIn={true}
                handleLogout={() => {
                  handleLogout();
                  setIsOpen(false);
                }}
                isMobile={true}
              />
            )}
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;
