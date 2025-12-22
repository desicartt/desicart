// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Cart from "@/components/Cart";

interface ProductRow {
  id: string;
  name: string;
  price: number | string | null;
  shelf_price: number | string | null;
  image_url?: string | null;
  category?: string | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
  shelf_price: number;
  image_url?: string | null;
  category?: string | null;
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
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name");

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const normalised: Product[] =
      (data as ProductRow[] | null)?.map((p) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price ?? 0),
        shelf_price: Number(p.shelf_price ?? p.price ?? 0),
        image_url: p.image_url ?? null,
        category: p.category ?? null,
      })) || [];

    setProducts(normalised);
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
    { id: "other", name: "Other", icon: "🧺" },
  ];

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-md">
              <span className="text-white text-lg font-bold">GJ</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">GoJack</p>
              <p className="text-xs text-slate-500">
                AI‑powered batch grocery network
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCart(true)}
            className="relative hidden sm:flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:border-indigo-500 hover:shadow-sm transition"
          >
            <span className="text-lg">🛒</span>
            <span>Cart</span>
            <span className="text-xs text-slate-500">
              ${cartTotalValue.toFixed(2)}
            </span>
            {cartTotalItems > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-indigo-500 text-[10px] flex items-center justify-center font-semibold text-white">
                {cartTotalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 pt-8 pb-6 border-b border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="grid md:grid-cols-[1.5fr,1fr] gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 mb-4 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              GoJack AI predicts optimal batch timing for your suburb
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900 mb-3">
              Smarter{" "}
              <span className="text-indigo-600">AI‑driven grocery runs</span>,
              delivered to you.
            </h1>
            <p className="text-sm md:text-base text-slate-600 max-w-xl">
              GoJack analyses demand patterns in real time, grouping compatible
              orders so you hit the \$100 batch threshold faster while keeping
              delivery windows realistic and transparent.
            </p>
            <p className="mt-3 text-xs text-slate-500 max-w-xl">
              The system learns which items people in your area buy together and
              surfaces them first, so repeated orders get quicker every week.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#products"
                className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition"
              >
                Start shopping with GoJack
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-800 hover:border-indigo-500 transition bg-white"
              >
                How the AI batching works
              </a>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
              <p className="text-xs text-slate-500 mb-2">
                Live batch · West Melbourne (AI forecast)
              </p>
              <p className="text-3xl font-semibold text-slate-900 mb-1">
                $74.20
              </p>
              <p className="text-xs text-slate-500 mb-1">
                \$100 target · 74% complete
              </p>
              <p className="text-[11px] text-emerald-600 mb-3">
                Estimated ready in 32 minutes based on current order velocity.
              </p>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full w-[74%] bg-gradient-to-r from-indigo-500 to-emerald-400" />
              </div>
              <p className="mt-3 text-[11px] text-slate-500">
                GoJack automatically signals store, driver, and customers when
                the batch flips from pending → ready → on the road.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Category pills */}
      <section className="bg-white border-b border-slate-200 sticky top-[64px] z-30">
        <div className="px-6 py-3 flex overflow-x-auto gap-3 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-700 border border-slate-200 hover:border-indigo-500"
              }`}
            >
              <span className="mr-2">{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* Products */}
      <section id="products" className="px-6 py-8 bg-slate-50">
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500" />
              <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                🛒
              </div>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-xl font-semibold text-slate-900 mb-2">
              No products found
            </p>
            <p className="text-sm text-slate-500 mb-4">
              Try another category or check back later.
            </p>
            <button
              onClick={() => setSelectedCategory("all")}
              className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition"
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
                  className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-indigo-500/60 hover:shadow-lg transition-all duration-200 overflow-hidden"
                >
                  <div className="relative h-40 bg-slate-100 flex items-center justify-center overflow-hidden">
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
                      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                        GoJack
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-xs font-medium text-slate-900 line-clamp-2 min-h-[2.4rem]">
                      {product.name}
                    </h3>
                    <div className="mt-2 flex items-end justify-between">
                      <div>
                        <div className="text-base font-semibold text-emerald-600">
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
                        className="rounded-full bg-indigo-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-indigo-700 transition"
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
        className="px-6 py-10 border-t border-slate-200 bg-white"
      >
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          How GoJack’s AI batching works
        </h2>
        <div className="grid md:grid-cols-3 gap-4 text-sm text-slate-700">
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
            <p className="text-xs text-slate-500 mb-1">01 · Understand</p>
            <p className="font-medium mb-1">Learn your area</p>
            <p className="text-xs text-slate-600">
              GoJack tracks anonymous order patterns to understand which suburbs
              buy which products together and at what times.
            </p>
          </div>
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
            <p className="text-xs text-slate-500 mb-1">02 · Predict</p>
            <p className="font-medium mb-1">Forecast batches</p>
            <p className="text-xs text-slate-600">
              The AI estimates when each batch will cross \$100, so stores and
              drivers get accurate prep and dispatch windows.
            </p>
          </div>
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
            <p className="text-xs text-slate-500 mb-1">03 · Orchestrate</p>
            <p className="font-medium mb-1">Sync store & driver</p>
            <p className="text-xs text-slate-600">
              Once ready, GoJack surfaces a single route for the driver and
              locks the batch for the store so packing is streamlined.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-slate-200 bg-white text-[11px] text-slate-500 flex items-center justify-between">
        <span>© {new Date().getFullYear()} GoJack</span>
        <span className="hidden sm:inline">
          AI‑powered batch grocery delivery for modern suburbs.
        </span>
      </footer>

      {/* Fixed bottom cart bar (mobile & desktop) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-4 py-2 shadow-[0_-4px_12px_rgba(15,23,42,0.08)]">
        <div className="mx-auto max-w-6xl flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-3">
            <span className="text-lg">🛒</span>
            <div>
              <p className="font-medium text-slate-800">
                {cartTotalItems} item{cartTotalItems !== 1 ? "s" : ""} in cart
              </p>
              <p className="text-[11px] text-slate-500">
                Current batch value: ${cartTotalValue.toFixed(2)} · Target \$100
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCart(true)}
            className="rounded-full bg-indigo-600 px-4 py-1.5 text-[11px] sm:text-xs font-medium text-white hover:bg-indigo-700 transition"
          >
            View cart & checkout
          </button>
        </div>
      </div>

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
