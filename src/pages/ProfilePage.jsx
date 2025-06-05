import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext.jsx";
import { supabase } from "@/supabaseClient";
import ProfileForm from "@/components/profile/ProfileForm.jsx";

import { User, Shield, Star, Pencil, Home, Users, PlusCircle } from "lucide-react"; // Importa 'Users' y 'PlusCircle'
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import ProfileCard from "@/components/profile/ProfileCard.jsx";
import SecuritySettings from "@/components/profile/SecuritySettings.jsx";
import NotificationSettings from "@/components/profile/NotificationSettings.jsx";

// Helper function to map Supabase snake_case data to camelCase for React components
const mapSupabaseProfileToFormData = (data, authUser) => {
  if (!data) return null;

  return {
    id: data.id,
    fullName: data.full_name || "",
    email: authUser?.email || "",
    age: data.age || "",
    gender: data.gender || "",
    phone_number: data.phone_number || "",
    pronouns: data.pronouns || "",
    occupation: data.occupation || "",
    bio: data.bio || "",
    languages: data.languages || [],
    interests: data.interests || [],
    hobbies: data.hobbies || [],
    zonas: data.zonas || [],
    socialLinks: Array.isArray(data.social_links) ? data.social_links : [],
    budget: {
      min: data.min_budget || "",
      max: data.max_budget || "",
    },
    avatar_url: data.avatar_url || "",
    lifestyle: data.lifestyle_preferences || {},
  };
};

// Helper function to map React formData to Supabase snake_case data
const mapFormDataToSupabaseProfile = (formData) => {
  return {
    age: formData.age ? parseInt(formData.age, 10) : null,
    gender: formData.gender,
    phone_number: formData.phone_number,
    pronouns: formData.pronouns,
    occupation: formData.occupation,
    bio: formData.bio,
    languages: formData.languages,
    interests: formData.interests,
    hobbies: formData.hobbies,
    zonas: formData.zonas,
    social_links: formData.socialLinks || [],
    min_budget: formData.budget.min ? parseInt(formData.budget.min, 10) : null,
    max_budget: formData.budget.max ? parseInt(formData.budget.max, 10) : null,
    lifestyle_preferences: formData.lifestyle,
    updated_at: new Date().toISOString(),
  };
};

const ProfilePage = () => {
  const { toast } = useToast();
  const { user: authUser, logout, loading: authLoading, updateProfile } = useAuth();
  const { userId } = useParams();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState(null);
  const [formDataForForm, setFormDataForForm] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProperties, setUserProperties] = useState([]);
  const [userMemberCommunities, setUserMemberCommunities] = useState([]); // RENOMBRADO: Comunidades donde es miembro
  const [userOwnedCommunities, setUserOwnedCommunities] = useState([]); // NUEVO ESTADO: Comunidades creadas por el usuario

  const targetProfileId = userId || authUser?.id;

  // --- Fetch Profile Data ---
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!targetProfileId) {
      setPageLoading(false);
      if (!authUser) {
        navigate('/login', { replace: true });
      } else {
        setError("ID de usuario no disponible. Inténtalo de nuevo.");
      }
      return;
    }

    const fetchProfile = async () => {
      setPageLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", targetProfileId)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        if (!data) {
          setError("Perfil no encontrado.");
          toast({ title: "Perfil no encontrado", description: "No se pudo cargar el perfil.", variant: "destructive" });
          navigate('/404', { replace: true });
          return;
        }

        const mappedData = mapSupabaseProfileToFormData(data, authUser);
        setProfileData(mappedData);
        setFormDataForForm(mappedData);
        setIsOwnProfile(targetProfileId === authUser?.id);

      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Error al cargar el perfil.");
        toast({
          title: "Error al cargar el perfil",
          description: err.message || "Inténtalo de nuevo más tarde.",
          variant: "destructive",
        });
        if (err.code === 'PGRST116') {
          navigate('/404', { replace: true });
        }
      } finally {
        setPageLoading(false);
      }
    };

    fetchProfile();
  }, [targetProfileId, authUser, toast, navigate, authLoading]);

  // --- Fetch User's Properties (Rooms) ---
  useEffect(() => {
    const fetchUserProperties = async () => {
      if (!profileData?.id || isEditing) return;

      try {
        const { data, error: roomsError } = await supabase
          .from("rooms")
          .select("id, title, description, price_per_month")
          .eq("host_id", profileData.id);

        if (roomsError) {
          throw roomsError;
        }
        setUserProperties(data || []);
      } catch (err) {
        console.error("Error fetching user properties:", err);
        toast({
          title: "Error al cargar propiedades",
          description: "No se pudieron cargar las propiedades del usuario.",
          variant: "destructive",
        });
      }
    };

    fetchUserProperties();
  }, [profileData, isEditing, toast]);

  // --- RENOMBRADO useEffect: Fetch User's Member Communities ---
  useEffect(() => {
    const fetchUserMemberCommunities = async () => {
      if (!profileData?.id || isEditing) return;

      try {
        const { data, error: communitiesError } = await supabase
          .from("community_members")
          .select(`
            community_id,
            communities (
              id,
              name,
              description,
              image_url
            )
          `)
          .eq("user_id", profileData.id);

        if (communitiesError) {
          throw communitiesError;
        }

        setUserMemberCommunities(data.map(item => item.communities).filter(Boolean) || []);
      } catch (err) {
        console.error("Error fetching user member communities:", err);
        toast({
          title: "Error al cargar comunidades de miembro",
          description: "No se pudieron cargar las comunidades de las que el usuario es miembro.",
          variant: "destructive",
        });
      }
    };

    fetchUserMemberCommunities();
  }, [profileData, isEditing, toast]);

  // --- NUEVO useEffect: Fetch User's Owned Communities ---
  useEffect(() => {
    const fetchUserOwnedCommunities = async () => {
      if (!profileData?.id || isEditing) return;

      try {
        const { data, error: ownedCommunitiesError } = await supabase
          .from("communities")
          .select(`
            id,
            name,
            description,
            image_url
          `)
          .eq("owner_id", profileData.id) // Filtra por el owner_id del perfil actual
          .order("created_at", { ascending: false }); // Opcional: ordenar por fecha de creación

        if (ownedCommunitiesError) {
          throw ownedCommunitiesError;
        }

        setUserOwnedCommunities(data || []);
      } catch (err) {
        console.error("Error fetching user owned communities:", err);
        toast({
          title: "Error al cargar comunidades creadas",
          description: "No se pudieron cargar las comunidades creadas por el usuario.",
          variant: "destructive",
        });
      }
    };

    fetchUserOwnedCommunities();
  }, [profileData, isEditing, toast]);


  // --- Handle Profile Save ---
  const handleSaveProfile = useCallback(async (updatedFormData) => {
    setPageLoading(true);
    setError(null);
    try {
      const profileUpdates = mapFormDataToSupabaseProfile(updatedFormData);

      const authMetadataUpdates = {
        full_name: updatedFormData.fullName,
      };

      await updateProfile(profileUpdates, authMetadataUpdates);

      const { data: latestProfileData, error: latestProfileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", targetProfileId)
        .single();

      if (latestProfileError) throw latestProfileError;

      const mappedLatestData = mapSupabaseProfileToFormData(latestProfileData, authUser);
      setProfileData(mappedLatestData);
      setFormDataForForm(mappedLatestData);


      setIsEditing(false);
      toast({ title: "Perfil actualizado", description: "Los cambios se han guardado correctamente." });
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err.message || "Error al guardar el perfil.");
      toast({
        title: "Error al guardar el perfil",
        description: err.message || "Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setPageLoading(false);
    }
  }, [updateProfile, targetProfileId, authUser, toast]);


  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    if (profileData) {
      setFormDataForForm(profileData);
    }
  }, [profileData]);


  // --- Render Loading/Error states ---
  if (authLoading || (pageLoading && !profileData)) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-lg font-medium min-h-screen flex items-center justify-center">
        Cargando perfil...
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-red-600">
        <h2 className="text-2xl font-semibold mb-4">Error al cargar el perfil</h2>
        <p>{error}</p>
        <Button onClick={() => navigate('/')} className="mt-4">Ir a la página principal</Button>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-muted-foreground min-h-screen flex items-center justify-center">
        <p>No se pudo cargar el perfil o el perfil no existe.</p>
        <Button onClick={() => navigate('/')} className="mt-4">Ir a la página principal</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between"
      >
        <h1 className="text-4xl font-bold text-primary">
          {isOwnProfile ? `¡Hola, ${profileData.fullName?.split(" ")[0] || authUser?.email?.split('@')[0]}!` : `Perfil de ${profileData.fullName}`}
        </h1>
        {isOwnProfile && (
          <Button onClick={() => setIsEditing(!isEditing)} variant="outline" className="gap-2">
            <Pencil className="h-4 w-4" /> {isEditing ? 'Ver perfil' : 'Editar perfil'}
          </Button>
        )}
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-1">
          <div className="sticky top-24">
            <ProfileCard
              userProfile={profileData}
              isOwnProfile={isOwnProfile}
              onReportUser={!isOwnProfile ? () => toast({ title: "Usuario reportado", description: "El usuario ha sido reportado.", variant: "destructive" }) : undefined}
            />
          </div>
        </div>

        <div className="md:col-span-2">
          {isEditing && isOwnProfile ? (
            <ProfileForm
              initialData={formDataForForm}
              onSave={handleSaveProfile}
              onCancel={handleCancelEdit}
              isLoading={pageLoading}
            />
          ) : (
            <Tabs defaultValue="info">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="info"><User className="mr-2 h-4 w-4" />Mi info</TabsTrigger>
                <TabsTrigger value="reviews"><Star className="mr-2 h-4 w-4" />Reseñas</TabsTrigger>
                {isOwnProfile && <TabsTrigger value="settings"><Shield className="mr-2 h-4 w-4" />Ajustes</TabsTrigger>}
              </TabsList>

              <TabsContent value="info">
                <div className="space-y-6">
                  {/* Hobbies e intereses */}
                  <Card className="bg-muted/40 shadow-md rounded-2xl">
                    <CardHeader><CardTitle>Cosas que me gustan</CardTitle></CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Hobbies</h4>
                          {profileData.hobbies?.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {profileData.hobbies.map((hobby, idx) => (
                                <Badge key={idx}>{hobby}</Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">Aún no ha añadido hobbies.</p>
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Intereses</h4>
                          {profileData.interests?.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {profileData.interests.map((interest, idx) => (
                                <Badge key={idx}>{interest}</Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">Aún no ha añadido intereses.</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Idiomas */}
                  <Card className="bg-muted/40 shadow-md rounded-2xl">
                    <CardHeader><CardTitle>Idiomas</CardTitle></CardHeader>
                    <CardContent>
                      {profileData.languages?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {profileData.languages.map((lang, idx) => <Badge key={idx}>{lang}</Badge>)}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No ha añadido idiomas aún.</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Propiedades anunciadas */}
                  <Card className="bg-muted/40 shadow-md rounded-2xl">
                    <CardHeader><CardTitle>Propiedades anunciadas</CardTitle></CardHeader>
                    <CardContent>
                      {userProperties.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {userProperties.map(property => (
                            <Link to={`/habitaciones/${property.id}`} key={property.id} className="block">
                              <Card className="border border-muted p-4 shadow-sm rounded-xl bg-background hover:bg-muted/60 transition-colors">
                                <h4 className="font-semibold text-foreground mb-1 flex items-center">
                                  <Home className="h-4 w-4 mr-2 text-primary" />
                                  {property.title}
                                </h4>
                                {property.price_per_month && (
                                  <p className="text-sm text-primary font-medium mb-1">{property.price_per_month}€/mes</p>
                                )}
                                <p className="text-sm text-muted-foreground line-clamp-2">{property.description}</p>
                              </Card>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Este usuario no ha anunciado propiedades.</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* NUEVO: Comunidades que ha creado */}
                  <Card className="bg-muted/40 shadow-md rounded-2xl">
                    <CardHeader><CardTitle>Comunidades creadas</CardTitle></CardHeader>
                    <CardContent>
                      {userOwnedCommunities.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {userOwnedCommunities.map(community => (
                            <Link to={`/comunidades/${community.id}`} key={community.id} className="block">
                              <Card className="border border-muted p-4 shadow-sm rounded-xl bg-background hover:bg-muted/60 transition-colors">
                                <h4 className="font-semibold text-foreground mb-1 flex items-center">
                                  <PlusCircle className="h-4 w-4 mr-2 text-primary" /> {/* Icono para comunidades creadas */}
                                  {community.name}
                                </h4>
                                {community.image_url && (
                                  <img src={community.image_url} alt={community.name} className="w-full h-24 object-cover rounded-md mb-2" />
                                )}
                                <p className="text-sm text-muted-foreground line-clamp-2">{community.description}</p>
                              </Card>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Este usuario no ha creado ninguna comunidad.</p>
                      )}
                    </CardContent>
                  </Card>


                  {/* Comunidades a las que es miembro (anteriormente "Mis comunidades") */}
                  <Card className="bg-muted/40 shadow-md rounded-2xl">
                    <CardHeader><CardTitle>Miembro de comunidades</CardTitle></CardHeader>
                    <CardContent>
                      {userMemberCommunities.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {userMemberCommunities.map(community => (
                            <Link to={`/comunidades/${community.id}`} key={community.id} className="block">
                              <Card className="border border-muted p-4 shadow-sm rounded-xl bg-background hover:bg-muted/60 transition-colors">
                                <h4 className="font-semibold text-foreground mb-1 flex items-center">
                                  <Users className="h-4 w-4 mr-2 text-primary" /> {/* Icono para comunidades de miembro */}
                                  {community.name}
                                </h4>
                                {community.image_url && (
                                  <img src={community.image_url} alt={community.name} className="w-full h-24 object-cover rounded-md mb-2" />
                                )}
                                <p className="text-sm text-muted-foreground line-clamp-2">{community.description}</p>
                              </Card>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Este usuario no es miembro de ninguna comunidad.</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="reviews">
                <Card>
                  <CardHeader><CardTitle>Reseñas</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Aquí aparecerán las reseñas del usuario.</p>
                  </CardContent>
                </Card>
              </TabsContent>

              {isOwnProfile && (
                <TabsContent value="settings">
                  <SecuritySettings />
                  <NotificationSettings />
                  <Button onClick={logout} variant="destructive" className="mt-4">
                    Cerrar sesión
                  </Button>
                </TabsContent>
              )}
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;