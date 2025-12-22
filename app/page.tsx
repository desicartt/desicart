// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Cart from "@/components/Cart";

interface Product {
  id: string;
  name: string;
  price: number;
  shelf_price: number;
  image_url?: string;
  category?: string;
}

interface CartItem extends Product {
  quantity: number;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const { data } = await supabase.from("products").select("*").order("name");
    setProducts(data || []);
    setLoading(false);
  }

  function addToCart(product: Product) {
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  }

  function updateQuantity(id: string, quantity: number) {
    if (quantity === 0) {
      setCart(cart.filter((item) => item.id !== id));
    } else {
      setCart(
        cart.map((item) => (item.id === id ? { ...item, quantity } : item))
      );
    }
  }

  function removeFromCart(id: string) {
    setCart(cart.filter((item) => item.id !== id));
  }

  const cartTotalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotalValue = cart.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  const categories = [
    { id: "all", name: "All", icon: "🌐" },
    { id: "rice", name: "Rice & Grains", icon: "🌾" },
    { id: "spices", name: "Spices", icon: "🌶️" },
    { id: "lentils", name: "Lentils", icon: "🫘" },
    { id: "snacks", name: "Snacks", icon: "🍿" },
    { id: "beverages", name: "Beverages", icon: "🫖" },
  ];

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur-xl">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-500 to-slate-900 flex items-center justify-center shadow-lg">
              <span className="text-white text-lg font-bold">GJ</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-50">GoJack</p>
              <p className="text-xs text-slate-400">Smart Grocery Network</p>
            </div>
          </div>

          <button
            onClick={() => setShowCart(true)}
            className="relative flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 hover:border-primary-500 hover:bg-slate-900/80 transition"
          >
            <span className="text-lg">🛒</span>
            <span>Cart</span>
            <span className="text-xs text-slate-400">
              ${cartTotalValue.toFixed(2)}
            </span>
            {cartTotalItems > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary-500 text-[10px] flex items-center justify-center font-semibold">
                {cartTotalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 pt-8 pb-6 border-b border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
        <div className="grid md:grid-cols-[1.5fr,1fr] gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs text-slate-300 mb-4">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Batch delivery · Save more with every cart
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-50 mb-3">
              Futuristic <span className="text-primary-400">grocery runs</span>,
              without leaving home.
            </h1>
            <p className="text-sm md:text-base text-slate-400 max-w-xl">
              GoJack bundles orders in your suburb, hitting the sweet spot
              between speed and savings. See how close your area is to the \$100
              batch target.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#products"
                className="inline-flex items-center justify-center rounded-full bg-primary-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-600 transition"
              >
                Browse products
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-full border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-200 hover:border-primary-500 transition"
              >
                How GoJack works
              </a>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="relative rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-[0_0_40px_rgba(79,70,229,0.35)]">
              <p className="text-xs text-slate-400 mb-2">
                Today’s batch · Your suburb
              </p>
              <p className="text-3xl font-semibold text-slate-50 mb-1">
                $74.20
              </p>
              <p className="text-xs text-slate-500 mb-4">
                \$100 target · 74% complete
              </p>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full w-[74%] bg-gradient-to-r from-primary-500 to-emerald-400" />
              </div>
              <p className="mt-3 text-[11px] text-slate-500">
                Orders lock pricing; we dispatch as soon as the batch crosses
                \$100 for your area.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Category pills */}
      <section className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40">
        <div className="px-6 py-3 flex overflow-x-auto gap-3 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? "bg-primary-500 text-white"
                  : "bg-slate-900 text-slate-300 border border-slate-700 hover:border-primary-500"
              }`}
            >
              <span className="mr-2">{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* Products */}
      <section id="products" className="px-6 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500" />
              <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                🛒
              </div>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-xl font-semibold text-slate-200 mb-2">
              No products found
            </p>
            <p className="text-sm text-slate-500 mb-4">
              Try another category or check back later.
            </p>
            <button
              onClick={() => setSelectedCategory("all")}
              className="rounded-full bg-primary-500 px-5 py-2 text-sm font-medium text-white hover:bg-primary-600 transition"
            >
              View all products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => {
              const discount =
                product.shelf_price > product.price
                  ? Math.round((1 - product.price / product.shelf_price) * 100)
                  : 0;

              return (
                <div
                  key={product.id}
                  className="bg-slate-900/70 border border-slate-800 rounded-2xl shadow-sm hover:border-primary-500/60 hover:shadow-[0_0_30px_rgba(79,70,229,0.35)] transition-all duration-200 overflow-hidden"
                >
                  <div className="relative h-40 bg-slate-800 flex items-center justify-center overflow-hidden">
                    {discount > 0 && (
                      <div className="absolute top-2 left-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                        {discount}% OFF
                      </div>
                    )}
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                        GoJack
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-xs font-medium text-slate-50 line-clamp-2 min-h-[2.4rem]">
                      {product.name}
                    </h3>
                    <div className="mt-2 flex items-end justify-between">
                      <div>
                        <div className="text-base font-semibold text-emerald-400">
                          ${product.price.toFixed(2)}
                        </div>
                        {product.shelf_price > product.price && (
                          <div className="text-[10px] text-slate-500 line-through">
                            ${product.shelf_price.toFixed(2)}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => addToCart(product)}
                        className="rounded-full bg-primary-500 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-primary-600 transition"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="px-6 py-10 border-t border-slate-800 bg-slate-950"
      >
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          How GoJack works
        </h2>
        <div className="grid md:grid-cols-3 gap-4 text-sm text-slate-300">
          <div className="border border-slate-800 rounded-2xl p-4 bg-slate-900/60">
            <p className="text-xs text-slate-500 mb-1">01</p>
            <p className="font-medium mb-1">Shop</p>
            <p className="text-xs text-slate-400">
              Add groceries to your cart, just like a normal online store.
            </p>
          </div>
          <div className="border border-slate-800 rounded-2xl p-4 bg-slate-900/60">
            <p className="text-xs text-slate-500 mb-1">02</p>
            <p className="font-medium mb-1">Batch</p>
            <p className="text-xs text-slate-400">
              Your order joins others nearby until the shared batch hits \$100.
            </p>
          </div>
          <div className="border border-slate-800 rounded-2xl p-4 bg-slate-900/60">
            <p className="text-xs text-slate-500 mb-1">03</p>
            <p className="font-medium mb-1">Deliver</p>
            <p className="text-xs text-slate-400">
              We dispatch fresh groceries with local drivers at optimized cost.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-slate-800 bg-slate-950 text-[11px] text-slate-500 flex items-center justify-between">
        <span>© {new Date().getFullYear()} GoJack</span>
        <span className="hidden sm:inline">
          Built for modern batch-based grocery delivery.
        </span>
      </footer>

      {showCart && (
        <Cart
          cart={cart}
          onUpdateQuantity={updateQuantity}
          onRemove={removeFromCart}
          onClose={() => setShowCart(false)}
        />
      )}

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
