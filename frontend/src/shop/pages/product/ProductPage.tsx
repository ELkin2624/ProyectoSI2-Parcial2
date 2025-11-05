import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react"
import { useParams } from "react-router"

import { useProduct } from "@/hooks/useProduct"



export const ProductPage = () => {

  const { idSlug } = useParams() || '1';

  // const navigate = useNavigate();


  const { data: product } = useProduct(idSlug as string);



  const [selectedSize, setSelectedSize] = useState<string>("")
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)

  // TODO: quitar este state


  if (!product) {
    return <div className="container mx-auto text-center py-20">Producto no encontrado</div>;
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % product.images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length)
  }

  const handleAddToCart = () => {
    if (!selectedSize) return

    setIsAdding(true)

    setTimeout(() => {
      setIsAdding(false)
      setQuantity(1)
      // openCart()
    }, 500)
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
                  src={product.images[currentImageIndex] || "/placeholder.svg"}
                  alt={product.title}
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
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative aspect-3/4 bg-muted overflow-hidden transition-opacity ${currentImageIndex === index
                      ? "opacity-100 ring-1 ring-foreground"
                      : "opacity-60 hover:opacity-100"
                      }`}
                  >
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`${product.title} view ${index + 1}`}
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
                  <h2 className="text-4xl lg:text-5xl font-light tracking-tight text-balance">{product.title}</h2>
                  <p className="mt-4 text-3xl font-light text-foreground">${product.price.toFixed(2)}</p>
                </div>

                <p className="text-base leading-relaxed text-muted-foreground">{product.description}</p>

                {/* Color Selection */}
                {/* <div className="space-y-3">
                  <label className="text-sm font-light tracking-wide uppercase text-foreground">
                    Color: {selectedColor}
                  </label>
                  <div className="flex gap-3">
                    {product.colors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setSelectedColor(color.name)}
                        className={`h-12 w-12 rounded-full border-2 transition-all ${selectedColor === color.name
                          ? "border-foreground scale-110"
                          : "border-border hover:border-muted-foreground"
                          }`}
                        style={{ backgroundColor: color.hex }}
                        aria-label={`Select ${color.name}`}
                      >
                        {color.hex === "#FFFFFF" && (
                          <span className="block h-full w-full rounded-full border border-border" />
                        )}
                      </button>
                    ))}
                  </div>
                </div> */}

                {/* Size Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-light tracking-wide uppercase text-foreground">Talla</label>
                  <div className="grid grid-cols-5 gap-3">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`py-3 text-sm font-light tracking-wide border transition-all ${selectedSize === size
                          ? "bg-foreground text-background border-foreground"
                          : "bg-background text-foreground border-border hover:border-foreground"
                          }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

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
                      onClick={() => setQuantity(quantity + 1)}
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
                  disabled={!selectedSize || isAdding}
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {isAdding ? "Agregado ✓" : "Agregar al Carrito"}
                </Button>

                {!selectedSize && (
                  <p className="text-sm text-muted-foreground text-center">Por favor selecciona una talla</p>
                )}

                {/* Product Details */}
                <div className="pt-8 border-t border-border space-y-3">
                  <h3 className="text-sm font-light tracking-wide uppercase text-foreground">Detalles del Producto</h3>
                  <h4>
                    {product.description}
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
