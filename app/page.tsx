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
  store_id?: string | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
  shelf_price: number;
  image_url?: string | null;
  category?: string | null;
  store_id?: string | null;
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
      console.error("fetchProducts error", error);
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
        store_id: p.store_id ?? null,
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
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
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
      <section className="border-b border-slate-200 bg-gradient-to-b from-slate-50 via-white to-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-10 grid md:grid-cols-[1.3fr,1fr] gap-10 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              GoJack AI predicts the best batch timing for your suburb
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900">
              Smarter{" "}
              <span className="text-indigo-600">AI‑driven grocery runs</span>,
              without the chaos.
            </h1>
            <p className="text-sm md:text-base text-slate-600 max-w-xl">
              Browse calmly, add items to your cart, and let GoJack batch your
              order with nearby shoppers so everyone saves on delivery.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
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
                How it works
              </a>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Live batch · West Melbourne
                </p>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700 font-medium">
                  AI forecast
                </span>
              </div>
              <p className="text-3xl font-semibold text-slate-900">$74.20</p>
              <p className="text-xs text-slate-500">
                \$100 target · 74% complete
              </p>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full w-[74%] bg-gradient-to-r from-indigo-500 to-emerald-400" />
              </div>
              <p className="text-[11px] text-slate-500">
                GoJack quietly coordinates store, driver, and customers. You
                just see when your batch is ready and on the road.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Category pills */}
      <section className="bg-white border-b border-slate-200 sticky top-[72px] z-30">
        <div className="mx-auto max-w-6xl px-6 py-3 flex overflow-x-auto gap-3 scrollbar-hide">
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
      <section id="products" className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Fresh items for this batch
              </h2>
              <p className="text-xs text-slate-500">
                Scroll comfortably; your cart stays visible at the bottom.
              </p>
            </div>
          </div>

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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredProducts.map((product) => {
                const discount =
                  product.shelf_price > product.price
                    ? Math.round(
                        (1 - product.price / product.shelf_price) * 100
                      )
                    : 0;

                return (
                  <div
                    key={product.id}
                    className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-indigo-500/60 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col"
                  >
                    <div className="relative h-36 md:h-40 bg-slate-100 flex items-center justify-center overflow-hidden">
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
                    <div className="p-3 flex-1 flex flex-col justify-between gap-2">
                      <h3 className="text-xs font-medium text-slate-900 line-clamp-2 min-h-[2.4rem]">
                        {product.name}
                      </h3>
                      <div className="flex items-end justify-between">
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
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            How GoJack fits into your day
          </h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-slate-700">
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-1">
              <p className="text-xs text-slate-500">01 · Shop</p>
              <p className="font-medium">Browse calmly</p>
              <p className="text-xs text-slate-600">
                Build your basket in a clean interface while the system tracks
                batch progress.
              </p>
            </div>
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-1">
              <p className="text-xs text-slate-500">02 · Batch</p>
              <p className="font-medium">AI groups orders</p>
              <p className="text-xs text-slate-600">
                Orders from nearby customers are grouped to balance cost and
                speed.
              </p>
            </div>
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-1">
              <p className="text-xs text-slate-500">03 · Deliver</p>
              <p className="font-medium">Track at a glance</p>
              <p className="text-xs text-slate-600">
                Clear statuses from store and driver – no clutter, just timing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white text-[11px] text-slate-500">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <span>© {new Date().getFullYear()} GoJack</span>
          <span className="hidden sm:inline">
            AI‑powered batch grocery delivery for modern suburbs.
          </span>
        </div>
      </footer>

      {/* Fixed bottom cart bar */}
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
