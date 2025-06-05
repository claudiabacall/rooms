
import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Home, MessageCircle, BarChart2, ShieldCheck, Edit, Trash2, Search } from "lucide-react";

// Datos de ejemplo
const sampleUsers = [
  { id: "u1", name: "Ana Pérez", email: "ana@example.com", role: "Inquilino", status: "Verificado", joined: "2024-03-15" },
  { id: "u2", name: "Carlos Ruiz (Propietario)", email: "carlos@host.com", role: "Propietario", status: "Pendiente KYC", joined: "2024-04-01" },
  { id: "u3", name: "Laura Gómez", email: "laura@example.com", role: "Inquilino", status: "Bloqueado", joined: "2024-02-10" },
];

const sampleListings = [
  { id: "l1", title: "Piso en Malasaña, 3hab", owner: "Carlos Ruiz", status: "Publicado", created: "2024-04-02", views: 1502 },
  { id: "l2", title: "Estudio luminoso en Gràcia", owner: "Sofia Kent", status: "Pendiente Revisión", created: "2024-04-10", views: 35 },
];

const AdminDashboardPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold tracking-tight text-primary">Panel de Administración de Rooms</h1>
        <p className="mt-2 text-lg text-muted-foreground">Gestiona usuarios, propiedades, comunidades y más.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { title: "Usuarios Activos", value: "1,258", icon: <Users className="h-6 w-6 text-blue-500"/>, change: "+5% esta semana" },
          { title: "Propiedades Listadas", value: "340", icon: <Home className="h-6 w-6 text-green-500"/>, change: "+12 nuevas" },
          { title: "Comunidades", value: "45", icon: <MessageCircle className="h-6 w-6 text-purple-500"/>, change: "+2 activas" },
          { title: "Reportes Pendientes", value: "3", icon: <ShieldCheck className="h-6 w-6 text-red-500"/>, change: "Atender urgente" },
        ].map((stat, index) => (
          <motion.div key={stat.title} initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} transition={{delay: index * 0.1}}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                {stat.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
          <TabsTrigger value="users"><Users className="mr-2 h-4 w-4"/>Usuarios</TabsTrigger>
          <TabsTrigger value="listings"><Home className="mr-2 h-4 w-4"/>Propiedades</TabsTrigger>
          <TabsTrigger value="communities"><MessageCircle className="mr-2 h-4 w-4"/>Comunidades</TabsTrigger>
          <TabsTrigger value="analytics"><BarChart2 className="mr-2 h-4 w-4"/>Analíticas</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Usuarios</CardTitle>
              <CardDescription>Busca, edita o modera usuarios de la plataforma.</CardDescription>
              <div className="pt-2 relative"><Input placeholder="Buscar usuario por nombre o email..." className="pl-10"/><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground"/></div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2">Nombre</th><th className="px-4 py-2">Email</th><th className="px-4 py-2">Rol</th><th className="px-4 py-2">Estado</th><th className="px-4 py-2">Registro</th><th className="px-4 py-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleUsers.map(user => (
                      <tr key={user.id} className="border-b">
                        <td className="px-4 py-2">{user.name}</td><td className="px-4 py-2">{user.email}</td><td className="px-4 py-2">{user.role}</td>
                        <td className="px-4 py-2"><Badge variant={user.status === "Verificado" ? "default" : user.status === "Bloqueado" ? "destructive" : "secondary" }>{user.status}</Badge></td>
                        <td className="px-4 py-2">{user.joined}</td>
                        <td className="px-4 py-2 flex gap-1"><Button variant="ghost" size="icon"><Edit className="h-4 w-4"/></Button><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4"/></Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="listings">
           <Card>
            <CardHeader><CardTitle>Gestión de Propiedades</CardTitle><CardDescription>Revisa, aprueba o elimina listados de propiedades.</CardDescription></CardHeader>
            <CardContent>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2">Título</th><th className="px-4 py-2">Propietario</th><th className="px-4 py-2">Estado</th><th className="px-4 py-2">Creación</th><th className="px-4 py-2">Vistas</th><th className="px-4 py-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleListings.map(listing => (
                      <tr key={listing.id} className="border-b">
                        <td className="px-4 py-2">{listing.title}</td><td className="px-4 py-2">{listing.owner}</td>
                        <td className="px-4 py-2"><Badge variant={listing.status === "Publicado" ? "default" : "secondary" }>{listing.status}</Badge></td>
                        <td className="px-4 py-2">{listing.created}</td><td className="px-4 py-2">{listing.views}</td>
                        <td className="px-4 py-2 flex gap-1"><Button variant="ghost" size="icon"><Edit className="h-4 w-4"/></Button><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4"/></Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="communities"><Card><CardHeader><CardTitle>Gestión de Comunidades</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">(Aquí iría la gestión de comunidades)</p></CardContent></Card></TabsContent>
        <TabsContent value="analytics"><Card><CardHeader><CardTitle>Analíticas de la Plataforma</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">(Aquí irían gráficos y datos de analíticas)</p></CardContent></Card></TabsContent>
      </Tabs>

    </div>
  );
};

export default AdminDashboardPage;
