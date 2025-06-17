import React from 'react';
import { Link } from "react-router-dom";
import { Star, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReviewCard from "./ReviewCard"; // Importa el componente ReviewCard

const RoomReviewsSection = ({
    authUser,
    reviews,
    loadingReviews,
    overallAverageRating,
    reviewCount,
    newReviewRating,
    setNewReviewRating,
    newReviewComment,
    setNewReviewComment,
    handleSubmitReview,
    isSubmittingReview,
    toast, // Pasamos toast como prop para las notificaciones
}) => {
    return (
        <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
                Reseñas ({reviewCount})
                <span className="ml-3 flex items-center text-yellow-500">
                    {overallAverageRating > 0 ? (
                        <>
                            {overallAverageRating} <Star className="h-5 w-5 fill-yellow-500 ml-1" />
                        </>
                    ) : (
                        <span className="text-muted-foreground text-sm ml-2">Sé el primero en reseñar</span>
                    )}
                </span>
            </h2>

            {/* Formulario para añadir nueva reseña */}
            {authUser ? (
                <form onSubmit={handleSubmitReview} className="bg-card p-6 rounded-lg shadow-md mb-8">
                    <h3 className="text-xl font-semibold mb-4">Escribe tu reseña</h3>
                    <div className="mb-4">
                        <label htmlFor="rating" className="block text-sm font-medium text-foreground mb-2">
                            Tu Calificación
                        </label>
                        <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className={`h-7 w-7 cursor-pointer ${i < newReviewRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                    onClick={() => setNewReviewRating(i + 1)}
                                />
                            ))}
                            <span className="ml-3 text-lg font-medium">{newReviewRating} / 5</span>
                        </div>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="comment" className="block text-sm font-medium text-foreground mb-2">
                            Comentario (opcional)
                        </label>
                        <Textarea
                            id="comment"
                            placeholder="Comparte tu experiencia..."
                            value={newReviewComment}
                            onChange={(e) => setNewReviewComment(e.target.value)}
                            rows="4"
                        />
                    </div>
                    <Button type="submit" disabled={isSubmittingReview}>
                        {isSubmittingReview ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" /> Enviar Reseña
                            </>
                        )}
                    </Button>
                </form>
            ) : (
                <p className="text-muted-foreground text-center p-4 border rounded-lg mb-8">
                    <Link to="/login" className="text-primary hover:underline">Inicia sesión</Link> para dejar una reseña.
                </p>
            )}

            {/* Lista de reseñas */}
            {loadingReviews ? (
                <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                    <p className="ml-2 text-gray-600">Cargando reseñas...</p>
                </div>
            ) : reviews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {reviews.map((review) => (
                        <ReviewCard key={review.id} review={review} />
                    ))}
                </div>
            ) : (
                <p className="text-muted-foreground text-center py-8">Aún no hay reseñas para esta habitación.</p>
            )}
        </section>
    );
};

export default RoomReviewsSection;