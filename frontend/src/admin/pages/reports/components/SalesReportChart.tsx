import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SalesReportChartProps {
    period: 'week' | 'month' | 'year';
}

export const SalesReportChart = ({ period }: SalesReportChartProps) => {
    // Aquí se puede filtrar la data según el período
    console.log('Período seleccionado:', period);
    // Datos de ejemplo - estos deberían venir de la API
    const data = [
        { name: 'Ene', ventas: 4000, pedidos: 24 },
        { name: 'Feb', ventas: 3000, pedidos: 18 },
        { name: 'Mar', ventas: 5000, pedidos: 30 },
        { name: 'Abr', ventas: 4500, pedidos: 27 },
        { name: 'May', ventas: 6000, pedidos: 36 },
        { name: 'Jun', ventas: 5500, pedidos: 33 },
        { name: 'Jul', ventas: 7000, pedidos: 42 },
        { name: 'Ago', ventas: 6500, pedidos: 39 },
        { name: 'Sep', ventas: 8000, pedidos: 48 },
        { name: 'Oct', ventas: 7500, pedidos: 45 },
        { name: 'Nov', ventas: 9000, pedidos: 54 },
        { name: 'Dic', ventas: 8500, pedidos: 51 }
    ];

    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="ventas" fill="#8884d8" name="Ventas (Bs.)" />
                <Bar dataKey="pedidos" fill="#82ca9d" name="Pedidos" />
            </BarChart>
        </ResponsiveContainer>
    );
};
