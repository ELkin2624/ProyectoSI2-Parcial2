import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Search, UserPlus, Edit, Trash2, Eye, PlusIcon } from "lucide-react";
import { AdminTitle } from "@/admin/components/AdminTitle";

const mockCustomers = [
    {
        id: "C001",
        name: "María García",
        email: "maria.garcia@email.com",
        phone: "+52 55 1234 5678",
        lastPurchase: "2025-01-15",
        status: "activo",
    },
    {
        id: "C002",
        name: "Carlos Rodríguez",
        email: "carlos.rod@email.com",
        phone: "+52 55 8765 4321",
        lastPurchase: "2025-01-10",
        status: "activo",
    },
    {
        id: "C003",
        name: "Ana Martínez",
        email: "ana.martinez@email.com",
        phone: "+52 55 2468 1357",
        lastPurchase: "2024-12-28",
        status: "inactivo",
    },
    {
        id: "C004",
        name: "Luis Hernández",
        email: "luis.h@email.com",
        phone: "+52 55 9876 5432",
        lastPurchase: "2025-01-18",
        status: "activo",
    },
];

export const AdminCustomersPage = () => {
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between">
                <AdminTitle
                    title="Clientes"
                    subtitle="Aqui puedes ver y adminitrar tus productos"
                />
                <div className="flex justify-end mb-10 gap-4">

                    <Button>
                        <PlusIcon />
                        Nuevo Cliente
                    </Button>

                </div>
            </div>

            {/* Search and Filters */}
            <Card className="p-6 border-border shadow-tesla">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nombre, email o teléfono..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
            </Card>

            {/* Table */}
            <Card className="border-border shadow-tesla">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-border">
                            <TableHead className="font-normal text-muted-foreground">ID</TableHead>
                            <TableHead className="font-normal text-muted-foreground">Nombre</TableHead>
                            <TableHead className="font-normal text-muted-foreground">Email</TableHead>
                            <TableHead className="font-normal text-muted-foreground">Teléfono</TableHead>
                            <TableHead className="font-normal text-muted-foreground">Última Compra</TableHead>
                            <TableHead className="font-normal text-muted-foreground">Estado</TableHead>
                            <TableHead className="font-normal text-muted-foreground text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {mockCustomers.map((customer) => (
                            <TableRow key={customer.id} className="border-border transition-smooth hover:bg-secondary/50">
                                <TableCell className="font-normal">{customer.id}</TableCell>
                                <TableCell className="font-normal">{customer.name}</TableCell>
                                <TableCell className="text-muted-foreground">{customer.email}</TableCell>
                                <TableCell className="text-muted-foreground">{customer.phone}</TableCell>
                                <TableCell className="text-muted-foreground">{customer.lastPurchase}</TableCell>
                                <TableCell>
                                    <Badge
                                        variant={customer.status === "activo" ? "default" : "secondary"}
                                        className="font-normal"
                                    >
                                        {customer.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </>
    );
}
