import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ShoppingCart, Search, Tag, PlusCircle, Filter, Sofa, Truck, Wrench, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/supabaseClient"; // Import your Supabase client
import { useToast } from "@/components/ui/use-toast"; // For displaying notifications

// Define your categories. You might fetch these from Supabase too in a real app.
const categories = [
  { id: "all", label: "Todo", icon: <ShoppingCart className="h-5 w-5" /> },
  { id: "muebles", label: "Muebles", icon: <Sofa className="h-5 w-5" /> },
  { id: "servicios", label: "Servicios", icon: <Wrench className="h-5 w-5" /> },
  { id: "decoracion", label: "Decoración", icon: <ImageIcon className="h-5 w-5" /> },
];

const MarketplacePage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [products, setProducts] = useState([]); // State to store fetched products
  const [loading, setLoading] = useState(true); // Loading state
  const { toast } = useToast();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let query = supabase.from("marketplace_items").select("*"); // **Your Supabase table name for marketplace items**

        if (selectedCategory !== "all") {
          query = query.eq("category", selectedCategory); // Filter by category
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }
        setProducts(data || []);
      } catch (error) {
        console.error("Error fetching marketplace products:", error);
        toast({
          title: "Error al cargar productos",
          description: error.message || "No se pudieron cargar los productos del marketplace.",
          variant: "destructive"
        });
        setProducts([]); // Clear products on error
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategory, toast]); // Re-fetch when category changes or toast instance changes

  // Filter products based on search term in memory (after initial fetch)
  const filteredProducts = products.filter(product => {
    const termMatch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.seller_name && product.seller_name.toLowerCase().includes(searchTerm.toLowerCase())) || // Assuming a seller_name column
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.location && product.location.toLowerCase().includes(searchTerm.toLowerCase()));
    return termMatch;
  });

  if (loading) {
    return <div className="text-center py-16 text-muted-foreground">Cargando productos del marketplace...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4"
      >
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-primary flex items-center">
            <ShoppingCart className="mr-3 h-10 w-10" /> Marketplace Rooms
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">Encuentra muebles, servicios y más para tu nuevo hogar.</p>
        </div>
        <Link to="/marketplace/publicar"> {/* Ensure this route exists and leads to a page for adding items */}
          <Button size="lg">
            <PlusCircle className="mr-2 h-5 w-5" /> Publicar Artículo o Servicio
          </Button>
        </Link>
      </motion.div>

      <div className="mb-8 p-6 bg-muted/30 rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-grow w-full md:w-auto">
            <Input
              type="text"
              placeholder="Buscar en el marketplace..."
              className="pl-10 pr-4 py-2 text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {categories.map(cat => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat.id)}
                className="shrink-0"
              >
                {React.cloneElement(cat.icon, { className: "mr-2 h-4 w-4" })}
                {cat.label}
              </Button>
            ))}
          </div>
          {/* Removed the 'showFilters' state as it wasn't connected to any actual filter UI */}
          {/* <Button onClick={() => setShowFilters(!showFilters)} variant="outline" className="shrink-0">
            <Filter className="mr-2 h-4 w-4" /> Filtros
          </Button> */}
        </div>
        {/* You can add more filter UI here if showFilters was to be implemented */}
      </div>

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="overflow-hidden h-full flex flex-col group hover:shadow-xl transition-shadow">
                <div className="relative h-56 bg-muted">
                  {/* Assuming 'image_url' is the column name for the product image in Supabase */}
                  <img
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
                    alt={product.name}
                    src={product.image_url || "https://images.unsplash.com/photo-1555041469-a586c61ea9bc"} // Fallback image
                  />
                  {/* Adjust badge variant based on category if needed */}
                  <Badge className="absolute top-2 right-2" variant={product.category === "servicios" ? "secondary" : "default"}>
                    {product.category}
                  </Badge>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg truncate hover:text-primary">
                    <Link to={`/marketplace/${product.id}`}>{product.name}</Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow pb-3">
                  <p className="text-xl font-bold text-primary mb-1 flex items-center">
                    <Tag className="mr-1.5 h-5 w-5" /> €{product.price}
                  </p>
                  <p className="text-xs text-muted-foreground">Vendido por: {product.seller_name || "N/A"}</p> {/* Assuming seller_name */}
                  <p className="text-xs text-muted-foreground">Ubicación: {product.location || "N/A"}</p>
                </CardContent>
                <div className="p-4 pt-0 border-t mt-auto">
                  <Button className="w-full mt-3">Ver Detalles</Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Search className="h-20 w-20 mx-auto text-muted-foreground mb-6" />
          <h2 className="text-2xl font-semibold mb-2">No se encontraron productos</h2>
          <p className="text-muted-foreground">Intenta ajustar tus filtros o revisa más tarde.</p>
        </motion.div>
      )}
    </div>
  );
};

export default MarketplacePage;