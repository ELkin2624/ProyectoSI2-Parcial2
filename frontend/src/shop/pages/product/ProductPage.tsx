import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react"
import { useParams } from "react-router"

import { useProduct } from "@/hooks/useProduct"
import { obtenerColores, obtenerInfoPrecioVariante, obtenerTallas } from "@/lib/ObtenerVariantes"
import { useCart } from "@/shop/hooks/useCart"
import { toast } from "sonner"


export const ProductPage = () => {

  const { idSlug } = useParams() || '1';

  // const navigate = useNavigate();


  const { data: product } = useProduct(idSlug as string);
  const { addItemMutation } = useCart();


  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState<string>("")
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)


  if (!product) {
    return <div className="container mx-auto text-center py-20">Producto no encontrado</div>;
  }
  const tallas = obtenerTallas(product);
  const colores = obtenerColores(product);

  // Crear objeto de selección solo con valores no vacíos
  const seleccion: { [key: string]: string } = {};
  if (selectedSize) seleccion.Talla = selectedSize;
  if (selectedColor) seleccion.Color = selectedColor;

  const infoPrecio = obtenerInfoPrecioVariante(product, seleccion)
  // TODO: quitar este state



  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % product.imagenes_galeria.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + product.imagenes_galeria.length) % product.imagenes_galeria.length)
  }

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error('Por favor selecciona una talla');
      return;
    }

    if (!infoPrecio?.variante_id) {
      toast.error('Variante no disponible');
      return;
    }

    // Verificar que la variante tenga stock
    const varianteSeleccionada = product.variantes?.find(v => v.id === infoPrecio.variante_id);
    if (!varianteSeleccionada) {
      toast.error('Variante no encontrada');
      return;
    }

    if (varianteSeleccionada.stock_total <= 0) {
      toast.error('Esta variante no tiene stock disponible');
      return;
    }

    if (quantity > varianteSeleccionada.stock_total) {
      toast.error(`Solo hay ${varianteSeleccionada.stock_total} unidades disponibles`);
      return;
    }

    setIsAdding(true);

    addItemMutation.mutate(
      {
        variante_id: infoPrecio.variante_id,
        cantidad: quantity
      },
      {
        onSuccess: () => {
          toast.success('Producto agregado al carrito');
          setIsAdding(false);
        },
        onError: (error: any) => {
          console.error('Error completo:', error);
          console.error('Response data:', error?.response?.data);
          console.error('Response status:', error?.response?.status);
          console.error('Response headers:', error?.response?.headers);

          const errorData = error?.response?.data;
          let errorMessage = 'Error al agregar al carrito';

          if (errorData) {
            console.log('Estructura del error:', Object.keys(errorData));
            errorMessage = errorData.detail
              || errorData.non_field_errors?.[0]
              || errorData.variante_id?.[0]
              || JSON.stringify(errorData)
              || error?.message;
          }

          toast.error(errorMessage);
          setIsAdding(false);
        }
      }
    );
  }

  return (
    <div className=" bg-background">


      {/* Main Content */}
      <main className="pt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative aspect-3/4 bg-muted overflow-hidden group">
                <img
                  src={product.imagenes_galeria[currentImageIndex]?.imagen_url || product.imagenes_galeria[currentImageIndex]?.imagen || "/placeholder.svg"}
                  alt={product.nombre}
                  className="object-cover"
                />
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>

              {/* Thumbnail Navigation */}
              <div className="grid grid-cols-4 gap-4">
                {product.imagenes_galeria.map((image: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative aspect-3/4 bg-muted overflow-hidden transition-opacity ${currentImageIndex === index
                      ? "opacity-100 ring-1 ring-foreground"
                      : "opacity-60 hover:opacity-100"
                      }`}
                  >
                    <img
                      src={image?.imagen_url || image?.imagen || "/placeholder.svg"}
                      alt={`${product.nombre} view ${index + 1}`}
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="flex flex-col">
              <div className="space-y-6">
                <div>
                  <h2 className="text-4xl lg:text-5xl font-light tracking-tight text-balance">{product.nombre}</h2>
                  {/* <p className="mt-4 text-3xl font-light text-foreground">${product.price.toFixed(2)}</p> */}
                </div>

                <p className="text-base leading-relaxed text-muted-foreground">{product.descripcion}</p>

                {/* Color Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-light tracking-wide uppercase text-foreground">
                    Color: {selectedColor}
                  </label>
                  <div className="flex gap-3">
                    {colores.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => setSelectedColor(color.valor)}
                        className={`h-12 w-12 rounded-full border-2 transition-all ${selectedColor === color.valor
                          ? "border-foreground scale-110"
                          : "border-border hover:border-muted-foreground"
                          }`}
                        style={{ backgroundColor: color.hex }}
                        aria-label={`Select ${color.valor}`}
                      >
                        {color.hex === "#FFFFFF" && (
                          <span className="block h-full w-full rounded-full border border-border" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-light tracking-wide uppercase text-foreground">Talla</label>
                  <div className="grid grid-cols-5 gap-3">
                    {tallas.map((size) => (
                      <button
                        key={size.id}
                        onClick={() => setSelectedSize(size.valor)}
                        className={`py-3 text-sm font-light tracking-wide border transition-all ${selectedSize === size.valor
                          ? "bg-foreground text-background border-foreground"
                          : "bg-background text-foreground border-border hover:border-foreground"
                          }`}
                      >
                        {size.valor}
                      </button>

                    ))}
                  </div>
                </div>

                {/* Size Selection */}
                {
                  infoPrecio
                    ?
                    <div className="space-y-3">
                      <label className="text-sm font-light tracking-wide uppercase text-foreground">Precio: </label>
                      <span>{(Number(infoPrecio.precio) * quantity).toFixed(2)}</span>
                    </div>
                    : ''
                }

                {/* Stock Disponible */}
                {infoPrecio?.variante_id && (() => {
                  const varianteSeleccionada = product.variantes?.find(v => v.id === infoPrecio.variante_id);
                  const stockDisponible = varianteSeleccionada?.stock_total || 0;

                  return (
                    <div className="space-y-2">
                      <label className="text-sm font-light tracking-wide uppercase text-foreground">
                        Stock Disponible
                      </label>
                      <div className="flex items-center gap-2">
                        {stockDisponible > 0 ? (
                          <>
                            <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                            <span className="text-sm text-green-600 font-medium">
                              {stockDisponible} {stockDisponible === 1 ? 'unidad' : 'unidades'} disponibles
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                            <span className="text-sm text-red-600 font-medium">
                              Sin stock
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Quantity */}
                <div className="space-y-3">
                  <label className="text-sm font-light tracking-wide uppercase text-foreground">Cantidad</label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="h-10 w-10 border border-border hover:border-foreground transition-colors"
                    >
                      -
                    </button>
                    <span className="text-lg font-light w-8 text-center">{quantity}</span>
                    <button
                      onClick={() => {
                        const varianteSeleccionada = infoPrecio?.variante_id
                          ? product.variantes?.find(v => v.id === infoPrecio.variante_id)
                          : null;
                        const maxStock = varianteSeleccionada?.stock_total || 0;
                        if (quantity < maxStock) {
                          setQuantity(quantity + 1);
                        }
                      }}
                      className="h-10 w-10 border border-border hover:border-foreground transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <Button
                  size="lg"
                  className="w-full h-14 text-base font-light tracking-wide uppercase"
                  disabled={(infoPrecio ? false : true) || isAdding || (() => {
                    const varianteSeleccionada = infoPrecio?.variante_id
                      ? product.variantes?.find(v => v.id === infoPrecio.variante_id)
                      : null;
                    return (varianteSeleccionada?.stock_total || 0) <= 0;
                  })()}
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {isAdding ? "Agregando...." : "Agregar al Carrito"}
                </Button>

                {!selectedSize && (
                  <p className="text-sm text-muted-foreground text-center">Por favor selecciona una talla</p>
                )}

                {infoPrecio?.variante_id && (() => {
                  const varianteSeleccionada = product.variantes?.find(v => v.id === infoPrecio.variante_id);
                  const stockDisponible = varianteSeleccionada?.stock_total || 0;

                  if (stockDisponible <= 0) {
                    return (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800 text-center">
                          <strong>Lo sentimos.</strong> Esta variante no tiene stock disponible en este momento.
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}

                {!infoPrecio && (
                  <p className="text-sm text-muted-foreground text-center">Stock no disponible</p>
                )}

                {/* Product Details */}
                <div className="pt-8 border-t border-border space-y-3">
                  <h3 className="text-sm font-light tracking-wide uppercase text-foreground">Detalles del Producto</h3>
                  <h4>
                    {product.descripcion}
                  </h4>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {/* <RelatedProducts /> */}
      </main>
    </div>
  )
}
