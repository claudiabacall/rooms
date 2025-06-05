import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { motion } from "framer-motion";
import { SupabaseAuthProvider, useAuth } from "@/contexts/SupabaseAuthContext.jsx";

// Layouts
import MainLayout from "@/layouts/MainLayout.jsx";

// Pages
import HomePage from "@/pages/HomePage.jsx";
import RoomsPage from "@/pages/RoomsPage.jsx";
import RoomDetailPage from "@/pages/RoomDetailPage.jsx";
import FavoritesPage from "@/pages/FavoritesPage.jsx";
import ProfilePage from "@/pages/ProfilePage.jsx";
import CommunitiesPage from "@/pages/CommunitiesPage.jsx";
import CreateCommunityPage from "@/pages/CreateCommunityPage.jsx";
import CommunityDetailPage from "@/pages/CommunityDetailPage.jsx";
import CommunitySettingsPage from "@/pages/CommunitySettingsPage.jsx"; // <-- Importación de la nueva página de ajustes
import ChatPage from "@/pages/ChatPage.jsx";
import RegisterPage from "@/pages/RegisterPage.jsx";
import OnboardingPage from "@/pages/OnboardingPage.jsx";
import VerifyEmailPage from "@/pages/VerifyEmailPage.jsx";
import LoginPage from "@/pages/LoginPage.jsx";
import TermsPage from "@/pages/TermsPage.jsx";
import MarketplacePage from "@/pages/MarketplacePage.jsx";
import AdminDashboardPage from "@/pages/AdminDashboardPage.jsx";
import AddRoomPage from "@/pages/AddRoomPage.jsx";

/**
 * PrivateRoute: Protege rutas que requieren autenticación, email confirmado Y onboarding completo.
 */
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return <div className="flex justify-center items-center min-h-screen">Cargando autenticación...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Si el usuario está autenticado, pero el email NO está confirmado
  if (!user?.email_confirmed_at) {
    if (location.pathname !== "/verify-email") {
      return <Navigate to="/verify-email" replace state={{ from: location }} />;
    }
    return children;
  }

  // Si el usuario está autenticado y el email está confirmado,
  // pero el onboarding NO está completo
  if (!user?.onboarding_completed) {
    if (location.pathname !== "/onboarding") {
      return <Navigate to="/onboarding" replace state={{ from: location }} />;
    }
    return children;
  }

  // Si todo está OK (autenticado, email confirmado, onboarding completo), permite el acceso
  return children;
};

/**
 * OnboardingSpecificRoute: Protege la ruta de onboarding.
 * Permite el acceso si el usuario está autenticado, email confirmado Y el onboarding NO está completo.
 * Redirige si el onboarding YA está completo (para que no puedan volver a la página de onboarding).
 */
const OnboardingSpecificRoute = ({ children }) => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return <div className="flex justify-center items-center min-h-screen">Cargando autenticación...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!user?.email_confirmed_at) {
    if (location.pathname !== "/verify-email") {
      return <Navigate to="/verify-email" replace state={{ from: location }} />;
    }
    return children;
  }

  // Si el onboarding YA está completo, redirige al perfil
  if (user?.onboarding_completed) {
    return <Navigate to="/perfil" replace state={{ from: location }} />;
  }

  // Si el usuario está autenticado, email confirmado, y onboarding NO completo, permite acceso
  return children;
};


function AppContent() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          {/* Rutas Públicas */}
          <Route index element={<HomePage />} />
          <Route path="registro" element={<RegisterPage />} />
          <Route path="verify-email" element={<VerifyEmailPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="terminos" element={<TermsPage />} />
          <Route path="marketplace" element={<MarketplacePage />} />

          {/* Rutas que requieren autenticación y verificaciones */}
          {/* La página de onboarding ahora usa OnboardingSpecificRoute */}
          <Route path="onboarding" element={<OnboardingSpecificRoute><OnboardingPage /></OnboardingSpecificRoute>} />

          {/* El resto de las rutas privadas sí deben asegurar que el onboarding esté completo */}
          <Route path="habitaciones" element={<PrivateRoute><RoomsPage /></PrivateRoute>} />
          <Route path="habitaciones/:id" element={<PrivateRoute><RoomDetailPage /></PrivateRoute>} />
          <Route path="favoritos" element={<PrivateRoute><FavoritesPage /></PrivateRoute>} />
          <Route path="perfil" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          <Route path="perfil/:userId" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          <Route path="comunidades" element={<PrivateRoute><CommunitiesPage /></PrivateRoute>} />
          <Route path="comunidades/crear" element={<PrivateRoute><CreateCommunityPage /></PrivateRoute>} />
          <Route path="comunidades/:communityId" element={<PrivateRoute><CommunityDetailPage /></PrivateRoute>} />
          {/* Ruta para la página de ajustes de la comunidad */}
          <Route path="comunidades/:communityId/ajustes" element={<PrivateRoute><CommunitySettingsPage /></PrivateRoute>} />
          <Route path="chat" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
          <Route path="chat/:chatId" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
          <Route path="admin" element={<PrivateRoute><AdminDashboardPage /></PrivateRoute>} />
          <Route path="añadir" element={<PrivateRoute><AddRoomPage /></PrivateRoute>} />
          <Route path="reviews/property/:roomId" element={<PrivateRoute><div>Reviews for Room</div></PrivateRoute>} />
          <Route path="reviews/:userId" element={<PrivateRoute><div>Reviews for User</div></PrivateRoute>} />

          {/* Ruta de fallback para 404 - Asegúrate de que esta esté al final */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <Toaster />
    </motion.div>
  );
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SupabaseAuthProvider>
        <AppContent />
      </SupabaseAuthProvider>
    </Router>
  );
}

export default App;