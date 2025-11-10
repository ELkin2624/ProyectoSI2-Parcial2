import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

export const RevenueByPeriod = () => {
    const periods = [
        { label: 'Esta Semana', value: 'Bs. 12,450', change: '+15.3%' },
        { label: 'Este Mes', value: 'Bs. 45,231', change: '+20.1%' },
        { label: 'Este Año', value: 'Bs. 324,890', change: '+12.7%' }
    ];

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Ingresos por Período</CardTitle>
                        <CardDescription>
                            Comparativa de ingresos
                        </CardDescription>
                    </div>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {periods.map((period, index) => (
                        <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0">
                            <div>
                                <p className="text-sm font-medium">{period.label}</p>
                                <p className="text-2xl font-bold">{period.value}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-semibold text-green-600">
                                    {period.change}
                                </span>
                                <p className="text-xs text-muted-foreground">vs. anterior</p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
