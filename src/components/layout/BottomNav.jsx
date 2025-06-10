import React from "react";
import { Link } from "react-router-dom";
import { Search, MessageSquare, User as UserIconLucide, Users } from "lucide-react"; // Home ya no es necesario, lo eliminamos

const BottomNav = ({ currentPath }) => {
  const navItems = [
    // El orden aquí define el orden en la barra de navegación
    { path: "/habitaciones", label: "Buscar", icon: <Search className="h-6 w-6" /> },
    { path: "/comunidades", label: "Comunidades", icon: <Users className="h-6 w-6" /> },
    { path: "/chat", label: "Mensajes", icon: <MessageSquare className="h-6 w-6" /> },
    { path: "/perfil", label: "Perfil", icon: <UserIconLucide className="h-6 w-6" /> },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          // La lógica de 'active' se mantiene, pero ten en cuenta que '/' ya no será una ruta activa aquí.
          // Si tu página principal ahora es una de estas, asegúrate de que currentPath refleje eso.
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