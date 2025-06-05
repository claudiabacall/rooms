import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "@/components/layout/Header.jsx";
import Footer from "@/components/layout/Footer.jsx";
import BottomNav from "@/components/layout/BottomNav.jsx";
import { useAuth } from "@/contexts/SupabaseAuthContext.jsx";

const MainLayout = () => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
    }
  }, []);

  const toggleTheme = () => {
    const newIsDarkMode = !isDarkMode;
    if (newIsDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
    setIsDarkMode(newIsDarkMode);
  };

  const showBottomNavForPaths = [
    '/',
    '/habitaciones',
    '/chat',
    '/perfil',
    '/favoritos',
    '/comunidades',
  ];

  const pathMatchesShowBottomNav = showBottomNavForPaths.some((basePath) => {
    if (basePath === '/') return location.pathname === '/';
    return location.pathname.startsWith(basePath);
  });

  const showBottomNav = isAuthenticated && pathMatchesShowBottomNav;

  if (authLoading) {
    return <div className="flex justify-center items-center h-screen text-xl">Cargando aplicación...</div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-text-primary font-sans">
      <Header
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        currentPath={location.pathname}
      />

      <main className={`flex-1 ${showBottomNav ? "pb-16 md:pb-0" : ""}`}>
        <Outlet />
      </main>

      <Footer />
      {showBottomNav && <BottomNav currentPath={location.pathname} />}
    </div>
  );
};

export default MainLayout;
