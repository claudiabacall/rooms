import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/components/Logo.jsx";
import NavItem from "@/components/layout/NavItem.jsx";
import MobileMenu from "@/components/layout/MobileMenu.jsx";
import AuthButtons from "@/components/layout/AuthButtons.jsx";
import ThemeToggle from "@/components/layout/ThemeToggle.jsx";
import {
  Menu,
  X,
  Search,
  Heart,
  User as UserIconLucide,
  Users as UsersIcon,
  MessageSquare,
  LogOut,
  LogIn,
  UserPlus,
  Settings,
  Home
} from "lucide-react";
import { useAuth } from "@/contexts/SupabaseAuthContext.jsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.jsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.jsx";

const Header = ({
  isDarkMode,
  toggleTheme,
  currentPath
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();

  const baseNavItems = [
    { path: "/habitaciones", label: "Buscar", icon: <Search className="h-5 w-5" /> },
  ];

  const loggedInNavItems = [
    ...baseNavItems,
    { path: "/comunidades", label: "Comunidades", icon: <UsersIcon className="h-5 w-5" /> },
    { path: "/favoritos", label: "Favoritos", icon: <Heart className="h-5 w-5" /> },
    { path: "/chat", label: "Mensajes", icon: <MessageSquare className="h-5 w-5" /> },
    { path: "/mis-propiedades", label: "Mis propiedades", icon: <Home className="h-5 w-5" /> },
  ];

  const navItemsForDesktop = isAuthenticated ? loggedInNavItems : baseNavItems;

  const navItemsForMobile = isAuthenticated
    ? [...loggedInNavItems, { path: "/perfil", label: "Perfil", icon: <UserIconLucide className="h-5 w-5" /> }]
    : [
      ...baseNavItems,
      { path: "/login", label: "Login", icon: <LogIn className="h-5 w-5" /> },
      { path: "/registro", label: "Registro", icon: <UserPlus className="h-5 w-5" /> }
    ];

  // Derive avatar initial from user's full name or email
  const avatarInitial = user?.user_metadata?.full_name // Assuming full_name is stored in user_metadata
    ? user.user_metadata.full_name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
    : (user?.email ? user.email.substring(0, 2).toUpperCase() : "U");

  // Determine avatar source, prioritizing actual URL from user_metadata.avatar_url
  const avatarSrc = user?.user_metadata?.avatar_url
    ? user.user_metadata.avatar_url
    : `https://avatar.vercel.sh/${user?.email || 'default'}.png`; // Fallback to Vercel avatar or generic if no email

  const handleLogoutAndCloseMenu = () => {
    logout();
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 supports-[backdrop-filter]:bg-background/900">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <Logo />
          <motion.span
            className="text-h1 font-h1 text-primary hidden sm:inline-block"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            Rooms
          </motion.span>
        </Link>

        <nav className="hidden md:flex md:items-center md:space-x-1">
          {navItemsForDesktop.map((item) => (
            <NavItem
              key={item.path}
              path={item.path}
              label={item.label}
              icon={item.icon}
              currentPath={currentPath}
            />
          ))}
        </nav>

        <div className="flex items-center space-x-2">
          <ThemeToggle isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                  <Avatar size={40} online={false} className="h-full w-full">
                    {/* Use avatarSrc for the image source */}
                    <AvatarImage src={avatarSrc} alt={user.user_metadata?.full_name || user.email} />
                    <AvatarFallback className="text-sm">
                      {avatarInitial}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.user_metadata?.full_name || "Usuario Rooms"}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/perfil"><UserIconLucide className="mr-2 h-4 w-4" />Mi Perfil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/perfil#settings"><Settings className="mr-2 h-4 w-4" />Ajustes</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogoutAndCloseMenu}> {/* Use the function to close menu */}
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex">
              <AuthButtons
                isLoggedIn={isAuthenticated} // This prop might become redundant if AuthButtons uses useAuth directly
                handleLogout={logout} // This prop might become redundant if AuthButtons uses useAuth directly
                isMobile={false}
              />
            </div>
          )}

          <div className="flex items-center md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="ml-2"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <MobileMenu
            isOpen={mobileMenuOpen}
            setIsOpen={setMobileMenuOpen}
            navItems={navItemsForMobile}
            currentPath={currentPath}
            isLoggedIn={isAuthenticated}
            handleLogout={handleLogoutAndCloseMenu}
          />
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;