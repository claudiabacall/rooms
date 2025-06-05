
import React from "react";
import { Link } from "react-router-dom";

const NavItem = ({ path, label, icon, currentPath }) => {
  return (
    <Link
      to={path}
      className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium transition-colors hover:text-primary rounded-md ${
        currentPath === path
          ? "text-primary bg-primary/10"
          : "text-muted-foreground"
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
};

export default NavItem;
