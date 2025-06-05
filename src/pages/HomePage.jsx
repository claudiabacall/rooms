import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Sparkles,
  Users2,
  ShieldCheck,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { fetchRooms } from "@/services/roomsService"; // This is where the Supabase interaction happens

// Función de debouncing (para mejorar el rendimiento de la búsqueda en las sugerencias)
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const HomePage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roomSuggestions, setRoomSuggestions] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true); // Nuevo estado de carga
  const [errorLoadingRooms, setErrorLoadingRooms] = useState(false); // Nuevo estado para errores
  const navigate = useNavigate();

  useEffect(() => {
    const loadRooms = async () => {
      setIsLoadingRooms(true); // Indicar que la carga ha comenzado
      setErrorLoadingRooms(false); // Resetear estado de error
      try {
        const data = await fetchRooms(); // Esta función debe interactuar con Supabase
        setAllRooms(data || []); // Asegurarse de que sea un array
      } catch (error) {
        console.error("Error al cargar habitaciones:", error);
        setErrorLoadingRooms(true); // Indicar que hubo un error
      } finally {
        setIsLoadingRooms(false); // Indicar que la carga ha terminado
      }
    };
    loadRooms();
  }, []);

  // Función de filtrado con debounce
  const filterRoomSuggestions = useCallback(
    debounce((term) => {
      if (term.trim()) {
        const lower = term.toLowerCase();
        const matches = allRooms.filter(
          (room) =>
            room.title.toLowerCase().includes(lower) ||
            room.city.toLowerCase().includes(lower) // Cambiado de .location a .city
        );
        setRoomSuggestions(matches.slice(0, 5));
      } else {
        setRoomSuggestions([]);
      }
    }, 300), // Retraso de 300ms
    [allRooms]
  );

  useEffect(() => {
    filterRoomSuggestions(searchTerm);
  }, [searchTerm, filterRoomSuggestions]);


  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate(
      searchTerm.trim()
        ? `/habitaciones?q=${encodeURIComponent(searchTerm.trim())}`
        : "/habitaciones"
    );
  };

  const platformFeatures = [
    {
      icon: <Sparkles className="h-10 w-10 feature-icon" />,
      title: "Match por Afinidad",
      description: "Conecta con personas y pisos que realmente encajan contigo.",
    },
    {
      icon: <Users2 className="h-10 w-10 feature-icon" />,
      title: "Comunidades Vibrantes",
      description: "Únete a grupos por intereses, zonas o estilos de vida.",
    },
    {
      icon: <ShieldCheck className="h-10 w-10 feature-icon" />,
      title: "Confianza y Seguridad",
      description: "Perfiles verificados para una experiencia más segura.",
    },
  ];

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section con Buscador */}
      <motion.section
        className="w-full py-20 md:py-32 hero-gradient text-white relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute inset-0 bg-black/40 z-0" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.h1
            className="text-4xl md:text-6xl font-bold mb-6"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Tu Próximo Hogar, Tu Próxima Tribu
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl mb-8 max-w-2xl mx-auto"
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Rooms: donde encontrar piso es una experiencia colaborativa y social. Conecta, comparte y convive.
          </motion.p>

          <motion.div
            className="max-w-xl mx-auto glass-card p-6 md:p-8 rounded-xl shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <form
              onSubmit={handleSearchSubmit}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end relative"
            >
              <div className="md:col-span-2">
                <label htmlFor="search-home" className="block text-sm font-medium mb-1 text-left">
                  Busca tu piso ideal o compañero/a
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="search-home"
                    type="text"
                    placeholder={isLoadingRooms ? "Cargando sugerencias..." : "Ej: 'Piso en Gracia' o 'Compañero deportista'"}
                    className="pl-10 text-gray-900"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={isLoadingRooms} // Deshabilita el input mientras carga
                  />
                  {/* Mensaje de error si la carga falló */}
                  {errorLoadingRooms && (
                    <p className="text-red-500 text-sm mt-1 text-left">Error al cargar sugerencias. Inténtalo de nuevo más tarde.</p>
                  )}
                  {/* Muestra sugerencias solo si no hay error y hay término de búsqueda */}
                  {roomSuggestions.length > 0 && !errorLoadingRooms && (
                    <div className="absolute z-20 bg-white text-black rounded shadow-md w-full mt-1 max-h-40 overflow-y-auto border border-gray-300">
                      {roomSuggestions.map((room) => (
                        <div
                          key={room.id}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-left"
                          onClick={() => {
                            setSearchTerm(room.title);
                            navigate(`/habitaciones?q=${encodeURIComponent(room.title)}`);
                          }}
                        >
                          {room.title} – {room.city} {/* Cambiado de .location a .city */}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3"
                  disabled={isLoadingRooms} // También deshabilita el botón mientras carga
                >
                  <Search className="mr-2 h-5 w-5" /> Buscar
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </motion.section>

      {/* Platform Features Section */}
      <section className="py-16 md:py-24 w-full">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Descubre la Experiencia Rooms
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {platformFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="text-center p-6 h-full glass-card dark:bg-slate-800/50 rounded-xl shadow-md">
                  <div className="flex justify-center mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 md:py-24 w-full bg-gradient-to-r from-blue-600 to-purple-700 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            ¿Listo para encontrar tu gente y tu lugar?
          </motion.h2>
          <motion.p
            className="text-lg mb-8 max-w-xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Regístrate gratis y empieza a conectar con la comunidad Rooms hoy mismo.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link to="/registro">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6 text-primary hover:bg-secondary/90">
                Crear mi Perfil en Rooms
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;