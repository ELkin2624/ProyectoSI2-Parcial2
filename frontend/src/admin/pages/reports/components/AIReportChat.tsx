import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, MicOff, Send, Bot, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { generarReporteIA, descargarArchivo } from '@/admin/actions/reportes.action';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export const AIReportChat = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: `¡Hola! 👋 Soy tu asistente de reportes con IA. Puedo ayudarte a generar reportes personalizados usando lenguaje natural.

📊 **Ejemplos de consultas:**
• "Quiero las ventas totales del mes pasado en Excel"
• "Muéstrame los productos más vendidos este mes"
• "Clientes nuevos del último trimestre"
• "Pedidos pendientes de la última semana"
• "Dame el inventario bajo en formato Excel"

💡 Especifica el período (mes pasado, este mes, última semana) y el formato (Excel o JSON). ¿Qué reporte necesitas?`,
            timestamp: new Date()
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [recognition, setRecognition] = useState<any>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Inicializar Web Speech API
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            const recognitionInstance = new SpeechRecognition();

            recognitionInstance.continuous = false;
            recognitionInstance.interimResults = false;
            recognitionInstance.lang = 'es-ES';

            recognitionInstance.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                const confidence = event.results[0][0].confidence;

                // Agregar el texto transcrito
                setInputText(prev => {
                    const newText = prev.trim() ? prev + ' ' + transcript : transcript;
                    return newText;
                });

                setIsRecording(false);

                toast.success('✅ Texto transcrito', {
                    description: `Confianza: ${(confidence * 100).toFixed(0)}%`,
                    duration: 2000
                });
            };

            recognitionInstance.onerror = (event: any) => {
                console.error('Error en reconocimiento de voz:', event.error);

                let errorMessage = 'Error al capturar audio';
                if (event.error === 'no-speech') {
                    errorMessage = 'No se detectó ningún audio. Intenta hablar más cerca del micrófono.';
                } else if (event.error === 'network') {
                    errorMessage = 'Error de red. Verifica tu conexión.';
                } else if (event.error === 'not-allowed') {
                    errorMessage = 'Permiso denegado. Habilita el acceso al micrófono.';
                }

                toast.error(errorMessage);
                setIsRecording(false);
            };

            recognitionInstance.onend = () => {
                setIsRecording(false);
            };

            setRecognition(recognitionInstance);
        } else {
            console.warn('Web Speech API no está soportada en este navegador');
        }
    }, []);

    // Auto-scroll al final cuando hay nuevos mensajes
    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollElement) {
                scrollElement.scrollTop = scrollElement.scrollHeight;
            }
        }
    }, [messages]);

    const toggleRecording = () => {
        if (!recognition) {
            toast.error('El reconocimiento de voz no está disponible en tu navegador', {
                description: 'Por favor usa Google Chrome para mejor compatibilidad'
            });
            return;
        }

        if (isRecording) {
            recognition.stop();
            setIsRecording(false);
            toast.success('Grabación detenida');
        } else {
            try {
                recognition.start();
                setIsRecording(true);
                toast.info('🎤 Escuchando...', {
                    description: 'Habla ahora. Tu voz será convertida a texto.',
                    duration: 3000
                });
            } catch (error) {
                console.error('Error al iniciar reconocimiento:', error);
                toast.error('No se pudo iniciar el reconocimiento de voz');
            }
        }
    };

    const sendMessage = async () => {
        const trimmedText = inputText.trim();
        if (!trimmedText || isLoading) return;

        // Agregar mensaje del usuario
        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: trimmedText,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        try {
            // Usar la acción centralizada que llama al backend de Django
            const result = await generarReporteIA({ prompt: trimmedText });

            if (result.isFile) {
                // Es un archivo Excel, descargarlo
                descargarArchivo(
                    result.data,
                    result.fileName || `reporte_${Date.now()}.xlsx`
                );

                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: '✅ He generado tu reporte en formato Excel. La descarga debería iniciar automáticamente. El reporte contiene los datos solicitados organizados en hojas de cálculo listas para análisis.',
                    timestamp: new Date()
                };

                setMessages(prev => [...prev, assistantMessage]);
                toast.success('Reporte descargado exitosamente');
            } else {
                // Es JSON con datos
                const data = result.data;

                // Formatear la respuesta de manera legible
                let responseContent = '';

                if (data.data && Array.isArray(data.data)) {
                    responseContent += `📊 **Reporte de ${data.metric || 'datos'}**\n\n`;
                    responseContent += `📈 Total de registros: ${data.count}\n\n`;

                    // Mostrar los primeros 5 registros como ejemplo
                    if (data.count > 0) {
                        responseContent += `**Primeros resultados:**\n\n`;
                        data.data.slice(0, 5).forEach((item: any, index: number) => {
                            responseContent += `${index + 1}. ${JSON.stringify(item, null, 2)}\n`;
                        });

                        if (data.count > 5) {
                            responseContent += `\n... y ${data.count - 5} registros más.\n`;
                        }

                        responseContent += `\n💡 *Tip: Si deseas descargar estos datos en Excel, especifica "en formato excel" en tu solicitud.*`;
                    } else {
                        responseContent += '⚠️ No se encontraron registros para los criterios especificados.';
                    }
                } else {
                    responseContent = JSON.stringify(data, null, 2);
                }

                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: responseContent,
                    timestamp: new Date()
                };

                setMessages(prev => [...prev, assistantMessage]);
                toast.success('Reporte generado exitosamente');
            }
        } catch (error) {
            console.error('Error al enviar mensaje:', error);

            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: error instanceof Error
                    ? `❌ ${error.message}`
                    : 'Lo siento, hubo un error al procesar tu solicitud. Por favor, intenta de nuevo.',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, errorMessage]);

            const toastMessage = error instanceof Error ? error.message : 'Error al comunicarse con el asistente de IA';
            toast.error(toastMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <Card className="h-[600px] flex flex-col">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-blue-600" />
                    <div>
                        <CardTitle>Asistente de Reportes con IA</CardTitle>
                        <CardDescription>
                            Escribe o habla para obtener análisis e insights de tus datos
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
                {/* Área de mensajes */}
                <ScrollArea ref={scrollAreaRef} className="flex-1 px-6 py-4">
                    <div className="space-y-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'
                                    }`}
                            >
                                {message.role === 'assistant' && (
                                    <div className="shrink-0">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                            <Bot className="h-4 w-4 text-blue-600" />
                                        </div>
                                    </div>
                                )}

                                <div
                                    className={`rounded-lg px-4 py-2 max-w-[80%] ${message.role === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-900'
                                        }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                    <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                                        }`}>
                                        {message.timestamp.toLocaleTimeString('es-ES', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>

                                {message.role === 'user' && (
                                    <div className="shrink-0">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                            <User className="h-4 w-4 text-gray-600" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-3 justify-start">
                                <div className="shrink-0">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                        <Bot className="h-4 w-4 text-blue-600" />
                                    </div>
                                </div>
                                <div className="rounded-lg px-4 py-2 bg-gray-100">
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                                        <span className="text-sm text-gray-600">Pensando...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Área de input */}
                <div className="border-t p-4">
                    {/* Indicador de grabación */}
                    {isRecording && (
                        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 animate-pulse">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span className="text-sm text-red-700 font-medium">
                                🎤 Grabando... Habla ahora
                            </span>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Textarea
                                ref={textareaRef}
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder={isRecording
                                    ? "Hablando... El texto aparecerá aquí automáticamente"
                                    : "Escribe tu consulta aquí o usa el micrófono 🎤 para hablar..."}
                                className="resize-none min-h-[60px]"
                                disabled={isLoading || isRecording}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Button
                                onClick={toggleRecording}
                                variant={isRecording ? "destructive" : "outline"}
                                size="icon"
                                disabled={isLoading}
                                title={isRecording ? "Detener grabación de voz" : "Grabar mensaje con voz"}
                                className={isRecording ? "animate-pulse" : ""}
                            >
                                {isRecording ? (
                                    <MicOff className="h-4 w-4" />
                                ) : (
                                    <Mic className="h-4 w-4" />
                                )}
                            </Button>
                            <Button
                                onClick={sendMessage}
                                disabled={!inputText.trim() || isLoading || isRecording}
                                size="icon"
                                title="Enviar mensaje"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground">
                            💡 <strong>Escribe</strong> tu consulta o usa el <strong>micrófono 🎤</strong> para convertir voz a texto
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Enter = Enviar | Shift+Enter = Nueva línea
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
