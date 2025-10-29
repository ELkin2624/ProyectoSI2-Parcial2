"use client"


import { Button } from "@/components/ui/button"
import { products } from "@/mocks/products.mock"
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react"
import { Link } from "react-router"

interface CartItem {
    id: string
    name: string
    price: number
    image: string
    size: string
    color: string
    quantity: number
}



export const CartPage = () => {
    const items: CartItem[] = [];

    // return (
    //     <div className="min-h-screen bg-background">


    //         {/* Empty Cart */}
    //         <main className="pt-16">
    //             <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
    //                 <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
    //                     <ShoppingCart className="h-24 w-24 text-muted-foreground/30" />
    //                     <h2 className="text-3xl font-light tracking-tight">Tu carrito está vacío</h2>
    //                     <p className="text-muted-foreground">Agrega productos para comenzar tu compra</p>
    //                     <Link to="/">
    //                         <Button size="lg" className="mt-4">
    //                             Explorar Productos
    //                         </Button>
    //                     </Link>
    //                 </div>
    //             </div>
    //         </main>
    //     </div>
    // )
    return (
        <div className="min-h-screen bg-background">


            {/* Cart Content */}
            <main className="pt-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex items-center justify-between">
                                <h1 className="text-4xl font-light tracking-tight">Carrito de Compras</h1>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    // onClick={clearCart}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    Vaciar carrito
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {items.map((item) => (
                                    <div key={item.id} className="flex gap-6 p-6 border border-border bg-card">
                                        {/* Product Image */}
                                        <div className="relative h-32 w-24 flex-shrink-0 bg-muted overflow-hidden">
                                            <img src={item.image || "/placeholder.svg"} alt={item.name} className="object-cover" />
                                        </div>

                                        {/* Product Details */}
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <h3 className="text-lg font-light">{item.name}</h3>
                                                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                                    <p>Color: {item.color}</p>
                                                    <p>Talla: {item.size}</p>
                                                </div>
                                            </div>

                                            {/* Quantity Controls */}
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        // onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="h-8 w-8 border border-border hover:border-foreground transition-colors flex items-center justify-center"
                                                    >
                                                        <Minus className="h-4 w-4" />
                                                    </button>
                                                    <span className="text-sm font-light w-8 text-center">{item.quantity}</span>
                                                    <button
                                                        // onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="h-8 w-8 border border-border hover:border-foreground transition-colors flex items-center justify-center"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Price and Remove */}
                                        <div className="flex flex-col items-end justify-between">
                                            <p className="text-lg font-light">${(item.price * item.quantity).toFixed(2)}</p>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                // onClick={() => removeItem(item.id)}
                                                className="text-muted-foreground hover:text-foreground"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-24 border border-border p-8 space-y-6">
                                <h2 className="text-2xl font-light tracking-tight">Resumen del Pedido</h2>

                                <div className="space-y-4 py-6 border-y border-border">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            {/* Subtotal ({totalItems} {totalItems === 1 ? "artículo" : "artículos"}) */}
                                        </span>
                                        {/* <span className="font-light">${totalPrice.toFixed(2)}</span> */}
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Envío</span>
                                        <span className="font-light">Gratis</span>
                                    </div>
                                </div>

                                <div className="flex justify-between text-xl">
                                    <span className="font-light">Total</span>
                                    {/* <span className="font-light">${totalPrice.toFixed(2)}</span> */}
                                </div>

                                <Button size="lg" className="w-full h-14 text-base font-light tracking-wide uppercase">
                                    Proceder al Pago
                                </Button>

                                <Link to="/">
                                    <Button variant="ghost" size="lg" className="w-full text-sm font-light">
                                        Continuar Comprando
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}


