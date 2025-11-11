import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserPlus, ShoppingBag, TrendingUp } from 'lucide-react';

export const CustomerStatsCard = () => {
    const customerStats = [
        {
            title: 'Total Clientes',
            value: '1,234',
            description: 'Clientes registrados',
            icon: Users,
            color: 'text-blue-600'
        },
        {
            title: 'Clientes Activos',
            value: '856',
            description: 'Compraron este mes',
            icon: ShoppingBag,
            color: 'text-green-600'
        },
        {
            title: 'Nuevos Clientes',
            value: '45',
            description: 'Este mes',
            icon: UserPlus,
            color: 'text-purple-600'
        },
        {
            title: 'Tasa de Retención',
            value: '89%',
            description: 'Clientes recurrentes',
            icon: TrendingUp,
            color: 'text-orange-600'
        }
    ];

    return (
        <>
            {customerStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <Icon className={`h-5 w-5 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {stat.description}
                            </p>
                        </CardContent>
                    </Card>
                );
            })}

            {/* Card adicional con lista de mejores clientes */}
            <Card className="col-span-full lg:col-span-3">
                <CardHeader>
                    <CardTitle>Mejores Clientes</CardTitle>
                    <CardDescription>
                        Clientes con más compras este mes
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[
                            { name: 'Juan Pérez', email: 'juan@gmail.com', total: 'Bs. 3,450', orders: 12 },
                            { name: 'Roberto Gómez', email: 'roberto@gmail.com', total: 'Bs. 2,890', orders: 9 },
                            { name: 'Elkin Apaza', email: 'apazaedixon98@gmail.com', total: 'Bs. 2,340', orders: 8 },
                        ].map((customer, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">{customer.name}</p>
                                    <p className="text-xs text-muted-foreground">{customer.email}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold">{customer.total}</p>
                                    <p className="text-xs text-muted-foreground">{customer.orders} pedidos</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </>
    );
};
