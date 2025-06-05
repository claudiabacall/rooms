import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Search, PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import { useToast } from "@/components/ui/use-toast";

// Componente para mostrar una tarjeta de comunidad individual
const CommunityCard = ({ community, index }) => {
  // Asegúrate de que community.image_url existe en tu tabla 'communities' de Supabase.
  // Si no tienes imágenes por ahora, puedes usar una imagen de placeholder.
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
          {community.short_description && (
            <CardDescription className="text-sm text-muted-foreground line-clamp-1">
              {community.short_description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{community.description}</p>
          <div className="flex items-center text-sm text-muted-foreground">
            {/*
              Para obtener el número de miembros, necesitarías hacer un JOIN con la tabla user_communities
              y contar los registros, o tener un trigger en Supabase que actualice un campo members_count
              en la tabla communities. Por ahora, si 'members_count' no viene de la DB, mostrará 0.
            */}
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
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const { data, error } = await supabase
          .from("communities")
          // Consulta corregida: se eliminaron los comentarios que PostgREST no puede parsear
          .select(`
            id,
            name,
            description,
            image_url,
            owner_id
          `);

        if (error) {
          throw error;
        }

        setCommunities(data);
      } catch (error) {
        console.error("Error al cargar comunidades:", error);
        toast({
          title: "Error al cargar comunidades",
          description: error.message || "No se pudieron cargar las comunidades.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    fetchCommunities();
  }, [toast]);

  if (loading) {
    return <div className="text-center py-16 text-muted-foreground">Cargando comunidades...</div>;
  }

  // Si no hay comunidades, mostrar un mensaje
  if (communities.length === 0) {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4"
      >
        <h1 className="text-3xl font-bold text-primary">Comunidades</h1>
        <div className="flex gap-2">
          {/* Aquí podrías añadir un input para el filtro si lo necesitas */}
          <Button variant="outline">
            <Search className="mr-2 h-4 w-4" /> Buscar
          </Button>
          <Button asChild>
            <Link to="/comunidades/crear">
              <PlusCircle className="mr-2 h-4 w-4" /> Crear Comunidad
            </Link>
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {communities.map((community, index) => (
          <CommunityCard community={community} index={index} key={community.id} />
        ))}
      </div>
    </div>
  );
};

export default CommunitiesPage;