// src/components/CommunitiesPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Search, PlusCircle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { Input } from "@/components/ui/input";

// ... (CommunityCard component remains the same)
const CommunityCard = ({ community, index }) => {
  const imageUrl = community.image_url || 'https://via.placeholder.com/400x200.png?text=Comunidad';

  return (
    <motion.div
      key={community.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
        <div className="relative h-48">
          <img className="w-full h-full object-cover" alt={community.name} src={imageUrl} />
        </div>
        <CardHeader className="flex-grow">
          <CardTitle className="text-xl hover:text-primary">
            <Link to={`/comunidades/${community.id}`}>{community.name}</Link>
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground line-clamp-1">
            {community.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{community.description}</p>
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="h-4 w-4 mr-1" /> {community.members_count || 0} miembros
          </div>
        </CardContent>
        <div className="p-4 pt-0">
          <Link to={`/comunidades/${community.id}`} className="w-full">
            <Button variant="outline" className="w-full">Ver Comunidad</Button>
          </Link>
        </div>
      </Card>
    </motion.div>
  );
};


const CommunitiesPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [allCommunities, setAllCommunities] = useState([]);
  const [filteredCommunities, setFilteredCommunities] = useState([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const { toast } = useToast();
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [userCommunityMemberships, setUserCommunityMemberships] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchUserMemberships = useCallback(async () => {
    if (!user) {
      setUserCommunityMemberships([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setUserCommunityMemberships(data.map(m => m.community_id));
    } catch (err) {
      console.error("Error al cargar membresías del usuario:", err.message);
      setUserCommunityMemberships([]);
    }
  }, [user]);

  const loadCommunities = useCallback(async () => {
    setLoadingCommunities(true);
    try {
      const { data, error } = await supabase
        .from("communities")
        .select(`
            id,
            name,
            description,
            image_url,
            owner_id,
            members_count
          `);

      if (error) {
        throw error;
      }

      setAllCommunities(data);
    } catch (error) {
      console.error("Error al cargar comunidades:", error);
      toast({
        title: "Error al cargar comunidades",
        description: error.message || "No se pudieron cargar las comunidades.",
        variant: "destructive"
      });
    } finally {
      setLoadingCommunities(false);
    }
  }, [toast]);

  useEffect(() => {
    loadCommunities();
    if (!authLoading && user) {
      fetchUserMemberships();
    }
  }, [loadCommunities, fetchUserMemberships, authLoading, user]);

  useEffect(() => {
    let tempCommunities = allCommunities;

    if (showOnlyMine && user?.id) {
      tempCommunities = tempCommunities.filter(community =>
        community.owner_id === user.id ||
        userCommunityMemberships.includes(community.id)
      );
    }

    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      tempCommunities = tempCommunities.filter(community =>
        community.name?.toLowerCase().includes(lowerCaseSearchTerm) ||
        community.description?.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }

    setFilteredCommunities(tempCommunities);
  }, [allCommunities, showOnlyMine, user, userCommunityMemberships, searchTerm]);


  if (loadingCommunities || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <p className="ml-2 text-gray-600">Cargando comunidades...</p>
      </div>
    );
  }

  if (showOnlyMine && !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h2 className="text-2xl font-semibold mb-4">Inicia sesión para ver tus comunidades</h2>
        <p className="text-muted-foreground mb-6">Necesitas estar logueado para ver las comunidades a las que perteneces o que has creado.</p>
        <Button asChild>
          <Link to="/login">Iniciar Sesión</Link>
        </Button>
      </div>
    );
  }

  if (allCommunities.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">No hay comunidades disponibles</h2>
        <p className="text-muted-foreground mb-6">Parece que aún no se han creado comunidades.</p>
        <Button asChild>
          <Link to="/comunidades/crear">
            <PlusCircle className="mr-2 h-4 w-4" /> Sé el primero en crear una
          </Link>
        </Button>
      </div>
    );
  }

  if (filteredCommunities.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">No se encontraron comunidades</h2>
        <p className="text-muted-foreground mb-6">
          Prueba a modificar tus filtros o el término de búsqueda.
        </p>
        <div className="flex justify-center gap-4">
          <Button onClick={() => { setSearchTerm(""); setShowOnlyMine(false); }}>Restablecer Filtros</Button>
          <Button asChild>
            <Link to="/comunidades/crear">Crear Nueva Comunidad</Link>
          </Button>
        </div>
      </div>
    );
  }


  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4"
      >
        <h1 className="text-3xl font-bold text-primary">Comunidades</h1>
        {/* Sección de acciones en la cabecera */}
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* Botón para mostrar "Mis Comunidades" / "Todas" */}
          {user && (
            <Button
              onClick={() => setShowOnlyMine(prev => !prev)}
              variant={showOnlyMine ? "default" : "outline"}
              className="w-full sm:w-auto text-sm" // Ajustamos tamaño de texto si es necesario
            >
              {showOnlyMine ? "Viendo: Mis Comunidades" : "Viendo: Todas"}
            </Button>
          )}
          <Button asChild className="w-full sm:w-auto text-sm">
            <Link to="/comunidades/crear">
              <PlusCircle className="mr-2 h-4 w-4" /> Crear Comunidad
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* Sección de búsqueda separada y siempre visible */}
      <div className="mb-8 relative w-full max-w-2xl mx-auto"> {/* Centramos y limitamos ancho */}
        <Input
          type="text"
          placeholder="Buscar comunidad por nombre o descripción..."
          className="pl-10 pr-4 py-2 text-base w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCommunities.map((community, index) => (
          <CommunityCard community={community} index={index} key={community.id} />
        ))}
      </div>
    </div>
  );
};

export default CommunitiesPage;