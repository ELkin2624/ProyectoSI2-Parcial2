import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Download, Filter, Eye } from "lucide-react";
import { toast } from "sonner";
import { AdminTitle } from "@/admin/components/AdminTitle";

const mockSales = [
    {
        id: "V1001",
        date: "2025-01-20",
        customer: "María García",
        total: 1250.0,
        status: "completada",
        method: "Tarjeta",
    },
    {
        id: "V1002",
        date: "2025-01-19",
        customer: "Carlos Rodríguez",
        total: 3500.0,
        status: "completada",
        method: "PayPal",
    },
    {
        id: "V1003",
        date: "2025-01-18",
        customer: "Ana Martínez",
        total: 890.0,
        status: "cancelada",
        method: "Efectivo",
    },
    {
        id: "V1004",
        date: "2025-01-17",
        customer: "Luis Hernández",
        total: 2100.0,
        status: "completada",
        method: "Tarjeta",
    },
    {
        id: "V1005",
        date: "2025-01-16",
        customer: "Isabel Torres",
        total: 4200.0,
        status: "completada",
        method: "Transferencia",
    },
];

const monthlyTrend = [
    { month: "Ene", sales: 45200 },
    { month: "Feb", sales: 52800 },
    { month: "Mar", sales: 48900 },
    { month: "Abr", sales: 61200 },
    { month: "May", sales: 58700 },
    { month: "Jun", sales: 67800 },
];

export const AdminSalesHistoryPage = () => {
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const maxSales = Math.max(...monthlyTrend.map((m) => m.sales));

    const handleExport = () => {
        toast.success("Exportando histórico a CSV...");
    };

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between">
                <AdminTitle
                    title="Historial de ventas"
                    subtitle="Aqui puedes ver el historial de ventas"
                />
                <div className="flex justify-end mb-10 gap-4">
                    <Button onClick={handleExport}>
                        <Download className="h-4 w-4" />
                        Exportar CSV
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="border-border shadow-tesla">
                <CardHeader>
                    <CardTitle className="text-xl font-light flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filtros
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="dateFrom">Desde</Label>
                            <Input
                                id="dateFrom"
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dateTo">Hasta</Label>
                            <Input
                                id="dateTo"
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Estado</Label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger id="status">
                                    <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="completada">Completada</SelectItem>
                                    <SelectItem value="pendiente">Pendiente</SelectItem>
                                    <SelectItem value="cancelada">Cancelada</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="amount">Rango de Monto</Label>
                            <Select>
                                <SelectTrigger id="amount">
                                    <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="0-1000">$0 - $1,000</SelectItem>
                                    <SelectItem value="1000-3000">$1,000 - $3,000</SelectItem>
                                    <SelectItem value="3000+">$3,000+</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Monthly Trend Chart */}
            <Card className="border-border shadow-tesla">
                <CardHeader>
                    <CardTitle className="text-xl font-light">Tendencia Mensual</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {monthlyTrend.map((item) => (
                            <div key={item.month} className="flex items-center gap-4">
                                <div className="w-12 text-sm text-muted-foreground">{item.month}</div>
                                <div className="flex-1">
                                    <div className="h-10 bg-secondary rounded-lg overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500 rounded-lg flex items-center justify-end px-4"
                                            style={{ width: `${(item.sales / maxSales) * 100}%` }}
                                        >
                                            <span className="text-sm font-normal text-primary-foreground">
                                                ${item.sales.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Sales Table */}
            <Card className="border-border shadow-tesla">
                <CardHeader>
                    <CardTitle className="text-xl font-light">Resultados</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-border">
                                <TableHead className="font-normal text-muted-foreground">Fecha</TableHead>
                                <TableHead className="font-normal text-muted-foreground">N° Comprobante</TableHead>
                                <TableHead className="font-normal text-muted-foreground">Cliente</TableHead>
                                <TableHead className="font-normal text-muted-foreground">Método</TableHead>
                                <TableHead className="font-normal text-muted-foreground">Total</TableHead>
                                <TableHead className="font-normal text-muted-foreground">Estado</TableHead>
                                <TableHead className="font-normal text-muted-foreground text-right">
                                    Acciones
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockSales.map((sale) => (
                                <TableRow key={sale.id} className="border-border transition-smooth hover:bg-secondary/50">
                                    <TableCell className="text-muted-foreground">{sale.date}</TableCell>
                                    <TableCell className="font-mono">{sale.id}</TableCell>
                                    <TableCell className="font-normal">{sale.customer}</TableCell>
                                    <TableCell className="text-muted-foreground">{sale.method}</TableCell>
                                    <TableCell className="font-mono">${sale.total.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                sale.status === "completada"
                                                    ? "default"
                                                    : sale.status === "cancelada"
                                                        ? "destructive"
                                                        : "secondary"
                                            }
                                            className="font-normal"
                                        >
                                            {sale.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <Eye className="h-4 w-4" />
                                        </Button>
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
