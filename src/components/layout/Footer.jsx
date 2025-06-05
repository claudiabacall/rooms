
import React from "react";
import { Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t bg-muted/40 py-8 text-center">
      <div className="container text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Rooms. Todos los derechos reservados.</p>

      </div>
    </footer>
  );
};

export default Footer;
