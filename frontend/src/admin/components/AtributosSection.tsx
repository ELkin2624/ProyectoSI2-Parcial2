import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { useAtributos } from "@/admin/hooks/useAtributos";
import type { Productos } from "@/interfaces/productos.interface";
import { Plus, Settings, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

interface Props {
    product: Productos;
}

export const AtributosSection = ({ product }: Props) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedAtributos, setSelectedAtributos] = useState<number[]>(
        product.atributos?.map(a => a.id) || []
    );
    const [newAtributoNombre, setNewAtributoNombre] = useState("");
    const [newValores, setNewValores] = useState<Record<number, string>>({});

    const queryClient = useQueryClient();

    // Usar el hook personalizado
    const {
        atributos,
        valoresPorAtributo,
        isLoading,
        isMutating,
        createAtributo,
        createValor,
        updateProductoAtributos,
    } = useAtributos();

    const handleToggleAtributo = (atributoId: number) => {
        setSelectedAtributos(prev =>
            prev.includes(atributoId)
                ? prev.filter(id => id !== atributoId)
                : [...prev, atributoId]
        );
    };

    const handleCreateAtributo = async () => {
        if (!newAtributoNombre.trim()) {
            toast.error('Ingresa un nombre para el atributo');
            return;
        }
        const result = await createAtributo.mutateAsync({ nombre: newAtributoNombre });
        setNewAtributoNombre("");
        // Auto-seleccionar el nuevo atributo
        if (result?.id) {
            setSelectedAtributos(prev => [...prev, result.id]);
        }
    };

    const handleCreateValor = async (atributoId: number) => {
        const valorNombre = newValores[atributoId];
        if (!valorNombre?.trim()) {
            toast.error('Ingresa un valor');
            return;
        }
        await createValor.mutateAsync({
            atributo: atributoId,
            valor: valorNombre
        });
        setNewValores(prev => ({ ...prev, [atributoId]: "" }));
    };

    const handleSave = async () => {
        await updateProductoAtributos.mutateAsync({
            productoId: product.id,
            atributosIds: selectedAtributos
        });
        // Invalidar el producto específico para refrescar la UI
        queryClient.invalidateQueries({ queryKey: ['product', product.slug], exact: true });
        setModalOpen(false);
    };

    if (product.id === 0) {
        return null;
    }

    return (
        <>
            <div className="mt-8 bg-white p-8 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-semibold">Atributos del Producto</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Configura los atributos que tendrán las variantes (Talla, Color, etc.)
                        </p>
                    </div>
                    <Button onClick={() => setModalOpen(true)} variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Configurar Atributos
                    </Button>
                </div>

                {product.atributos && product.atributos.length > 0 ? (
                    <div className="flex gap-2 flex-wrap">
                        {product.atributos.map(atributo => (
                            <Badge key={atributo.id} variant="default" className="px-3 py-2">
                                <Check className="h-3 w-3 mr-1" />
                                {atributo.nombre}
                            </Badge>
                        ))}
                    </div>
                ) : (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                            Este producto no tiene atributos configurados. Haz clic en "Configurar Atributos" para comenzar.
                        </p>
                    </div>
                )}
            </div>

            {/* Modal de Configuración */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Configurar Atributos y Valores</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Crear nuevo atributo */}
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="font-semibold mb-3">Crear Nuevo Atributo</h4>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Ej: Talla, Color, Material..."
                                    value={newAtributoNombre}
                                    onChange={(e) => setNewAtributoNombre(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && !createAtributo.isPending && handleCreateAtributo()}
                                    disabled={createAtributo.isPending}
                                />
                                <Button
                                    onClick={handleCreateAtributo}
                                    disabled={createAtributo.isPending || !newAtributoNombre.trim()}
                                >
                                    {createAtributo.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Plus className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Lista de atributos */}
                        {isLoading ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Cargando atributos...
                            </div>
                        ) : atributos && atributos.length > 0 ? (
                            <div className="space-y-4">
                                <Label className="text-base font-semibold">
                                    Selecciona los atributos para este producto:
                                </Label>

                                <Accordion type="multiple" className="w-full">
                                    {atributos.map(atributo => (
                                        <AccordionItem key={atributo.id} value={atributo.id.toString()}>
                                            <AccordionTrigger>
                                                <div className="flex items-center gap-3">
                                                    <Checkbox
                                                        checked={selectedAtributos.includes(atributo.id)}
                                                        onCheckedChange={() => handleToggleAtributo(atributo.id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                    <span className="font-medium">{atributo.nombre}</span>
                                                    <Badge variant="outline">
                                                        {valoresPorAtributo[atributo.id]?.length || 0} valores
                                                    </Badge>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="space-y-3 pt-2 pl-8">
                                                    {/* Valores existentes */}
                                                    <div className="flex flex-wrap gap-2">
                                                        {isLoading ? (
                                                            <span className="text-sm text-muted-foreground">Cargando...</span>
                                                        ) : valoresPorAtributo[atributo.id]?.length > 0 ? (
                                                            valoresPorAtributo[atributo.id].map(valor => (
                                                                <Badge key={valor.id} variant="secondary">
                                                                    {valor.valor}
                                                                </Badge>
                                                            ))
                                                        ) : (
                                                            <span className="text-sm text-muted-foreground">
                                                                No hay valores. Agrega uno abajo.
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Agregar nuevo valor */}
                                                    <div className="flex gap-2">
                                                        <Input
                                                            placeholder="Nuevo valor (Ej: M, Rojo, Algodón...)"
                                                            value={newValores[atributo.id] || ""}
                                                            onChange={(e) => setNewValores(prev => ({
                                                                ...prev,
                                                                [atributo.id]: e.target.value
                                                            }))}
                                                            onKeyPress={(e) =>
                                                                e.key === 'Enter' && !createValor.isPending && handleCreateValor(atributo.id)
                                                            }
                                                            disabled={createValor.isPending}
                                                        />
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleCreateValor(atributo.id)}
                                                            disabled={createValor.isPending || !newValores[atributo.id]?.trim()}
                                                        >
                                                            {createValor.isPending ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <>
                                                                    <Plus className="h-4 w-4 mr-1" />
                                                                    Agregar
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No hay atributos. Crea uno usando el formulario de arriba.
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setModalOpen(false)}
                            disabled={isMutating}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isMutating}
                        >
                            {updateProductoAtributos.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};
