import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { getValoresAtributosAction } from "@/admin/actions/get-valores-atributos.action";
import type { Variante, Valore } from "@/interfaces/productos.interface";
import { Loader2, X } from "lucide-react";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: VarianteFormData) => void;
    variante?: Variante | null;
    atributosProducto: number[]; // IDs de atributos que usa el producto
    isPending?: boolean; // Estado de carga
}

export interface VarianteFormData {
    precio: string;
    precio_oferta?: string;
    stock_inicial?: string;
    activo: boolean;
    valores_ids: number[];
}

export const VarianteModal = ({
    open,
    onOpenChange,
    onSubmit,
    variante,
    atributosProducto,
    isPending = false
}: Props) => {
    const [selectedValores, setSelectedValores] = useState<number[]>(
        variante?.valores?.map(v => v.id) || []
    );

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue
    } = useForm<VarianteFormData>({
        defaultValues: {
            precio: variante?.precio || '',
            precio_oferta: variante?.precio_oferta || '',
            stock_inicial: variante?.stock_total?.toString() || '0',
            activo: variante?.activo ?? true,
            valores_ids: variante?.valores?.map(v => v.id) || []
        }
    });

    // Cargar valores de atributos
    const { data: valoresAtributos, isLoading } = useQuery({
        queryKey: ['valores-atributos'],
        queryFn: getValoresAtributosAction,
        staleTime: 1000 * 60 * 5,
    });

    // Filtrar solo los valores de los atributos que usa este producto
    const valoresFiltrados = valoresAtributos?.filter(valor =>
        atributosProducto.includes(valor.atributo.id)
    ) || [];

    // Agrupar por atributo
    const valoresPorAtributo = valoresFiltrados.reduce((acc, valor) => {
        const atributoNombre = valor.atributo.nombre;
        if (!acc[atributoNombre]) {
            acc[atributoNombre] = [];
        }
        acc[atributoNombre].push(valor);
        return acc;
    }, {} as Record<string, Valore[]>);

    useEffect(() => {
        if (variante) {
            reset({
                precio: variante.precio,
                precio_oferta: variante.precio_oferta || '',
                stock_inicial: variante.stock_total?.toString() || '0',
                activo: variante.activo,
                valores_ids: variante.valores.map(v => v.id)
            });
            setSelectedValores(variante.valores.map(v => v.id));
        } else {
            reset({
                precio: '',
                precio_oferta: '',
                stock_inicial: '0',
                activo: true,
                valores_ids: []
            });
            setSelectedValores([]);
        }
    }, [variante, reset, open]);

    const toggleValor = (valorId: number) => {
        setSelectedValores(prev => {
            const newSelected = prev.includes(valorId)
                ? prev.filter(id => id !== valorId)
                : [...prev, valorId];
            setValue('valores_ids', newSelected);
            return newSelected;
        });
    };

    const handleFormSubmit = (data: VarianteFormData) => {
        if (selectedValores.length === 0) {
            alert('Debes seleccionar al menos un valor de atributo (talla, color, etc.)');
            return;
        }
        onSubmit({ ...data, valores_ids: selectedValores });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {variante ? 'Editar Variante' : 'Crear Nueva Variante'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                    {/* Precio */}
                    <div className="space-y-2">
                        <Label htmlFor="precio">
                            Precio <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="precio"
                            type="number"
                            step="0.01"
                            {...register("precio", {
                                required: "El precio es requerido",
                                min: { value: 0, message: "El precio debe ser mayor a 0" }
                            })}
                            placeholder="Ej: 150.00"
                        />
                        {errors.precio && (
                            <p className="text-sm text-red-500">{errors.precio.message}</p>
                        )}
                    </div>

                    {/* Precio Oferta */}
                    <div className="space-y-2">
                        <Label htmlFor="precio_oferta">Precio de Oferta (Opcional)</Label>
                        <Input
                            id="precio_oferta"
                            type="number"
                            step="0.01"
                            {...register("precio_oferta", {
                                min: { value: 0, message: "El precio debe ser mayor a 0" }
                            })}
                            placeholder="Ej: 120.00"
                        />
                        {errors.precio_oferta && (
                            <p className="text-sm text-red-500">{errors.precio_oferta.message}</p>
                        )}
                    </div>

                    {/* Stock Inicial */}
                    <div className="space-y-2">
                        <Label htmlFor="stock_inicial">
                            Stock Inicial {!variante && <span className="text-red-500">*</span>}
                        </Label>
                        <Input
                            id="stock_inicial"
                            type="number"
                            {...register("stock_inicial", {
                                min: { value: 0, message: "El stock debe ser mayor o igual a 0" }
                            })}
                            placeholder="Ej: 10"
                            disabled={!!variante}
                        />
                        {variante && (
                            <p className="text-xs text-muted-foreground">
                                Para modificar el stock, usa la sección de inventario
                            </p>
                        )}
                        {errors.stock_inicial && (
                            <p className="text-sm text-red-500">{errors.stock_inicial.message}</p>
                        )}
                    </div>

                    {/* Atributos (Tallas, Colores, etc.) */}
                    <div className="space-y-4">
                        <Label>
                            Atributos de la Variante <span className="text-red-500">*</span>
                        </Label>

                        {isLoading ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Cargando atributos...
                            </div>
                        ) : Object.keys(valoresPorAtributo).length === 0 ? (
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                                <p className="text-sm text-yellow-800">
                                    Este producto no tiene atributos configurados. Debes agregar atributos
                                    (como Talla, Color) al producto desde el admin de Django primero.
                                </p>
                            </div>
                        ) : (
                            Object.entries(valoresPorAtributo).map(([atributoNombre, valores]) => (
                                <div key={atributoNombre} className="space-y-2">
                                    <Label className="text-sm font-semibold">{atributoNombre}</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {valores.map(valor => (
                                            <Badge
                                                key={valor.id}
                                                variant={selectedValores.includes(valor.id) ? "default" : "outline"}
                                                className="cursor-pointer hover:opacity-80 transition-opacity px-3 py-2"
                                                onClick={() => toggleValor(valor.id)}
                                            >
                                                {valor.valor}
                                                {selectedValores.includes(valor.id) && (
                                                    <X className="ml-1 h-3 w-3" />
                                                )}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}

                        {selectedValores.length > 0 && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                                <p className="text-sm text-blue-800">
                                    <strong>Seleccionados:</strong> {
                                        valoresFiltrados
                                            .filter(v => selectedValores.includes(v.id))
                                            .map(v => `${v.atributo.nombre}: ${v.valor}`)
                                            .join(', ')
                                    }
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Estado Activo */}
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="activo"
                            checked={variante?.activo ?? true}
                            onCheckedChange={(checked) => setValue('activo', checked as boolean)}
                        />
                        <Label htmlFor="activo" className="text-sm font-normal cursor-pointer">
                            Variante activa (disponible para venta)
                        </Label>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isPending}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {variante ? 'Guardar Cambios' : 'Crear Variante'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
