import { AdminTitle } from '@/admin/components/AdminTitle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
    TrendingUp,
    DollarSign,
    ShoppingCart,
    Users,
    Package,
    Download,
    FileSpreadsheet,
    FileJson,
    Loader2,
    Mic,
    MicOff,
    Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

export const AdminReportsPage = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [reportData, setReportData] = useState<any>(null);

    // Estados para el generador rápido de reportes
    const [selectedMetric, setSelectedMetric] = useState('');
    const [selectedFormat, setSelectedFormat] = useState('json');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Estados para Speech-to-Text con react-speech-recognition
    const [promptText, setPromptText] = useState('');

    // Hook de react-speech-recognition
    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition
    } = useSpeechRecognition();

    // Sincronizar transcript con promptText
    useEffect(() => {
        if (transcript) {
            setPromptText(transcript);
        }
    }, [transcript]);

    // Mostrar notificación cuando empieza/termina de escuchar
    useEffect(() => {
        if (listening) {
            toast.info('🎤 Escuchando...', {
                description: 'Habla claramente. Tu voz será convertida a texto.',
                duration: 2000
            });
        } else if (transcript && !listening) {
            toast.success('✅ Voz convertida a texto', {
                description: `"${transcript}"`,
                duration: 2000
            });
        }
    }, [listening, transcript]);

    // Métricas disponibles en el microservicio
    const metricsOptions = [
        { value: 'ventas_totales', label: '📊 Ventas Totales', category: 'Ventas' },
        { value: 'cantidad_pedidos', label: '📦 Cantidad de Pedidos', category: 'Ventas' },
        { value: 'ticket_promedio', label: '💵 Ticket Promedio', category: 'Ventas' },
        { value: 'productos_mas_vendidos', label: '🏆 Productos Más Vendidos', category: 'Ventas' },
        { value: 'productos_menos_vendidos', label: '📉 Productos Menos Vendidos', category: 'Ventas' },
        { value: 'ventas_por_categoria', label: '🏷️ Ventas por Categoría', category: 'Ventas' },
        { value: 'ingresos_brutos', label: '💰 Ingresos Brutos', category: 'Finanzas' },
        { value: 'ingresos_netos', label: '💸 Ingresos Netos', category: 'Finanzas' },
        { value: 'stock_actual', label: '📦 Stock Actual', category: 'Inventario' },
        { value: 'inventario_bajo', label: '⚠️ Inventario Bajo', category: 'Inventario' },
        { value: 'clientes_nuevos', label: '👥 Clientes Nuevos', category: 'Clientes' },
        { value: 'clientes_frecuentes', label: '⭐ Clientes Frecuentes', category: 'Clientes' },
        { value: 'pedidos_pendientes', label: '⏳ Pedidos Pendientes', category: 'Logística' },
        { value: 'pedidos_enviados', label: '🚚 Pedidos Enviados', category: 'Logística' },
        { value: 'pedidos_entregados', label: '✅ Pedidos Entregados', category: 'Logística' },
    ];

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

    // Función para manejar el reconocimiento de voz con react-speech-recognition
    const toggleRecording = () => {
        if (!browserSupportsSpeechRecognition) {
            toast.error('Reconocimiento de voz no disponible', {
                description: 'Tu navegador no soporta reconocimiento de voz. Por favor usa Google Chrome.'
            });
            return;
        }

        if (listening) {
            SpeechRecognition.stopListening();
        } else {
            resetTranscript();
            SpeechRecognition.startListening({
                language: 'es-ES',
                continuous: false
            });
        }
    };

    // Función para generar reportes con el microservicio usando texto o voz
    const handleGenerateWithPrompt = async () => {
        const trimmedPrompt = promptText.trim();

        if (!trimmedPrompt) {
            toast.error('Por favor escribe o dicta tu consulta');
            return;
        }

        setIsGenerating(true);
        setReportData(null);

        try {
            const response = await fetch('http://localhost:8001/generar-reporte-ia', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: trimmedPrompt })
            });

            if (!response.ok) {
                throw new Error('Error al generar el reporte');
            }

            // Verificar si es Excel
            const contentType = response.headers.get('content-type');

            if (contentType?.includes('spreadsheet') || contentType?.includes('excel')) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `reporte_${Date.now()}.xlsx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toast.success('Reporte descargado exitosamente en Excel');
            } else {
                const data = await response.json();
                setReportData(data);
                toast.success('Reporte generado exitosamente');
            }

        } catch (error) {
            console.error('Error al generar reporte:', error);
            toast.error('Error al generar el reporte. Verifica que el microservicio esté activo.');
        } finally {
            setIsGenerating(false);
        }
    };

    // Función para generar reportes con el formulario estructurado
    const handleGenerateReport = async () => {
        if (!selectedMetric) {
            toast.error('Por favor selecciona una métrica');
            return;
        }

        if (!startDate || !endDate) {
            toast.error('Por favor selecciona las fechas');
            return;
        }

        setIsGenerating(true);
        setReportData(null);

        try {
            // Construir el prompt basado en la métrica seleccionada
            const metricLabel = metricsOptions.find(m => m.value === selectedMetric)?.label || selectedMetric;
            const prompt = `Generar reporte de ${metricLabel} desde ${startDate} hasta ${endDate} en formato ${selectedFormat}`;

            const response = await fetch('http://localhost:8001/generar-reporte-ia', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt })
            });

            if (!response.ok) {
                throw new Error('Error al generar el reporte');
            }

            // Si es Excel, descargar el archivo
            if (selectedFormat === 'excel') {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${selectedMetric}_${startDate}_${endDate}.xlsx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toast.success('Reporte descargado exitosamente');
            } else {
                // Si es JSON, mostrar los datos
                const data = await response.json();
                setReportData(data);
                toast.success('Reporte generado exitosamente');
            }

        } catch (error) {
            console.error('Error al generar reporte:', error);
            toast.error('Error al generar el reporte. Verifica que el microservicio esté activo.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleExportReport = () => {
        if (!reportData) {
            toast.error('No hay datos para exportar');
            return;
        }

        // Exportar como JSON
        const dataStr = JSON.stringify(reportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Reporte exportado');
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

            {/* Generador de Reportes con IA */}
            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Generador Rápido de Reportes</CardTitle>
                        <CardDescription>
                            Selecciona una métrica y período para generar reportes personalizados
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Formulario de generación */}
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="metric">Métrica a Analizar</Label>
                                <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                                    <SelectTrigger id="metric">
                                        <SelectValue placeholder="Selecciona una métrica" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {/* Agrupar por categoría */}
                                        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                                            📊 Ventas
                                        </div>
                                        {metricsOptions.filter(m => m.category === 'Ventas').map(metric => (
                                            <SelectItem key={metric.value} value={metric.value}>
                                                {metric.label}
                                            </SelectItem>
                                        ))}
                                        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                                            💰 Finanzas
                                        </div>
                                        {metricsOptions.filter(m => m.category === 'Finanzas').map(metric => (
                                            <SelectItem key={metric.value} value={metric.value}>
                                                {metric.label}
                                            </SelectItem>
                                        ))}
                                        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                                            📦 Inventario
                                        </div>
                                        {metricsOptions.filter(m => m.category === 'Inventario').map(metric => (
                                            <SelectItem key={metric.value} value={metric.value}>
                                                {metric.label}
                                            </SelectItem>
                                        ))}
                                        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                                            👥 Clientes
                                        </div>
                                        {metricsOptions.filter(m => m.category === 'Clientes').map(metric => (
                                            <SelectItem key={metric.value} value={metric.value}>
                                                {metric.label}
                                            </SelectItem>
                                        ))}
                                        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                                            🚚 Logística
                                        </div>
                                        {metricsOptions.filter(m => m.category === 'Logística').map(metric => (
                                            <SelectItem key={metric.value} value={metric.value}>
                                                {metric.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="format">Formato de Salida</Label>
                                <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                                    <SelectTrigger id="format">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="json">
                                            <div className="flex items-center gap-2">
                                                <FileJson className="h-4 w-4" />
                                                JSON (Ver en pantalla)
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="excel">
                                            <div className="flex items-center gap-2">
                                                <FileSpreadsheet className="h-4 w-4" />
                                                Excel (Descargar)
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="start-date">Fecha Inicial</Label>
                                <Input
                                    id="start-date"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="end-date">Fecha Final</Label>
                                <Input
                                    id="end-date"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={handleGenerateReport}
                                disabled={isGenerating || !selectedMetric || !startDate || !endDate}
                                className="flex-1"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Generando...
                                    </>
                                ) : (
                                    <>
                                        <Download className="mr-2 h-4 w-4" />
                                        Generar Reporte
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Mostrar datos del reporte si está en formato JSON */}
                        {reportData && selectedFormat === 'json' && (
                            <div className="mt-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold">Resultados del Reporte</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {reportData.count} registros encontrados
                                        </p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={handleExportReport}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Exportar JSON
                                    </Button>
                                </div>

                                <div className="border rounded-lg p-4 max-h-96 overflow-auto bg-slate-50">
                                    <pre className="text-xs">
                                        {JSON.stringify(reportData.data, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        )}

                        {/* Ejemplos de uso */}
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <h4 className="font-semibold text-blue-900 mb-2">💡 Métricas Disponibles:</h4>
                            <div className="grid gap-2 text-sm text-blue-800">
                                <div>📊 <strong>Ventas:</strong> Ventas totales, productos más/menos vendidos, ticket promedio</div>
                                <div>💰 <strong>Finanzas:</strong> Ingresos brutos/netos, costos, márgenes</div>
                                <div>📦 <strong>Inventario:</strong> Stock actual, inventario bajo, rotación</div>
                                <div>👥 <strong>Clientes:</strong> Nuevos, frecuentes, inactivos, segmentación</div>
                                <div>🚚 <strong>Logística:</strong> Pedidos pendientes, enviados, entregados</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Sección de Consulta con IA (Voz o Texto) */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-purple-600" />
                            <div>
                                <CardTitle>Consulta con Asistente de IA</CardTitle>
                                <CardDescription>
                                    Escribe o dicta tu consulta en lenguaje natural
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Indicador de grabación */}
                        {listening && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 animate-pulse">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <span className="text-sm text-red-700 font-medium">
                                    🎤 Grabando... Habla ahora
                                </span>
                            </div>
                        )}

                        {/* Campo de texto con botones */}
                        <div className="space-y-2">
                            <Label htmlFor="prompt-text">Tu Consulta</Label>
                            <div className="flex gap-2">
                                <Textarea
                                    id="prompt-text"
                                    value={promptText}
                                    onChange={(e) => setPromptText(e.target.value)}
                                    placeholder={listening
                                        ? "Hablando... El texto aparecerá aquí automáticamente"
                                        : 'Escribe o dicta: "Quiero las ventas totales del mes pasado en Excel"'}
                                    className="resize-none min-h-[100px] flex-1"
                                    disabled={isGenerating || listening}
                                />
                                <div className="flex flex-col gap-2">
                                    <Button
                                        onClick={toggleRecording}
                                        variant={listening ? "destructive" : "outline"}
                                        size="icon"
                                        disabled={isGenerating}
                                        title={listening ? "Detener grabación de voz" : "Grabar mensaje con voz"}
                                        className={listening ? "animate-pulse" : ""}
                                    >
                                        {listening ? (
                                            <MicOff className="h-4 w-4" />
                                        ) : (
                                            <Mic className="h-4 w-4" />
                                        )}
                                    </Button>
                                    <Button
                                        onClick={handleGenerateWithPrompt}
                                        disabled={!promptText.trim() || isGenerating || listening}
                                        size="icon"
                                        title="Generar reporte con IA"
                                    >
                                        {isGenerating ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Sparkles className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Nota sobre reconocimiento de voz */}
                        {!browserSupportsSpeechRecognition && (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <p className="text-sm text-amber-800">
                                    ⚠️ <strong>Reconocimiento de voz no disponible.</strong> Tu navegador no soporta esta función. Por favor usa Google Chrome. Puedes seguir usando el campo de texto normalmente.
                                </p>
                            </div>
                        )}

                        {/* Instrucciones */}
                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                                <Sparkles className="h-4 w-4" />
                                Ejemplos de Consultas:
                            </h4>
                            <div className="grid gap-2 text-sm text-purple-800">
                                <div>💬 "Quiero las ventas totales del mes pasado en Excel"</div>
                                <div>💬 "Muéstrame los productos más vendidos este mes"</div>
                                <div>💬 "Clientes nuevos del último trimestre"</div>
                                <div>💬 "Pedidos pendientes de la última semana"</div>
                                <div>💬 "Dame el inventario bajo en formato Excel"</div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-purple-200">
                                <p className="text-xs text-purple-700">
                                    💡 <strong>Tip:</strong> Puedes escribir tu consulta o usar el botón 🎤 para dictar con tu voz.
                                </p>
                                <p className="text-xs text-purple-600 mt-1">
                                    🎤 <strong>Reconocimiento de voz:</strong> Requiere Google Chrome y conexión a internet activa.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
