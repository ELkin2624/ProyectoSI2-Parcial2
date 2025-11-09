import { Button } from '@/components/ui/button'
import { Grid, List } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { Link, useSearchParams } from 'react-router';
import type { Productos } from '@/interfaces/productos.interface';


interface Props {
    products: Productos[];
}

export const ProductsGrid = ({ products: productos }: Props) => {


    // const [showFilters, setShowFilters] = useState(false)

    const [searchParams, setSearchParams] = useSearchParams();

    const viewMode = searchParams.get('viewMode') || 'grid';

    const handleViewModeChange = (mode: 'grid' | 'list') => {
        searchParams.set('viewMode', mode);
        setSearchParams(searchParams);
    }

    const query = searchParams.get('query') || undefined;


    return (
        <>
            <section className="py-12 px-4 lg:px-8">
                <div className="container mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-3xl font-light">Productos</h2>
                            <span className="text-muted-foreground">({productos.length} productos)</span>
                        </div>

                        <div className="flex items-center space-x-2">

                            <div className="hidden md:flex border rounded-md">
                                <Button
                                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => handleViewModeChange('grid')}
                                    className="rounded-r-none"
                                >
                                    <Grid className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => handleViewModeChange('list')}
                                    className="rounded-l-none"
                                >
                                    <List className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-8">

                        {/* Products Grid */}
                        <div className="flex-1">
                            <div
                                className={
                                    viewMode === 'grid'
                                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                                        : "space-y-4"
                                }
                            >

                                {query ?
                                    productos.map((product) => {

                                        const lowerName = product.nombre.toLowerCase();
                                        const lowerQuery = query.toLowerCase();

                                        // Obtener la imagen principal o la primera disponible
                                        const imagenPrincipal = product.imagenes_galeria?.find((img: any) => img.es_principal)
                                            || product.imagenes_galeria?.[0];
                                        const imageUrl = imagenPrincipal?.imagen_url || imagenPrincipal?.imagen || '/placeholder.svg';

                                        if (lowerName.includes(lowerQuery))
                                            return (
                                                <Link to={`/product/${product.slug}`} key={product.id}>
                                                    <ProductCard
                                                        key={product.id}
                                                        id={product.id.toString()}
                                                        name={product.nombre}
                                                        image={imageUrl}
                                                        category={product.categoria.nombre}
                                                    // sizes={ product.}
                                                    />
                                                </Link>
                                            );

                                        return;
                                    }
                                    )
                                    :
                                    productos.map((product) => {
                                        // Obtener la imagen principal o la primera disponible
                                        const imagenPrincipal = product.imagenes_galeria?.find((img: any) => img.es_principal)
                                            || product.imagenes_galeria?.[0];
                                        const imageUrl = imagenPrincipal?.imagen_url || imagenPrincipal?.imagen || '/placeholder.svg';

                                        return (
                                            <Link to={`/product/${product.slug}`} key={product.id}>
                                                <ProductCard
                                                    key={product.id}
                                                    id={product.id.toString()}
                                                    name={product.nombre}
                                                    image={imageUrl}
                                                    category={product.categoria.nombre}
                                                // sizes={ product.}
                                                />
                                            </Link>
                                        );
                                    })
                                }

                            </div>

                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}
