// src/admin/pages/predictions/SalesPredictionsPage.tsx
import { useState } from 'react';
import { AdminTitle } from '@/admin/components/AdminTitle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    TrendingUp,
    Calendar,
    DollarSign,
    AlertCircle,
    Loader2,
    LineChart,
    Download
} from 'lucide-react';
import { toast } from 'sonner';
import { predecirVentas, type PrediccionResponse } from '@/admin/actions/prediccion.action';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

export const SalesPredictionsPage = () => {
    const [diasPredecir, setDiasPredecir] = useState<number>(7);
    const [isLoading, setIsLoading] = useState(false);
    const [predicciones, setPredicciones] = useState<PrediccionResponse | null>(null);

    const handlePredict = async () => {
        if (diasPredecir < 1 || diasPredecir > 90) {
            toast.error('Por favor ingresa un número válido de días (1-90)');
            return;
        }

        setIsLoading(true);
        setPredicciones(null);

        try {
            const resultado = await predecirVentas({ dias_a_predecir: diasPredecir });
            setPredicciones(resultado);
            toast.success(`Predicción generada para ${diasPredecir} días`);
        } catch (error) {
            console.error('Error al predecir ventas:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error al generar predicción';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportCSV = () => {
        if (!predicciones?.predicciones) {
            toast.error('No hay datos para exportar');
            return;
        }

        // Crear CSV
        const headers = ['Fecha', 'Ventas Predichas (Bs.)'];
        const rows = predicciones.predicciones.map(pred => [
            pred.fecha,
            pred.prediccion_venta.toFixed(2)
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Descargar
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `prediccion_ventas_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success('CSV exportado exitosamente');
    };

    const calcularTotalPredicho = () => {
        if (!predicciones?.predicciones) return 0;
        return predicciones.predicciones.reduce((sum, pred) => sum + pred.prediccion_venta, 0);
    };

    const calcularPromedioDiario = () => {
        if (!predicciones?.predicciones || predicciones.predicciones.length === 0) return 0;
        return calcularTotalPredicho() / predicciones.predicciones.length;
    };

    return (
        <div className="space-y-6">
            <AdminTitle
                title="Predicción de Ventas con IA"
                subtitle="Genera predicciones de ventas futuras usando Machine Learning"
            />

            {/* Card de configuración */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <LineChart className="h-5 w-5" />
                        Configurar Predicción
                    </CardTitle>
                    <CardDescription>
                        Utiliza el modelo Random Forest entrenado para predecir ventas futuras
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="dias">Días a Predecir</Label>
                            <Input
                                id="dias"
                                type="number"
                                min="1"
                                max="90"
                                value={diasPredecir}
                                onChange={(e) => setDiasPredecir(parseInt(e.target.value) || 7)}
                                placeholder="Ej: 7, 14, 30"
                            />
                            <p className="text-sm text-muted-foreground">
                                Rango: 1 a 90 días
                            </p>
                        </div>

                        <div className="flex items-end">
                            <Button
                                onClick={handlePredict}
                                disabled={isLoading}
                                className="w-full"
                                size="lg"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Generando Predicción...
                                    </>
                                ) : (
                                    <>
                                        <TrendingUp className="mr-2 h-4 w-4" />
                                        Generar Predicción
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Información del modelo */}
                    {predicciones && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                Información del Modelo
                            </h4>
                            <div className="grid gap-2 text-sm text-blue-800">
                                <div>
                                    <strong>Modelo utilizado:</strong> Random Forest
                                </div>
                                <div>
                                    <strong>Fecha de generación:</strong> {new Date().toLocaleString()}
                                </div>
                                <div>
                                    <strong>Días predichos:</strong> {predicciones.predicciones.length}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Resultados */}
            {predicciones && predicciones.predicciones.length > 0 && (
                <>
                    {/* Cards de resumen */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Total Predicho
                                </CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    Bs. {calcularTotalPredicho().toFixed(2)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Próximos {diasPredecir} días
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Promedio Diario
                                </CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    Bs. {calcularPromedioDiario().toFixed(2)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Esperado por día
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Días Analizados
                                </CardTitle>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {predicciones.predicciones.length}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Predicciones generadas
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tabla de predicciones */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Predicciones Detalladas</CardTitle>
                                    <CardDescription>
                                        Ventas predichas por día con intervalos de confianza
                                    </CardDescription>
                                </div>
                                <Button onClick={handleExportCSV} variant="outline" size="sm">
                                    <Download className="mr-2 h-4 w-4" />
                                    Exportar CSV
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead className="text-right">Ventas Predichas (Bs.)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {predicciones.predicciones.map((pred, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">
                                                    {new Date(pred.fecha).toLocaleDateString('es-BO', {
                                                        weekday: 'short',
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold">
                                                    Bs. {pred.prediccion_venta.toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Nota informativa */}
                    <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5" />
                                <div className="space-y-1">
                                    <h4 className="font-semibold text-purple-900">
                                        📊 Acerca de estas Predicciones
                                    </h4>
                                    <p className="text-sm text-purple-800">
                                        Las predicciones se generan usando un modelo de <strong>Random Forest</strong> entrenado
                                        con datos históricos de ventas. Los intervalos de confianza indican el rango probable
                                        donde se encontrarán las ventas reales.
                                    </p>
                                    <p className="text-sm text-purple-800 mt-2">
                                        💡 <strong>Tip:</strong> Para mejores resultados, considera factores externos como
                                        promociones, temporadas y eventos especiales que puedan afectar las ventas.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            {/* Estado inicial sin predicciones */}
            {!predicciones && !isLoading && (
                <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
                    <CardContent className="pt-6">
                        <div className="text-center space-y-4 py-8">
                            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                <LineChart className="h-8 w-8 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                                    ¿Listo para predecir el futuro?
                                </h3>
                                <p className="text-sm text-blue-700 max-w-md mx-auto">
                                    Configura los días que deseas predecir y genera tu pronóstico de ventas
                                    basado en inteligencia artificial y datos históricos.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
