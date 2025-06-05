
import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const TermsPage = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link to="/registro" className="mb-8 inline-block">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Registro
          </Button>
        </Link>
        
        <h1 className="text-4xl font-bold text-primary mb-6">Términos y Condiciones de Rooms</h1>
        <p className="text-sm text-muted-foreground mb-8">Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="space-y-6 prose dark:prose-invert max-w-none">
          <section>
            <h2 className="text-2xl font-semibold">1. Aceptación de los Términos</h2>
            <p>Al acceder y utilizar la plataforma Rooms (en adelante, "la Plataforma"), usted acepta estar legalmente vinculado por estos Términos y Condiciones (en adelante, "los Términos") y nuestra Política de Privacidad. Si no está de acuerdo con alguno de estos términos, por favor, no utilice la Plataforma.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">2. Descripción del Servicio</h2>
            <p>Rooms es una plataforma colaborativa diseñada para facilitar el alquiler de viviendas y la conexión entre jóvenes, principalmente estudiantes universitarios. Ofrecemos herramientas para crear perfiles, buscar propiedades y compañeros de piso, interactuar en comunidades y comunicare.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">3. Elegibilidad y Cuentas de Usuario</h2>
            <p>Para utilizar la Plataforma, debe tener al menos 18 años y la capacidad legal para celebrar contratos vinculantes. Es responsable de mantener la confidencialidad de su cuenta y contraseña. Acepta notificar inmediatamente a Rooms cualquier uso no autorizado de su cuenta.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold">4. Verificación de Identidad (KYC)</h2>
            <p>Podemos requerir una verificación de identidad (Know Your Customer - KYC) para mejorar la seguridad y confianza en la Plataforma. Acepta proporcionar información precisa y actualizada para este proceso. Nos reservamos el derecho de suspender o cancelar cuentas que no cumplan con los requisitos de verificación.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">5. Conducta del Usuario</h2>
            <p>Se compromete a utilizar la Plataforma de manera responsable y legal. No publicará contenido falso, engañoso, difamatorio, obsceno o que infrinja los derechos de terceros. Se prohíbe el acoso, spam o cualquier actividad que perturbe el buen funcionamiento de la comunidad.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">6. Contenido Generado por el Usuario</h2>
            <p>Usted es el único responsable del contenido que publica en la Plataforma (textos, fotos, valoraciones, etc.). Al publicar contenido, otorga a Rooms una licencia mundial, no exclusiva, libre de regalías y transferible para usar, reproducir, distribuir y mostrar dicho contenido en relación con la Plataforma.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold">7. Propiedades y Alquileres</h2>
            <p>Los propietarios son responsables de la exactitud de la información de sus listados. Rooms no es parte de ningún contrato de alquiler entre usuarios. Recomendamos encarecidamente realizar la debida diligencia antes de comprometerse a un alquiler. Las disputas entre usuarios deben resolverse entre ellos.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">8. Limitación de Responsabilidad</h2>
            <p>La Plataforma se proporciona "tal cual" y "según disponibilidad". Rooms no garantiza que la Plataforma esté libre de errores o interrupciones. En la máxima medida permitida por la ley, Rooms no será responsable de ningún daño directo, indirecto, incidental, especial o consecuente que surja del uso o la imposibilidad de usar la Plataforma.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">9. Modificación de los Términos</h2>
            <p>Rooms se reserva el derecho de modificar estos Términos en cualquier momento. Le notificaremos los cambios importantes. El uso continuado de la Plataforma después de dichas modificaciones constituirá su aceptación de los nuevos Términos.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">10. Contacto</h2>
            <p>Si tiene alguna pregunta sobre estos Términos, por favor contáctenos en legal@rooms.app (dirección de ejemplo).</p>
          </section>
        </div>
      </motion.div>
    </div>
  );
};

export default TermsPage;
