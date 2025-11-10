import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, MicOff, Send, Bot, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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
            content: '¡Hola! Soy tu asistente de reportes con IA. Puedo ayudarte a analizar datos, generar reportes personalizados y responder preguntas sobre tu negocio. ¿En qué puedo ayudarte hoy?',
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
                setInputText(prev => prev + ' ' + transcript);
                setIsRecording(false);
            };

            recognitionInstance.onerror = (event: any) => {
                console.error('Error en reconocimiento de voz:', event.error);
                toast.error('Error al capturar audio. Por favor, intenta de nuevo.');
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
            toast.error('El reconocimiento de voz no está disponible en tu navegador');
            return;
        }

        if (isRecording) {
            recognition.stop();
            setIsRecording(false);
        } else {
            try {
                recognition.start();
                setIsRecording(true);
                toast.info('Escuchando... Habla ahora');
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
            // Llamar al endpoint de IA del microservicio
            const response = await fetch('http://localhost:8001/ia/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mensaje: trimmedText,
                    contexto: 'reportes'
                })
            });

            if (!response.ok) {
                throw new Error('Error al comunicarse con el servidor');
            }

            const data = await response.json();

            // Agregar respuesta del asistente
            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.respuesta || 'Lo siento, no pude procesar tu solicitud.',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Error al enviar mensaje:', error);

            // Respuesta de error
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Lo siento, hubo un error al procesar tu solicitud. Por favor, intenta de nuevo.',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, errorMessage]);
            toast.error('Error al comunicarse con el asistente de IA');
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
                                    <div className="flex-shrink-0">
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
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                            <User className="h-4 w-4 text-gray-600" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-3 justify-start">
                                <div className="flex-shrink-0">
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
                    <div className="flex gap-2">
                        <Textarea
                            ref={textareaRef}
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Escribe tu pregunta o haz clic en el micrófono para hablar..."
                            className="resize-none min-h-[60px]"
                            disabled={isLoading || isRecording}
                        />
                        <div className="flex flex-col gap-2">
                            <Button
                                onClick={toggleRecording}
                                variant={isRecording ? "destructive" : "outline"}
                                size="icon"
                                disabled={isLoading}
                                title={isRecording ? "Detener grabación" : "Grabar voz"}
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
                    <p className="text-xs text-muted-foreground mt-2">
                        💡 Tip: Presiona Enter para enviar, Shift+Enter para nueva línea
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};
