import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  Search,
  User,
  Heart,
  ShoppingCart,
  Bell,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function App() {
  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [favorites, setFavorites] = useState(new Set());
  const [cart, setCart] = useState([]);

  // Sample data (replace with API data)
  const products = useMemo(
    () => [
      { id: 1, name: "Vestido Boho Flores", price: 59.9, img: "https://images.unsplash.com/photo-1520975911208-6e9f1f4b547a?q=80&w=800&auto=format&fit=crop&crop=faces" , category: "Vestidos"},
      { id: 2, name: "Blusa Seda Beige", price: 39.5, img: "https://images.unsplash.com/photo-1520975911208-6e9f1f4b547a?q=80&w=801&auto=format&fit=crop&crop=faces" , category: "Blusas"},
      { id: 3, name: "Bolso Cuero Clásico", price: 120, img: "https://images.unsplash.com/photo-1526178615406-50f0f6f9f6e5?q=80&w=802&auto=format&fit=crop&crop=faces" , category: "Accesorios"},
      { id: 4, name: "Falda Línea A", price: 45, img: "https://images.unsplash.com/photo-1520975928881-6b5f7a6a1d96?q=80&w=803&auto=format&fit=crop&crop=faces" , category: "Faldas"},
      { id: 5, name: "Chaqueta Denim", price: 89, img: "https://images.unsplash.com/photo-1520975911208-6e9f1f4b547a?q=80&w=804&auto=format&fit=crop&crop=faces" , category: "Chaquetas"},
      { id: 6, name: "Sandalias Minimal", price: 35, img: "https://images.unsplash.com/photo-1526178615406-50f0f6f9f6e5?q=80&w=805&auto=format&fit=crop&crop=faces" , category: "Calzado"},
    ],
    []
  );

  const categories = ["All", "Vestidos", "Blusas", "Accesorios", "Faldas", "Chaquetas", "Calzado"];

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = category === "All" || p.category === category;
      const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [products, category, query]);

  // handlers
  const toggleFavorite = (id) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addToCart = (product) => {
    setCart((prev) => [...prev, { ...product, qty: 1 }]);
    setCartOpen(true);
  };

  const removeFromCart = (index) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const subtotal = useMemo(() => cart.reduce((s, it) => s + it.price * it.qty, 0), [cart]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 antialiased">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <button
              className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 md:hidden"
              aria-label="Abrir menú lateral"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>

            <a href="#" className="flex items-center gap-3 mr-4">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-400 rounded-lg flex items-center justify-center text-white font-semibold">B</div>
              <span className="sr-only">Boutique</span>
              <span className="hidden sm:inline-block font-semibold text-lg">Boutique & Co.</span>
            </a>

            {/* Search */}
            <div className="flex-1">
              <label className="relative block">
                <span className="sr-only">Buscar productos</span>
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search size={18} />
                </span>
                <input
                  className="w-full border border-transparent focus:border-indigo-300 focus:ring-0 rounded-md py-2 pl-10 pr-4 bg-white/60 placeholder-gray-400 shadow-sm"
                  placeholder="Busca vestidos, accesorios y más..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
            </div>

            {/* Actions */}
            <nav className="flex items-center gap-2 ml-4">
              <button className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" aria-label="Notificaciones">
                <Bell size={18} />
              </button>

              <button className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" aria-label="Favoritos">
                <Heart size={18} />
              </button>

              <button
                className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 relative"
                aria-label="Carrito"
                onClick={() => setCartOpen(true)}
              >
                <ShoppingCart size={18} />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs rounded-full px-1.5">{cart.length}</span>
                )}
              </button>

              <button className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" aria-label="Perfil">
                <User size={18} />
              </button>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
          {/* Sidebar - desktop */}
          <aside className="hidden md:block">
            <nav aria-label="Categorías" className="sticky top-24 bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-3">Categorías</h3>
              <ul className="space-y-2">
                {categories.map((c) => (
                  <li key={c}>
                    <button
                      onClick={() => setCategory(c)}
                      className={`w-full text-left rounded-md px-3 py-2 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${c === category ? 'bg-indigo-50 font-medium' : ''}`}
                    >
                      {c}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            <section className="mt-4 bg-white rounded-2xl p-4 shadow-sm">
              <h4 className="text-sm font-semibold mb-2">Filtros</h4>
              <p className="text-xs text-gray-500">Tallas, colores y rango de precio (ejemplo)</p>
              {/* Simple visual placeholder for filters */}
              <div className="mt-3 space-y-2">
                <input type="range" min="0" max="200" className="w-full" aria-label="Rango de precio" />
                <div className="flex gap-2 text-xs">
                  <button className="px-2 py-1 rounded-md bg-gray-100">S</button>
                  <button className="px-2 py-1 rounded-md bg-gray-100">M</button>
                  <button className="px-2 py-1 rounded-md bg-gray-100">L</button>
                </div>
              </div>
            </section>
          </aside>

          {/* Main content */}
          <main>
            {/* Mobile sidebar (overlay) */}
            <AnimatePresence>
              {sidebarOpen && (
                <motion.aside
                  initial={{ x: -320, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -320, opacity: 0 }}
                  className="fixed inset-y-0 left-0 z-50 w-72 bg-white p-4 shadow-lg md:hidden"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-400 rounded flex items-center justify-center text-white">B</div>
                      <h4 className="text-lg font-semibold">Boutique</h4>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} aria-label="Cerrar menú">
                      <X />
                    </button>
                  </div>

                  <nav aria-label="Categorías móviles">
                    <ul className="space-y-2">
                      {categories.map((c) => (
                        <li key={c}>
                          <button
                            onClick={() => {
                              setCategory(c);
                              setSidebarOpen(false);
                            }}
                            className={`w-full text-left rounded-md px-3 py-2 hover:bg-gray-50 ${c === category ? 'bg-indigo-50 font-medium' : ''}`}
                          >
                            {c}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </motion.aside>
              )}
            </AnimatePresence>

            {/* Hero / breadcrumbs */}
            <section className="mb-6">
              <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-white p-6 shadow-sm overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold">Descubre la nueva colección</h1>
                    <p className="text-sm text-gray-600">Prendas seleccionadas para una experiencia elegante y cómoda.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="px-4 py-2 rounded-lg bg-white border shadow-sm hover:shadow-md">Ver novedades</button>
                    <button className="px-4 py-2 rounded-lg bg-rose-500 text-white hover:opacity-95">Ofertas</button>
                  </div>
                </div>
              </div>
            </section>

            {/* Product grid */}
            <section aria-label="Resultados de búsqueda">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Resultados ({filtered.length})</h2>
                <div className="text-sm text-gray-500">Ordenar por: <span className="font-medium">Relevancia</span></div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filtered.map((p) => (
                  <article key={p.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transform hover:-translate-y-1 transition-all">
                    <div className="relative">
                      <img src={p.img} alt={p.name} className="object-cover w-full h-44 sm:h-48" />
                      <button
                        onClick={() => toggleFavorite(p.id)}
                        className="absolute top-3 right-3 bg-white/70 p-2 rounded-full backdrop-blur-sm hover:bg-white focus:outline-none"
                        aria-pressed={favorites.has(p.id)}
                        aria-label={`Favorito ${p.name}`}
                      >
                        <Heart size={16} className={`${favorites.has(p.id) ? 'text-rose-500' : ''}`} />
                      </button>
                    </div>

                    <div className="p-3">
                      <h3 className="text-sm font-medium truncate">{p.name}</h3>
                      <p className="text-sm text-gray-500">{p.category}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-lg font-semibold">${p.price.toFixed(2)}</div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => addToCart(p)} className="px-3 py-1 rounded-md bg-indigo-600 text-white text-sm hover:opacity-95">Agregar</button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* Pagination mockup */}
              <div className="mt-6 flex items-center justify-center gap-2">
                <button className="p-2 rounded-md hover:bg-gray-100" aria-label="Anterior"><ChevronLeft /></button>
                <div className="flex gap-1">
                  <button className="px-3 py-1 rounded-md bg-indigo-50">1</button>
                  <button className="px-3 py-1 rounded-md hover:bg-gray-100">2</button>
                  <button className="px-3 py-1 rounded-md hover:bg-gray-100">3</button>
                </div>
                <button className="p-2 rounded-md hover:bg-gray-100" aria-label="Siguiente"><ChevronRight /></button>
              </div>
            </section>

            <footer className="mt-10 text-center text-sm text-gray-500">© {new Date().getFullYear()} Boutique & Co. — Todos los derechos reservados</footer>
          </main>
        </div>
      </div>

      {/* Cart drawer */}
      <AnimatePresence>
        {cartOpen && (
          <motion.aside
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white p-4 shadow-2xl"
            aria-label="Carrito de compra"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Tu carrito</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setCartOpen(false)} aria-label="Cerrar carrito"><X /></button>
              </div>
            </div>

            <div className="space-y-4">
              {cart.length === 0 ? (
                <div className="text-center text-gray-500 py-12">Tu carrito está vacío.</div>
              ) : (
                cart.map((it, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <img src={it.img} alt={it.name} className="w-16 h-16 object-cover rounded-md" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{it.name}</div>
                      <div className="text-sm text-gray-500">Qty: {it.qty}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${it.price.toFixed(2)}</div>
                      <button onClick={() => removeFromCart(idx)} className="text-xs text-rose-500 mt-1">Quitar</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 border-t pt-4">
              <div className="flex items-center justify-between text-sm text-gray-600">Subtotal <span className="font-semibold">${subtotal.toFixed(2)}</span></div>
              <button className="w-full mt-4 px-4 py-2 rounded-lg bg-rose-500 text-white">Proceder al pago</button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-3xl bg-white/90 backdrop-blur rounded-full shadow-md py-2 px-3 flex items-center justify-between md:hidden">
        <button className="flex flex-col items-center text-xs">
          <HomeIcon />
          <span>Inicio</span>
        </button>
        <button className="flex flex-col items-center text-xs" onClick={() => setSidebarOpen(true)}>
          <Menu size={18} />
          <span>Menu</span>
        </button>
        <button className="flex flex-col items-center text-xs" onClick={() => setCartOpen(true)}>
          <ShoppingCart size={18} />
          <span>Carrito</span>
        </button>
        <button className="flex flex-col items-center text-xs">
          <User size={18} />
          <span>Perfil</span>
        </button>
      </nav>
    </div>
  );
}

/**
 * Small Home icon so we keep single-file dependency only to lucide-react in imports above.
 */
function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M3 11.5L12 4l9 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 21h14a1 1 0 0 0 1-1v-8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
