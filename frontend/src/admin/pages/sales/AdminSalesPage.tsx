import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { TrendingUp, DollarSign, ShoppingBag, Users, Plus, RefreshCw, XCircle, PlusIcon } from "lucide-react";
import { AdminTitle } from "@/admin/components/AdminTitle";

const recentSales = [
    {
        id: "V1001",
        date: "2025-01-20 14:30",
        customer: "María García",
        total: 1250.0,
        status: "completada",
    },
    {
        id: "V1002",
        date: "2025-01-20 15:15",
        customer: "Carlos Rodríguez",
        total: 3500.0,
        status: "completada",
    },
    {
        id: "V1003",
        date: "2025-01-20 16:00",
        customer: "Ana Martínez",
        total: 890.0,
        status: "pendiente",
    },
    {
        id: "V1004",
        date: "2025-01-20 16:45",
        customer: "Luis Hernández",
        total: 2100.0,
        status: "completada",
    },
];

const hourlyData = [
    { hour: "09:00", sales: 850 },
    { hour: "10:00", sales: 1200 },
    { hour: "11:00", sales: 1500 },
    { hour: "12:00", sales: 2100 },
    { hour: "13:00", sales: 1800 },
    { hour: "14:00", sales: 2400 },
    { hour: "15:00", sales: 2800 },
    { hour: "16:00", sales: 2200 },
];

export const AdminSalesPage = () => {
    const maxSales = Math.max(...hourlyData.map((d) => d.sales));

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between">
                <AdminTitle
                    title="Ventas"
                    subtitle="Aqui puedes ver y adminitrar las ventas"
                />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-border shadow-tesla">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-normal text-muted-foreground">
                            Ventas del Día
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-light tracking-tight">$12,450</div>
                        <p className="text-sm text-muted-foreground mt-1">+18.2% vs ayer</p>
                    </CardContent>
                </Card>

                <Card className="border-border shadow-tesla">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-normal text-muted-foreground">
                            Conversión
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-light tracking-tight">3.24%</div>
                        <p className="text-sm text-muted-foreground mt-1">+0.5% vs ayer</p>
                    </CardContent>
                </Card>

                <Card className="border-border shadow-tesla">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-normal text-muted-foreground">
                            Ticket Promedio
                        </CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-light tracking-tight">$1,685</div>
                        <p className="text-sm text-muted-foreground mt-1">+12.1% vs ayer</p>
                    </CardContent>
                </Card>

                <Card className="border-border shadow-tesla">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-normal text-muted-foreground">
                            Clientes Atendidos
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-light tracking-tight">48</div>
                        <p className="text-sm text-muted-foreground mt-1">+6 vs ayer</p>
                    </CardContent>
                </Card>
            </div>

            {/* Chart */}
            <Card className="border-border shadow-tesla">
                <CardHeader>
                    <CardTitle className="text-xl font-light">Ventas por Hora</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {hourlyData.map((item) => (
                            <div key={item.hour} className="flex items-center gap-4">
                                <div className="w-16 text-sm text-muted-foreground">{item.hour}</div>
                                <div className="flex-1">
                                    <div className="h-8 bg-secondary rounded-lg overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-500 rounded-lg flex items-center justify-end px-3"
                                            style={{ width: `${(item.sales / maxSales) * 100}%` }}
                                        >
                                            <span className="text-xs font-normal text-primary-foreground">
                                                ${item.sales}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Recent Sales Table */}
            <Card className="border-border shadow-tesla">
                <CardHeader>
                    <CardTitle className="text-xl font-light">Ventas Recientes</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-border">
                                <TableHead className="font-normal text-muted-foreground">Fecha</TableHead>
                                <TableHead className="font-normal text-muted-foreground">N° Venta</TableHead>
                                <TableHead className="font-normal text-muted-foreground">Cliente</TableHead>
                                <TableHead className="font-normal text-muted-foreground">Total</TableHead>
                                <TableHead className="font-normal text-muted-foreground">Estado</TableHead>
                                <TableHead className="font-normal text-muted-foreground text-right">
                                    Acciones
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentSales.map((sale) => (
                                <TableRow key={sale.id} className="border-border transition-smooth hover:bg-secondary/50">
                                    <TableCell className="text-muted-foreground">{sale.date}</TableCell>
                                    <TableCell className="font-normal">{sale.id}</TableCell>
                                    <TableCell className="font-normal">{sale.customer}</TableCell>
                                    <TableCell className="font-normal">${sale.total.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={sale.status === "completada" ? "default" : "secondary"}
                                            className="font-normal"
                                        >
                                            {sale.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" size="sm">
                                                Ver Detalle
                                            </Button>
                                            {sale.status === "completada" && (
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <XCircle className="h-4 w-4 text-destructive" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    );
}
