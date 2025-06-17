import React from "react";
import { Link } from "react-router-dom";
// Importamos el icono de Store para Marketplace
import { Search, MessageSquare, Users, Store } from "lucide-react"; // Home y UserIconLucide ya no son necesarios aquí

const BottomNav = ({ currentPath }) => {
  const navItems = [
    // El orden aquí define el orden en la barra de navegación
    { path: "/habitaciones", label: "Buscar", icon: <Search className="h-6 w-6" /> },
    { path: "/comunidades", label: "Comunidades", icon: <Users className="h-6 w-6" /> },
    { path: "/chat", label: "Mensajes", icon: <MessageSquare className="h-6 w-6" /> },
    // Cambiado: "Perfil" por "Marketplace"
    { path: "/marketplace", label: "Marketplace", icon: <Store className="h-6 w-6" /> },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          // La lógica de 'active' se mantiene.
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