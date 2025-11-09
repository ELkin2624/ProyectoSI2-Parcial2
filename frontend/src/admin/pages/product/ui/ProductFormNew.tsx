import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { AdminTitle } from "@/admin/components/AdminTitle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { Productos, Categoria } from "@/interfaces/productos.interface";
import { getCategoriesAction } from "@/admin/actions/get-categories.action";
import { Loader2, Save, ArrowLeft, Upload, X } from "lucide-react";
import { Link } from "react-router";

interface Props {
    title: string;
    subTitle: string;
    product: Productos;
    isPending: boolean;
    onSubmit: (data: ProductFormData) => Promise<void>;
}

export interface ProductFormData {
    nombre: string;
    descripcion: string;
    categoria: number;
    activo: boolean;
    imagenes?: File[];
    imagenes_urls?: string[]; // URLs de imágenes existentes a mantener
}

export const ProductFormNew = ({ product, subTitle, title, onSubmit, isPending }: Props) => {
    const [selectedCategoryId, setSelectedCategoryId] = useState<number>(product.categoria?.id || 0);
    const [existingImages, setExistingImages] = useState<string[]>(
        product.imagenes_galeria?.map((img: any) => img.imagen_url || img.imagen) || []
    );
    const [newImages, setNewImages] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch
    } = useForm<ProductFormData>({
        defaultValues: {
            nombre: product.nombre || '',
            descripcion: product.descripcion || '',
            categoria: product.categoria?.id || 0,
            activo: product.activo ?? true
        }
    });

    const { data: categories, isLoading: loadingCategories } = useQuery({
        queryKey: ['categories'],
        queryFn: getCategoriesAction,
        staleTime: 1000 * 60 * 5,
    });

    const activo = watch('activo');

    useEffect(() => {
        if (product.categoria?.id) {
            setSelectedCategoryId(product.categoria.id);
            setValue('categoria', product.categoria.id);
        }
    }, [product, setValue]);

    const handleCategoryChange = (value: string) => {
        const categoryId = Number(value);
        setSelectedCategoryId(categoryId);
        setValue('categoria', categoryId);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newFiles = Array.from(files);
        setNewImages(prev => [...prev, ...newFiles]);

        // Crear URLs de preview
        const urls = newFiles.map(file => URL.createObjectURL(file));
        setPreviewUrls(prev => [...prev, ...urls]);
    };

    const removeExistingImage = (index: number) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index));
    };

    const removeNewImage = (index: number) => {
        // Liberar memoria del preview URL
        URL.revokeObjectURL(previewUrls[index]);

        setNewImages(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    };

    const onFormSubmit = async (data: ProductFormData) => {
        if (data.categoria === 0) {
            alert('Por favor selecciona una categoría');
            return;
        }

        // Agregar las imágenes al data
        data.imagenes = newImages;
        data.imagenes_urls = existingImages;

        await onSubmit(data);
    };

    // Función recursiva para aplanar categorías con jerarquía
    const flattenCategories = (cats: Categoria[], level = 0): Array<Categoria & { level: number }> => {
        const result: Array<Categoria & { level: number }> = [];

        cats.forEach(cat => {
            result.push({ ...cat, level });
            if (cat.hijos && cat.hijos.length > 0) {
                result.push(...flattenCategories(cat.hijos, level + 1));
            }
        });

        return result;
    };

    const flatCategories = categories ? flattenCategories(categories) : [];

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <AdminTitle title={title} subtitle={subTitle} />
                <Link to="/admin/products">
                    <Button type="button" variant="outline">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver
                    </Button>
                </Link>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 space-y-6">
                {/* Nombre del Producto */}
                <div className="space-y-2">
                    <Label htmlFor="nombre">
                        Nombre del Producto <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="nombre"
                        {...register("nombre", {
                            required: "El nombre es requerido",
                            minLength: { value: 3, message: "Mínimo 3 caracteres" }
                        })}
                        placeholder="Ej: Camisa Casual Azul"
                        disabled={isPending}
                    />
                    {errors.nombre && (
                        <p className="text-sm text-red-500">{errors.nombre.message}</p>
                    )}
                </div>

                {/* Descripción */}
                <div className="space-y-2">
                    <Label htmlFor="descripcion">
                        Descripción <span className="text-red-500">*</span>
                    </Label>
                    <textarea
                        id="descripcion"
                        {...register("descripcion", {
                            required: "La descripción es requerida",
                            minLength: { value: 10, message: "Mínimo 10 caracteres" }
                        })}
                        placeholder="Describe el producto..."
                        className="w-full min-h-[120px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        disabled={isPending}
                    />
                    {errors.descripcion && (
                        <p className="text-sm text-red-500">{errors.descripcion.message}</p>
                    )}
                </div>

                {/* Categoría */}
                <div className="space-y-2">
                    <Label htmlFor="categoria">
                        Categoría <span className="text-red-500">*</span>
                    </Label>
                    {loadingCategories ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Cargando categorías...
                        </div>
                    ) : (
                        <Select
                            value={selectedCategoryId.toString()}
                            onValueChange={handleCategoryChange}
                            disabled={isPending}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona una categoría" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0" disabled>
                                    Selecciona una categoría
                                </SelectItem>
                                {flatCategories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id.toString()}>
                                        {'\u00A0'.repeat(cat.level * 4)}{cat.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                    {errors.categoria && (
                        <p className="text-sm text-red-500">{errors.categoria.message}</p>
                    )}
                </div>

                {/* Imágenes */}
                <div className="space-y-4">
                    <Label>Imágenes del Producto</Label>

                    {/* Imágenes existentes */}
                    {existingImages.length > 0 && (
                        <div>
                            <p className="text-sm text-muted-foreground mb-2">Imágenes actuales:</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {existingImages.map((url, index) => (
                                    <div key={`existing-${index}`} className="relative group">
                                        <img
                                            src={url}
                                            alt={`Imagen ${index + 1}`}
                                            className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeExistingImage(index)}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            disabled={isPending}
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Previews de nuevas imágenes */}
                    {previewUrls.length > 0 && (
                        <div>
                            <p className="text-sm text-muted-foreground mb-2">Nuevas imágenes a subir:</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {previewUrls.map((url, index) => (
                                    <div key={`new-${index}`} className="relative group">
                                        <img
                                            src={url}
                                            alt={`Nueva imagen ${index + 1}`}
                                            className="w-full h-32 object-cover rounded-lg border-2 border-green-200"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeNewImage(index)}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            disabled={isPending}
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input para agregar imágenes */}
                    <div className="flex items-center gap-2">
                        <Input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageChange}
                            disabled={isPending}
                            className="cursor-pointer"
                            id="images-input"
                        />
                        <Label htmlFor="images-input" className="cursor-pointer">
                            <Button type="button" variant="outline" disabled={isPending} asChild>
                                <span>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Subir Imágenes
                                </span>
                            </Button>
                        </Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Puedes seleccionar múltiples imágenes. Formatos permitidos: JPG, PNG, WEBP
                    </p>
                </div>

                {/* Estado Activo */}
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="activo"
                        checked={activo}
                        onCheckedChange={(checked) => setValue('activo', checked as boolean)}
                        disabled={isPending}
                    />
                    <Label
                        htmlFor="activo"
                        className="text-sm font-normal cursor-pointer"
                    >
                        Producto activo (visible en el catálogo)
                    </Label>
                </div>

                {/* Botón de Envío */}
                <div className="flex justify-end gap-3 pt-4">
                    <Link to="/admin/products">
                        <Button type="button" variant="outline" disabled={isPending}>
                            Cancelar
                        </Button>
                    </Link>
                    <Button type="submit" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2 h-4 w-4" />
                        {product.id === 0 ? 'Crear Producto' : 'Guardar Cambios'}
                    </Button>
                </div>
            </div>

            {/* Información adicional */}
            {product.id === 0 ? (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                        <strong>Nota:</strong> Primero guarda el producto para poder agregar variantes (tallas, colores) y precios.
                    </p>
                </div>
            ) : (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                        <strong>Nota:</strong> Las variantes ahora se pueden gestionar en la sección de abajo.
                        Para gestionar stock y almacenes, usa el admin de Django.
                    </p>
                </div>
            )}
        </form>
    );
};
