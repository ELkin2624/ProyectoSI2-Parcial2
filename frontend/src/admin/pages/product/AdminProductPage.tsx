
import { useEffect } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { useProduct } from '@/hooks/useProduct';
import { ProductFormNew, type ProductFormData } from './ui/ProductFormNew';
import { VariantesSection } from '@/admin/components/VariantesSection';
import { AtributosSection } from '@/admin/components/AtributosSection';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';



export const AdminProductPage = () => {

    const { slug } = useParams();
    const navigate = useNavigate();

    const {
        data: product,
        isLoading,
        isError,
        mutation
    } = useProduct(slug || '');

    // Debug: Log cuando cambia el producto
    useEffect(() => {
        if (product) {
            console.log('Producto cargado:', {
                id: product.id,
                nombre: product.nombre,
                variantes: product.variantes?.length || 0,
                atributos: product.atributos?.length || 0
            });

            if (product.variantes) {
                console.log('Variantes detalle:', product.variantes.map(v => ({
                    id: v.id,
                    sku: v.sku,
                    stock_total: v.stock_total,
                    valores: v.valores.map(val => `${val.atributo.nombre}: ${val.valor}`).join(', ')
                })));
            }
        }
    }, [product]);


    const title = slug === 'new' ? 'Nuevo producto' : 'Editar producto';
    const subtitle =
        slug === 'new'
            ? 'Completa la información básica del producto.'
            : 'Modifica la información del producto.';

    const handleSubmit = async (formData: ProductFormData) => {
        try {
            await mutation.mutateAsync(formData);

            toast.success(
                slug === 'new' ? 'Producto creado exitosamente' : 'Producto actualizado correctamente',
                { position: 'top-right' }
            );

            navigate('/admin/products');
        } catch (error: any) {
            console.error('Error completo:', error);
            console.error('Response data:', error?.response?.data);

            // Extraer mensaje de error más específico
            let errorMessage = 'Error al guardar el producto';

            if (error?.response?.data) {
                const errorData = error.response.data;

                // Si hay errores de validación de campos
                if (typeof errorData === 'object' && !errorData.detail) {
                    const errors = Object.entries(errorData).map(([key, value]) => {
                        if (Array.isArray(value)) {
                            return `${key}: ${value.join(', ')}`;
                        }
                        return `${key}: ${value}`;
                    }).join('\n');
                    errorMessage = errors || errorMessage;
                } else if (errorData.detail) {
                    errorMessage = errorData.detail;
                } else if (errorData.nombre) {
                    errorMessage = Array.isArray(errorData.nombre)
                        ? errorData.nombre.join(', ')
                        : errorData.nombre;
                }
            }

            toast.error(errorMessage, { duration: 5000 });
        }
    }




    if (isError && slug !== 'new') {
        return <Navigate to={'/admin/products'} />
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!product && slug !== 'new') {
        return <Navigate to={'/admin/products'} />
    }

    return (
        <>
            <ProductFormNew
                title={title}
                subTitle={subtitle}
                product={product!}
                onSubmit={handleSubmit}
                isPending={mutation.isPending}
            />

            {/* Sección de Atributos - Solo mostrar si el producto ya existe */}
            {product && product.id !== 0 && (
                <AtributosSection product={product} />
            )}

            {/* Sección de Variantes - Solo mostrar si el producto ya existe */}
            {product && product.id !== 0 && (
                <VariantesSection product={product} />
            )}
        </>
    );

};