
import React from "react";
import { Link } from "react-router-dom";
import { Home, Search, MessageSquare, User as UserIconLucide } from "lucide-react"; // Asegúrate que Heart no se importe aquí si no se usa.

const BottomNav = ({ currentPath }) => {
  const navItems = [
    { path: "/", label: "Inicio", icon: <Home className="h-6 w-6" /> },
    { path: "/habitaciones", label: "Buscar", icon: <Search className="h-6 w-6" /> },
    { path: "/chat", label: "Mensajes", icon: <MessageSquare className="h-6 w-6" /> },
    { path: "/perfil", label: "Perfil", icon: <UserIconLucide className="h-6 w-6" /> },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`bottom-nav-item ${currentPath === item.path || (item.path !== "/" && currentPath.startsWith(item.path)) ? "active" : ""}`}
        >
          {item.icon}
          <span className="mt-0.5">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
};

export default BottomNav;
