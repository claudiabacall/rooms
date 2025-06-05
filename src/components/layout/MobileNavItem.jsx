
import React from "react";
import { Link } from "react-router-dom";

const MobileNavItem = ({ path, label, icon, currentPath, onClick }) => {
  return (
    <Link
      to={path}
      className={`flex items-center space-x-2 py-2 px-3 text-base font-medium transition-colors hover:text-primary hover:bg-primary/10 rounded-md ${
        currentPath === path
          ? "text-primary bg-primary/10"
          : "text-muted-foreground"
      }`}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
};

export default MobileNavItem;
