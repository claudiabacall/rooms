import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { Heart, MessageSquare, UserCheck, Home, Search, Users } from "lucide-react";
import { supabase } from "@/supabaseClient"; // Import your Supabase client
import { useAuth } from "@/contexts/SupabaseAuthContext"; // Import useAuth to get the current user

const MatchesPage = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth(); // Get the authenticated user

  // Function to fetch matches for the current user
  const fetchMatches = useCallback(async () => {
    if (!user) {
      setMatches([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch matches where the current user is either user_id_1 or user_id_2,
      // and the 'status' indicates a successful match.
      // This assumes a 'matches' table in Supabase like:
      // id, user_id_1 (FK to profiles), user_id_2 (FK to profiles), item_id (FK to rooms),
      // item_type (e.g., 'room_match', 'profile_match'), status (e.g., 'matched', 'pending'),
      // created_at, updated_at
      const { data, error } = await supabase
        .from('matches') // **Your Supabase table name for matches**
        .select(`
          id,
          item_id,
          item_type,
          compatibility,
          user_id_1,
          user_id_2,
          profiles_user_id_1 (
            id, full_name, age, occupation, avatar_url, bio
          ),
          profiles_user_id_2 (
            id, full_name, age, occupation, avatar_url, bio
          ),
          rooms (
            id, title, location, price, description, images
          )
        `)
        .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`) // Matches involving current user
        .eq('status', 'matched'); // Only show confirmed matches

      if (error) {
        throw error;
      }

      // Transform fetched data into the structure expected by the UI
      const formattedMatches = data.map(match => {
        if (match.item_type === 'profile_match' && match.user_id_1 === user.id) {
          // This is a match with another person
          const matchedProfile = match.profiles_user_id_2;
          return {
            id: match.id, // The match ID from the 'matches' table
            type: 'person',
            person_profile_id: matchedProfile.id, // The ID of the matched person's profile
            name: matchedProfile.full_name,
            age: matchedProfile.age,
            occupation: matchedProfile.occupation,
            bio: matchedProfile.bio,
            avatarUrl: matchedProfile.avatar_url,
            compatibility: match.compatibility, // Assuming compatibility is stored in the matches table
            // mutualInterests: [], // You might fetch this separately if needed
          };
        } else if (match.item_type === 'profile_match' && match.user_id_2 === user.id) {
          // This is a match with another person, where current user is user_id_2
          const matchedProfile = match.profiles_user_id_1;
          return {
            id: match.id,
            type: 'person',
            person_profile_id: matchedProfile.id,
            name: matchedProfile.full_name,
            age: matchedProfile.age,
            occupation: matchedProfile.occupation,
            bio: matchedProfile.bio,
            avatarUrl: matchedProfile.avatar_url,
            compatibility: match.compatibility,
          };
        } else if (match.item_type === 'room_match') {
          // This is a match with a room
          const matchedRoom = match.rooms;
          return {
            id: match.id, // The match ID
            type: 'room',
            room_id: matchedRoom.id, // The ID of the matched room
            title: matchedRoom.title,
            location: matchedRoom.location,
            price: matchedRoom.price,
            description: matchedRoom.description,
            image_url: matchedRoom.images && matchedRoom.images[0] ? matchedRoom.images[0] : null, // Assuming 'images' is an array of URLs
            compatibility: match.compatibility,
            // hostName: "", // You'd need to fetch the host's name if not directly on room
          };
        }
        return null; // Should not happen with correct data
      }).filter(Boolean); // Filter out any nulls

      setMatches(formattedMatches);

    } catch (err) {
      console.error("Error fetching matches:", err.message);
      toast({
        title: "Error al cargar conexiones",
        description: err.message,
        variant: "destructive",
      });
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchMatches();

    // Set up real-time listener for new matches
    const matchesChannel = supabase
      .channel(`public:matches:user_id_1=eq.${user?.id},user_id_2=eq.${user?.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches', filter: `status=eq.matched` }, // Listen to all changes on 'matches' table where status is matched
        (payload) => {
          // If the payload involves the current user, refetch to update UI
          if (payload.new?.user_id_1 === user?.id || payload.new?.user_id_2 === user?.id ||
            payload.old?.user_id_1 === user?.id || payload.old?.user_id_2 === user?.id) {
            fetchMatches();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(matchesChannel);
    };

  }, [user, fetchMatches]); // Re-run effect if user or fetchMatches changes

  // Function to remove a match from Supabase
  const removeMatch = async (matchId) => {
    try {
      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', matchId)
        .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`); // Ensure only the user involved in the match can delete it

      if (error) {
        throw error;
      }

      // Optimistically update UI or let real-time listener handle it
      setMatches(prev => prev.filter(match => match.id !== matchId));
      toast({
        title: "Match deshecho",
        description: "La conexión ha sido eliminada.",
      });
    } catch (err) {
      console.error("Error removing match:", err.message);
      toast({
        title: "Error al deshacer match",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-16 text-muted-foreground">Cargando conexiones...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold tracking-tight text-primary flex items-center">
          <Heart className="h-10 w-10 mr-3 text-red-500 fill-current" />
          Mis Conexiones y Matches
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Aquí están tus matches con personas y pisos. ¡Es hora de conectar!
        </p>
      </motion.div>

      {matches.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center py-16 bg-muted/30 rounded-xl shadow-inner"
        >
          <Search className="h-24 w-24 mx-auto text-muted-foreground mb-8" />
          <h2 className="text-3xl font-semibold mb-4">Aún no tienes matches.</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Explora perfiles de personas y pisos, da 'like' a los que te interesen y espera la magia del match.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/habitaciones">
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
                <Home className="mr-2 h-5 w-5" /> Buscar Pisos
              </Button>
            </Link>
            <Link to="/perfiles"> {/* Asumiendo una página para buscar perfiles de personas */}
              <Button size="lg" variant="outline">
                <Users className="mr-2 h-5 w-5" /> Buscar Compañeros
              </Button>
            </Link>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {matches.map((match, index) => (
            <motion.div
              key={match.id}
              layout
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.95 }}
              transition={{ duration: 0.4, delay: index * 0.07 }}
            >
              <Card className="overflow-hidden h-full flex flex-col shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 glass-card">
                <CardHeader className="p-4 bg-gradient-to-br from-primary/10 to-purple-600/10 dark:from-primary/20 dark:to-purple-600/20">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-16 w-16 border-2 border-background">
                      {/* Use match.avatarUrl for person, or match.image_url for room */}
                      <AvatarImage
                        src={match.type === 'person' ? (match.avatarUrl || `https://avatar.vercel.sh/${match.name}.png`) : (match.image_url || `https://source.unsplash.com/random/?${match.title}&${match.location}&${match.price}`)}
                        alt={match.name || match.title}
                        className="h-full w-full object-cover"
                      />
                      <AvatarFallback>{(match.name || match.title || '').substring(0, 1)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-xl">
                        {match.type === 'person' ? (
                          <Link to={`/perfil/${match.person_profile_id}`} className="hover:underline">{match.name}</Link>
                        ) : (
                          <Link to={`/habitaciones/${match.room_id}`} className="hover:underline">{match.title}</Link>
                        )}
                      </CardTitle>
                      {match.type === 'person' && <CardDescription>{match.occupation}, {match.age} años</CardDescription>}
                      {match.type === 'room' && <CardDescription>{match.location} - {match.price}€/mes</CardDescription>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 flex-grow">
                  {match.type === 'person' && match.bio && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      Bio: {match.bio}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm text-green-600 dark:text-green-400 font-semibold mb-3">
                    <span>Compatibilidad: {match.compatibility}%</span>
                    <UserCheck className="h-5 w-5" />
                  </div>
                  {/* Removed direct links to matchedRoomId/matchedPersonId within description to simplify,
                       as the main link is on the title. You can re-add if needed with correct Supabase IDs. */}
                </CardContent>
                <div className="p-4 pt-0 border-t mt-auto">
                  <div className="flex gap-2 mt-4">
                    <Link to={match.type === 'person' ? `/chat/${match.person_profile_id}` : `/habitaciones/${match.room_id}`} className="flex-1">
                      <Button className="w-full bg-green-500 hover:bg-green-600 text-white">
                        {match.type === 'person' ? <MessageSquare className="mr-2 h-4 w-4" /> : <Home className="mr-2 h-4 w-4" />}
                        {match.type === 'person' ? 'Enviar Mensaje' : 'Ver Propiedad'}
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMatch(match.id)} // Pass the match ID from the 'matches' table
                      className="text-destructive hover:bg-destructive/10"
                      aria-label="Deshacer match"
                    >
                      <Heart className="h-5 w-5" /> {/* Using Heart here, but Trash2 is common for delete */}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MatchesPage;