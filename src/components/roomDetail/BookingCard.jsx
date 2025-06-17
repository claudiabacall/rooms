import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
// Importamos el Dialog y los componentes de formulario que necesitaremos
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label"; // Para la etiqueta del textarea
import { Textarea } from "@/components/ui/textarea"; // Para el campo de texto del mensaje

const BookingCard = ({
    pricePerMonth,
    currency = "€",
    onBookRoom, // Esta prop ahora recibirá el mensaje del usuario
    loadingBooking = false,
    authUser,
    toast,
    navigate,
}) => {
    // Nuevo estado para el mensaje del usuario
    const [message, setMessage] = React.useState("");
    // Estado para controlar la apertura/cierre del diálogo
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);

    // Esta función se llama cuando el usuario hace clic en "Solicitar Visita"
    // y abre el diálogo.
    const handleOpenDialog = () => {
        if (!authUser) {
            toast({
                title: "Inicia sesión para solicitar una visita",
                description: "Necesitas una cuenta para contactar al anfitrión.",
                variant: "default",
            });
            navigate("/login");
            return;
        }
        setMessage(""); // Resetea el mensaje cada vez que se abre
        setIsDialogOpen(true);
    };

    // Esta función se llama cuando el usuario envía el formulario en el diálogo
    const handleSubmitVisitRequest = () => {
        // Validación básica: el mensaje no puede estar vacío
        if (message.trim() === "") {
            toast({
                title: "Mensaje requerido",
                description: "Por favor, escribe un mensaje para el anfitrión.",
                variant: "warning",
            });
            return;
        }

        // Llama a la función onBookRoom (que ahora esperará el mensaje)
        onBookRoom(message);
        // Cierra el diálogo después de enviar
        setIsDialogOpen(false);
    };

    return (
        <Card className="shadow-lg rounded-xl">
            <CardHeader>
                <CardTitle className="text-3xl font-bold mb-2">
                    {pricePerMonth ? `${currency}${pricePerMonth}` : 'Consultar precio'}
                    <span className="text-base font-normal text-muted-foreground"> / mes</span>
                </CardTitle>
                <CardDescription>
                    {pricePerMonth ? "Precio de alquiler mensual." : "Ponte en contacto con el anfitrión para conocer el precio y más detalles."}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* El botón ahora actúa como un trigger para el diálogo */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            onClick={handleOpenDialog} // Abre el diálogo y maneja la autenticación
                            className="w-full text-lg py-6"
                            disabled={loadingBooking} // Deshabilita el botón si la solicitud está en curso
                        >
                            {loadingBooking ? (
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            ) : (
                                "Solicitar Visita"
                            )}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Solicitar Visita a la Habitación</DialogTitle>
                            <DialogDescription>
                                Deja un mensaje al anfitrión. Por ejemplo, cuándo te gustaría visitar o cualquier pregunta que tengas.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="message">Tu Mensaje</Label>
                                <Textarea
                                    id="message"
                                    placeholder="Hola, me gustaría visitar la habitación. ¿Podría ser el [fecha] a las [hora]?"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={5} // Controla la altura del textarea
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="submit"
                                onClick={handleSubmitVisitRequest}
                                disabled={loadingBooking}
                            >
                                {loadingBooking ? (
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ) : (
                                    "Enviar Solicitud"
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
};

export default BookingCard;