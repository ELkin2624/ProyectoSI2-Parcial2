import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export const OrderStatusChart = () => {
    // Datos de ejemplo - estos deberían venir de la API
    const data = [
        { name: 'Entregados', value: 145, color: '#22c55e' },
        { name: 'En Envío', value: 45, color: '#3b82f6' },
        { name: 'En Preparación', value: 32, color: '#f59e0b' },
        { name: 'Pendientes', value: 12, color: '#ef4444' }
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Estado de Pedidos</CardTitle>
                <CardDescription>
                    Distribución de pedidos por estado
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-4">
                    {data.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: item.color }}
                            />
                            <span className="text-sm">{item.name}: <strong>{item.value}</strong></span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
