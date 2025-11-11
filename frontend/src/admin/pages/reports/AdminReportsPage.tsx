import { AdminTitle } from '@/admin/components/AdminTitle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    TrendingUp,
    DollarSign,
    ShoppingCart,
    Users,
    Package,
    Calendar,
    Download,
    BarChart3,
    Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    SalesReportChart,
    TopProductsTable,
    CustomerStatsCard,
    RevenueByPeriod,
    OrderStatusChart,
    AIReportChat
} from './components';

export const AdminReportsPage = () => {
    const selectedPeriod: 'week' | 'month' | 'year' = 'month';

    // Aquí irían las queries para obtener datos de reportes del backend

    const stats = [
        {
            title: 'Ventas Totales',
            value: 'Bs. 45,231',
            change: '+20.1%',
            icon: DollarSign,
            trend: 'up',
            description: 'vs. mes anterior'
        },
        {
            title: 'Pedidos',
            value: '234',
            change: '+12.5%',
            icon: ShoppingCart,
            trend: 'up',
            description: 'vs. mes anterior'
        },
        {
            title: 'Clientes Nuevos',
            value: '45',
            change: '+8.3%',
            icon: Users,
            trend: 'up',
            description: 'este mes'
        },
        {
            title: 'Productos Vendidos',
            value: '1,234',
            change: '-2.4%',
            icon: Package,
            trend: 'down',
            description: 'vs. mes anterior'
        }
    ];

    const handleExportReport = () => {
        // Lógica para exportar reporte
        console.log('Exportando reporte...');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <AdminTitle
                    title="Reportes y Análisis"
                    subtitle="Visualiza métricas y estadísticas de tu negocio"
                />
                <Button onClick={handleExportReport} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar Reporte
                </Button>
            </div>

            {/* Tarjetas de Estadísticas */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={index}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {stat.title}
                                </CardTitle>
                                <Icon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                                <p className={`text-xs flex items-center mt-1 ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    <TrendingUp className={`h-3 w-3 mr-1 ${stat.trend === 'down' ? 'rotate-180' : ''
                                        }`} />
                                    {stat.change} {stat.description}
                                </p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Tabs de Reportes */}
            <Tabs defaultValue="sales" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="sales">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Ventas
                    </TabsTrigger>
                    <TabsTrigger value="products">
                        <Package className="h-4 w-4 mr-2" />
                        Productos
                    </TabsTrigger>
                    <TabsTrigger value="customers">
                        <Users className="h-4 w-4 mr-2" />
                        Clientes
                    </TabsTrigger>
                    <TabsTrigger value="orders">
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Pedidos
                    </TabsTrigger>
                    <TabsTrigger value="ai-assistant">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Asistente IA
                    </TabsTrigger>
                </TabsList>

                {/* Tab de Ventas */}
                <TabsContent value="sales" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card className="col-span-2">
                            <CardHeader>
                                <CardTitle>Tendencia de Ventas</CardTitle>
                                <CardDescription>
                                    Visualiza el rendimiento de ventas en el tiempo
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <SalesReportChart period={selectedPeriod} />
                            </CardContent>
                        </Card>

                        <RevenueByPeriod />
                        <OrderStatusChart />
                    </div>
                </TabsContent>

                {/* Tab de Productos */}
                <TabsContent value="products" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Productos Más Vendidos</CardTitle>
                            <CardDescription>
                                Los productos con mejor rendimiento de ventas
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TopProductsTable />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab de Clientes */}
                <TabsContent value="customers" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <CustomerStatsCard />
                    </div>
                </TabsContent>

                {/* Tab de Pedidos */}
                <TabsContent value="orders" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Análisis de Pedidos</CardTitle>
                            <CardDescription>
                                Estadísticas detalladas de los pedidos realizados
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12 text-muted-foreground">
                                <Calendar className="h-12 w-12 mx-auto mb-4" />
                                <p>Análisis de pedidos en desarrollo</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab de Asistente IA */}
                <TabsContent value="ai-assistant" className="space-y-4">
                    <AIReportChat />
                </TabsContent>
            </Tabs>
        </div>
    );
};
