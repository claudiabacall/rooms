// src/pages/ProfilePage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext.jsx";
import { supabase } from "@/supabaseClient";
import ProfileForm from "@/components/profile/ProfileForm.jsx";

// Componentes de UI
import { User, Shield, Star, Pencil, Home, Users, PlusCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Componentes personalizados
import ProfileCard from "@/components/profile/ProfileCard.jsx";
import SecuritySettings from "@/components/profile/SecuritySettings.jsx";
import NotificationSettings from "@/components/profile/NotificationSettings.jsx";

// Librerías de terceros
import ReactStars from 'react-rating-stars-component';

// Funciones de API
import { fetchUserReviews, fetchUserRatingSummary, submitReview } from '../api/reviews';
import { lifestyleQuestions } from "@/lib/lifestyleQuestions"; // Asegúrate de que esta ruta sea correcta

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
    full_name: formData.fullName, // Añadir full_name para actualizar en auth.users
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
  const [userMemberCommunities, setUserMemberCommunities] = useState([]);
  const [userOwnedCommunities, setUserOwnedCommunities] = useState([]);

  // Estados para las reseñas
  const [reviews, setReviews] = useState([]);
  const [ratingSummary, setRatingSummary] = useState({ average_rating: 0, total_reviews: 0 });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState(0);
  const [newReviewText, setNewReviewText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [submitReviewError, setSubmitReviewError] = useState('');


  const targetProfileId = userId || authUser?.id;

  // Renombrar authUser a currentUser para consistencia con el código de reseñas
  const currentUser = authUser;
  const profileId = targetProfileId;

  // --- Fetch Profile Data, Reviews & Rating Summary ---
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

    const fetchAllProfileData = async () => {
      setPageLoading(true);
      setError(null);
      try {
        // Fetch profile details
        const { data: fetchedProfileData, error: fetchError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", targetProfileId)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        if (!fetchedProfileData) {
          setError("Perfil no encontrado.");
          toast({ title: "Perfil no encontrado", description: "No se pudo cargar el perfil.", variant: "destructive" });
          navigate('/404', { replace: true });
          return;
        }

        const mappedData = mapSupabaseProfileToFormData(fetchedProfileData, authUser);
        setProfileData(mappedData);
        setFormDataForForm(mappedData);
        setIsOwnProfile(targetProfileId === authUser?.id);

        // Fetch rating summary (average and total reviews)
        const summary = await fetchUserRatingSummary(targetProfileId);
        if (summary) {
          setRatingSummary(summary);
        } else {
          setRatingSummary({ average_rating: 0, total_reviews: 0 });
        }

        // Fetch individual reviews
        const fetchedReviews = await fetchUserReviews(targetProfileId);
        setReviews(fetchedReviews);

      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Error al cargar el perfil.");
        toast({
          title: "Error al cargar el perfil",
          description: err.message || "Inténtalo de nuevo más tarde.",
          variant: "destructive",
        });
        if (err.code === 'PGRST116') { // Error code for no rows found
          navigate('/404', { replace: true });
        }
      } finally {
        setPageLoading(false);
      }
    };

    fetchAllProfileData();
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

  // --- Fetch User's Member Communities ---
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
      }
      catch (err) {
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

  // --- Fetch User's Owned Communities ---
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
          .eq("owner_id", profileData.id)
          .order("created_at", { ascending: false });

        if (ownedCommunitiesError) {
          throw ownedCommunitiesError;
        }

        setUserOwnedCommunities(data || []);
      }
      catch (err) {
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

      // Update auth.users metadata for full_name
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: {
          full_name: updatedFormData.fullName,
        },
      });

      if (authUpdateError) {
        throw authUpdateError;
      }

      // Update profiles table
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', targetProfileId);

      if (profileUpdateError) {
        throw profileUpdateError;
      }


      // Refetch latest profile data to ensure UI is in sync
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

  // --- Handle Review Submission ---
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmitReviewError('');
    if (!currentUser) {
      setSubmitReviewError('Debes iniciar sesión para dejar una reseña.');
      return;
    }
    if (newReviewRating === 0) {
      setSubmitReviewError('Por favor, selecciona una puntuación.');
      return;
    }
    if (currentUser.id === profileId) {
      setSubmitReviewError('No puedes dejar una reseña sobre ti mismo.');
      return;
    }

    setIsSubmittingReview(true);
    try {
      await submitReview(currentUser.id, profileId, newReviewRating, newReviewText);
      // Actualizar las reseñas y el resumen después de enviar
      const updatedReviews = await fetchUserReviews(profileId);
      setReviews(updatedReviews);
      const updatedSummary = await fetchUserRatingSummary(profileId);
      if (updatedSummary) {
        setRatingSummary(updatedSummary);
      } else {
        setRatingSummary({ average_rating: 0, total_reviews: 0 });
      }
      setNewReviewRating(0);
      setNewReviewText('');
      setShowReviewForm(false); // Ocultar el formulario
      toast({ title: "Reseña enviada", description: "Gracias por tu opinión.", variant: "success" });
    } catch (error) {
      setSubmitReviewError(error.message);
      toast({ title: "Error al enviar reseña", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmittingReview(false);
    }
  };


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
        {/*
          Modificación aquí:
          El <h1> solo se muestra si es el perfil propio (isOwnProfile es true).
          Si no es el perfil propio, el <h1> no se renderiza.
        */}
        {isOwnProfile && (
          <h1 className="text-3xl sm:text-4xl font-bold text-primary">
            ¡Hola, {profileData.fullName?.split(" ")[0] || authUser?.email?.split('@')[0]}!
          </h1>
        )}

        {/* El botón de editar perfil solo se muestra si es el perfil propio */}
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
              ratingSummary={ratingSummary}
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
                            // ENLACE A LA PÁGINA DE LA PROPIEDAD
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
                            // ENLACE A LA PÁGINA DE LA COMUNIDAD
                            <Link to={`/comunidades/${community.id}`} key={community.id} className="block">
                              <Card className="border border-muted p-4 shadow-sm rounded-xl bg-background hover:bg-muted/60 transition-colors">
                                <h4 className="font-semibold text-foreground mb-1 flex items-center">
                                  <PlusCircle className="h-4 w-4 mr-2 text-primary" />
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


                  {/* Comunidades a las que es miembro */}
                  <Card className="bg-muted/40 shadow-md rounded-2xl">
                    <CardHeader><CardTitle>Miembro de comunidades</CardTitle></CardHeader>
                    <CardContent>
                      {userMemberCommunities.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {userMemberCommunities.map(community => (
                            // ENLACE A LA PÁGINA DE LA COMUNIDAD
                            <Link to={`/comunidades/${community.id}`} key={community.id} className="block">
                              <Card className="border border-muted p-4 shadow-sm rounded-xl bg-background hover:bg-muted/60 transition-colors">
                                <h4 className="font-semibold text-foreground mb-1 flex items-center">
                                  <Users className="h-4 w-4 mr-2 text-primary" />
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
                  <CardHeader>
                    <CardTitle>Reseñas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!isOwnProfile && currentUser && (
                      <Button onClick={() => setShowReviewForm(!showReviewForm)} className="mb-4">
                        {showReviewForm ? 'Cancelar reseña' : 'Dejar una reseña'}
                      </Button>
                    )}

                    {showReviewForm && !isOwnProfile && currentUser && (
                      <Card className="mb-4 p-4">
                        <CardTitle className="text-xl mb-3">Tu reseña</CardTitle>
                        <form onSubmit={handleReviewSubmit} className="space-y-4">
                          <div className="flex items-center gap-2">
                            <span className="text-md">Puntuación:</span>
                            <ReactStars
                              count={5}
                              onChange={(newRating) => setNewReviewRating(newRating)}
                              value={newReviewRating}
                              size={24}
                              activeColor="#ffd700"
                              isHalf={true}
                            />
                          </div>
                          <Textarea
                            placeholder="Escribe tu reseña aquí..."
                            value={newReviewText}
                            onChange={(e) => setNewReviewText(e.target.value)}
                            rows={4}
                          />
                          {submitReviewError && <p className="text-red-500 text-sm">{submitReviewError}</p>}
                          <Button type="submit" disabled={isSubmittingReview}>
                            {isSubmittingReview ? 'Enviando...' : 'Enviar Reseña'}
                          </Button>
                        </form>
                      </Card>
                    )}

                    <h3 className="text-xl font-semibold mt-6 mb-4">Todas las reseñas recibidas ({reviews.length})</h3>
                    {reviews.length === 0 ? (
                      <p className="text-muted-foreground">Todavía no hay reseñas para este usuario.</p>
                    ) : (
                      <div className="space-y-4">
                        {reviews.map((review) => (
                          <Card key={review.id} className="p-4">
                            <div className="flex items-center gap-3 mb-2">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={review.reviewer?.avatar_url || 'https://via.placeholder.com/50'} alt={review.reviewer?.full_name} />
                                <AvatarFallback>{review.reviewer?.full_name?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold">{review.reviewer?.full_name || 'Usuario desconocido'}</p>
                                <div className="flex items-center">
                                  <ReactStars
                                    count={5}
                                    value={review.rating}
                                    size={18}
                                    activeColor="#ffd700"
                                    edit={false}
                                    isHalf={true}
                                  />
                                  <span className="ml-2 text-sm text-muted-foreground">
                                    {new Date(review.created_at).toLocaleDateString('es-ES')}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <p className="text-sm text-foreground">{review.review_text || 'No hay texto de reseña.'}</p>
                          </Card>
                        ))}
                      </div>
                    )}
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