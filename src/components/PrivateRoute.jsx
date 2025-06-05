// src/components/PrivateRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext'; // Importa useAuth desde tu contexto

const PrivateRoute = () => {
    const { user, loading } = useAuth(); // Obtén el estado del usuario y si está cargando desde tu hook de autenticación

    // Muestra un mensaje de carga mientras se verifica la autenticación
    if (loading) {
        return <div className="text-center py-16 text-muted-foreground">Cargando autenticación...</div>;
    }

    // Si el usuario está autenticado, renderiza las rutas anidadas
    if (user) {
        return <Outlet />;
    }

    // Si el usuario no está autenticado, redirige a la página de login
    return <Navigate to="/login" replace />;
};

export default PrivateRoute;