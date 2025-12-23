// app/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface ProductRow {
  id: string;
  name: string;
  price: number | string | null;
  shelf_price: number | string | null;
  image_url?: string | null;
  category?: string | null;
  store_id?: string | null;
  brand?: string | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
  shelf_price: number;
  image_url?: string | null;
  category?: string | null;
  store_id?: string | null;
  brand?: string | null;
}

interface CartItem extends Product {
  quantity: number;
}

interface Niche {
  id: string;
  name: string;
  icon: string;
  time: string;
  categories: string[];
}

// Inline Cart Component
function Cart({
  cart,
  onUpdateQuantity,
  onRemove,
  onClose,
}: {
  cart: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}) {
  const total = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center p-4">
      <div className="bg-white w-full max-w-md max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Your Batch</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-900 p-1"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-slate-500 mt-1">{cart.length} items</p>
        </div>

        <div className="p-6 max-h-96 overflow-y-auto">
          {cart.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 py-4 border-b border-slate-100 last:border-b-0"
            >
              <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs uppercase tracking-wide text-slate-500 font-medium">
                    {item.brand || "GJ"}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-900 line-clamp-2">
                  {item.name}
                </p>
                <p className="text-xs text-slate-500">{item.brand}</p>
                <p className="text-base font-bold text-emerald-600 mt-1">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                  className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 text-sm font-medium transition-colors"
                >
                  -
                </button>
                <span className="w-10 text-center font-mono text-sm font-bold bg-slate-100 rounded px-2 py-1">
                  {item.quantity}
                </span>
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  className="w-10 h-10 rounded-lg bg-indigo-500 hover:bg-indigo-600 flex items-center justify-center text-white text-sm font-medium transition-colors"
                >
                  +
                </button>
                <button
                  onClick={() => onRemove(item.id)}
                  className="ml-2 text-slate-400 hover:text-red-500 text-xl p-1 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4">
          <div className="text-right space-y-1">
            <p className="text-sm text-slate-600">Batch subtotal</p>
            <p className="text-2xl font-bold text-slate-900">
              ${total.toFixed(2)}
            </p>
            <p className="text-xs text-slate-500">
              Target $100 · {Math.round((total / 100) * 100)}% complete
            </p>
          </div>
          <button className="w-full bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 text-white py-4 rounded-2xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-200">
            Continue to checkout →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedNiche, setSelectedNiche] = useState<string>("morning");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("price-asc");
  const [searchTerm, setSearchTerm] = useState("");

  // Fixed Niche interface with icon property
  const niches: Niche[] = [
    {
      id: "morning",
      name: "☀️ Morning Start",
      icon: "☀️",
      time: "6-10 AM",
      categories: ["beverages", "dairy", "breakfast"],
    },
    {
      id: "day",
      name: "🌞 Day Essentials",
      icon: "🌞",
      time: "10 AM-4 PM",
      categories: ["snacks", "lunch", "beverages"],
    },
    {
      id: "evening",
      name: "🌅 Evening Prep",
      icon: "🌅",
      time: "4-8 PM",
      categories: ["dinner", "pantry", "spices"],
    },
    {
      id: "night",
      name: "🌙 Night Wind-down",
      icon: "🌙",
      time: "8 PM+",
      categories: ["snacks", "beverages", "dessert"],
    },
  ];

  const currentNiche = niches.find((n) => n.id === selectedNiche);
  const categories = [
    { id: "all", name: "All", icon: "🌐" },
    ...(currentNiche?.categories.map((cat) => ({
      id: cat,
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      icon: "📦",
    })) || []),
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, selectedNiche, selectedCategory, sortBy, searchTerm]);

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name");

      if (error) throw error;

      const normalised: Product[] =
        (data as ProductRow[] | null)?.map((p) => ({
          id: p.id,
          name: p.name || "Sample Product",
          price: Number(p.price ?? 0) || 5.99,
          shelf_price: Number(p.shelf_price ?? p.price ?? 0) || 6.99,
          image_url: p.image_url ?? null,
          category: p.category ?? "pantry",
          store_id: p.store_id ?? null,
          brand: p.brand ?? "GoJack",
        })) || [];

      setProducts(normalised);
    } catch (error) {
      console.error("fetchProducts error", error);
    } finally {
      setLoading(false);
    }
  }

  const applyFilters = useCallback(() => {
    let filtered = [...products];

    if (selectedNiche !== "morning") {
      const nicheCats =
        niches.find((n) => n.id === selectedNiche)?.categories || [];
      filtered = filtered.filter((p) => nicheCats.includes(p.category || ""));
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.brand?.toLowerCase().includes(term) ||
          p.category?.toLowerCase().includes(term)
      );
    }

    switch (sortBy) {
      case "price-asc":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "discount":
        filtered.sort((a, b) => {
          const discountA =
            a.shelf_price > a.price ? (1 - a.price / a.shelf_price) * 100 : 0;
          const discountB =
            b.shelf_price > b.price ? (1 - b.price / b.shelf_price) * 100 : 0;
          return discountB - discountA;
        });
        break;
      default:
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    setFilteredProducts(filtered);
  }, [products, selectedNiche, selectedCategory, sortBy, searchTerm, niches]);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }

  function updateQuantity(id: string, quantity: number) {
    setCart((prev) => {
      if (quantity === 0) {
        return prev.filter((item) => item.id !== id);
      }
      return prev.map((item) =>
        item.id === id ? { ...item, quantity } : item
      );
    });
  }

  function removeFromCart(id: string) {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }

  const cartTotalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotalValue = cart.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-slate-50 text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg" />
              <div className="relative h-full w-full rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                GJ
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">GoJack</h1>
              <p className="text-xs text-slate-500">AI batch grocery</p>
            </div>
          </div>
          <button
            onClick={() => setShowCart(true)}
            className="relative flex items-center gap-2 px-4 py-2 rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm text-sm font-medium text-slate-800 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all"
          >
            <span>🛒</span>
            <span>${cartTotalValue.toFixed(2)}</span>
            {cartTotalItems > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-indigo-500 text-xs text-white rounded-full flex items-center justify-center font-bold">
                {cartTotalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-slate-200/50 bg-gradient-to-br from-white/90 to-slate-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 grid lg:grid-cols-[1.3fr,1fr] gap-8 lg:gap-12 items-start">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white/80 backdrop-blur-sm text-xs font-medium text-slate-600 shadow-sm max-w-max">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              Live AI batching across Melbourne
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text">
              Smarter grocery runs
              <span className="block bg-gradient-to-r from-indigo-500 via-emerald-500 to-sky-500 bg-clip-text text-transparent">
                that feel effortless
              </span>
            </h2>
            <p className="text-lg text-slate-600 max-w-lg leading-relaxed">
              Build your order calmly while GoJack AI groups nearby baskets,
              optimizes dispatch timing, and keeps delivery fees fair across
              Melbourne.
            </p>
            <div className="grid md:grid-cols-2 gap-4 max-w-lg">
              <div className="p-6 rounded-3xl bg-white/80 border border-slate-200 shadow-xl backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">$</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">$74.20</p>
                    <p className="text-xs text-slate-500">
                      Live Melbourne batch
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-500 to-emerald-500 shadow-2xl text-white backdrop-blur-sm">
                <p className="text-sm opacity-90 mb-1">GoJack AI Engine</p>
                <p className="font-semibold text-sm">Smart batching active</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 pt-4">
              <a
                href="#products"
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 text-lg"
              >
                Start Shopping →
              </a>
              <a
                href="#how-it-works"
                className="px-8 py-4 border-2 border-slate-200 hover:border-indigo-300 bg-white/60 backdrop-blur-sm text-slate-800 font-semibold rounded-3xl hover:shadow-xl transition-all duration-300"
              >
                How AI works
              </a>
            </div>
          </div>

          {/* Animated flow - simplified for deployment */}
          <div className="hidden lg:block">
            <div className="relative h-80 p-8 bg-gradient-to-br from-slate-900/95 to-slate-800/95 rounded-3xl shadow-2xl border border-slate-700/50 backdrop-blur-xl">
              <div className="absolute inset-8 border-2 border-dashed border-white/20 rounded-2xl" />

              <div className="relative h-full flex items-center justify-center">
                <div className="space-y-8 w-full">
                  <div className="flex items-center gap-6 animate-pulse">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
                    <div className="flex-1 h-1 bg-gradient-to-r from-emerald-400 to-indigo-400 rounded-full animate-pulse" />
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-28 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                      <p className="text-xs text-slate-300 mb-1">You shop</p>
                      <p className="text-xs font-medium text-white">
                        Calmly add items
                      </p>
                    </div>
                    <div className="w-32 p-4 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-2xl shadow-xl">
                      <p className="text-xs font-semibold text-white mb-1">
                        GoJack AI
                      </p>
                      <p className="text-xs text-emerald-100">
                        Groups nearby orders
                      </p>
                    </div>
                    <div className="w-28 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                      <p className="text-xs text-slate-300 mb-1">
                        Store + Driver
                      </p>
                      <p className="text-xs font-medium text-white">
                        Batch delivery
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 animate-pulse">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
                    <div className="flex-1 h-1 bg-gradient-to-r from-emerald-400 to-indigo-400 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Niche & Category selectors */}
      <section className="bg-white/80 border-b border-slate-200 sticky top-[88px] z-30 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
          <div className="flex overflow-x-auto gap-3 mb-6 pb-2 scrollbar-hide">
            {niches.map((niche) => (
              <button
                key={niche.id}
                onClick={() => {
                  setSelectedNiche(niche.id);
                  setSelectedCategory("all");
                }}
                className={`flex-shrink-0 px-6 py-3 rounded-2xl text-sm font-semibold whitespace-nowrap shadow-sm transition-all ${
                  selectedNiche === niche.id
                    ? "bg-gradient-to-r from-indigo-500 to-emerald-500 text-white shadow-lg"
                    : "bg-slate-100 text-slate-700 border border-slate-200 hover:border-indigo-300 hover:shadow-md"
                }`}
              >
                <span className="mr-2 text-xl">{niche.icon}</span>
                {niche.name}
                <span className="ml-1 text-xs opacity-75">({niche.time})</span>
              </button>
            ))}
          </div>

          <div className="flex overflow-x-auto gap-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-2.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-400/40"
                    : "bg-slate-100 text-slate-700 border border-slate-200 hover:border-indigo-500 hover:bg-white/80"
                }`}
              >
                <span className="mr-1.5">{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white/70 border-b border-slate-200 sticky top-[280px] z-20 backdrop-blur-sm py-4">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <input
                type="text"
                placeholder="Quick search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
              />
              <div className="flex gap-1.5">
                {[
                  { id: "price-asc", label: "↑" },
                  { id: "price-desc", label: "↓" },
                  { id: "discount", label: "🔥" },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSortBy(option.id)}
                    className={`p-2.5 rounded-xl transition-all text-sm font-medium ${
                      sortBy === option.id
                        ? "bg-indigo-600 text-white shadow-md"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                    title={option.id}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-sm text-slate-600 font-medium">
              {filteredProducts.length} items • Batch $
              {cartTotalValue.toFixed(0)}/100
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="py-12 pb-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              {Array.from({ length: 20 }, (_, i) => (
                <div
                  key={i}
                  className="h-72 bg-slate-100 rounded-2xl animate-pulse shadow-sm"
                />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center">
                <span className="text-3xl">🛒</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                Nothing here yet
              </h3>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                No products match your current filters. Try switching time of
                day or clearing search.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <button
                  onClick={() => {
                    setSelectedNiche("morning");
                    setSelectedCategory("all");
                    setSearchTerm("");
                  }}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all"
                >
                  Start with Morning ☀️
                </button>
                <button
                  onClick={() => setSearchTerm("")}
                  className="px-6 py-3 border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold rounded-2xl hover:shadow-md transition-all"
                >
                  Clear search
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-5 lg:gap-6">
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
                    className="group relative bg-white/80 hover:bg-white border border-slate-200/50 hover:border-slate-300 rounded-3xl shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden backdrop-blur-sm h-full flex flex-col"
                  >
                    <div className="relative h-48 lg:h-52 p-3 pt-4">
                      {discount > 0 && (
                        <div className="absolute top-3 left-3 z-10 bg-emerald-500 text-white px-2.5 py-1 rounded-full text-[10px] font-bold shadow-lg">
                          {discount}% OFF
                        </div>
                      )}
                      <div className="relative h-full w-full bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl overflow-hidden group-hover:bg-slate-100 transition-all">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <span className="text-[11px] uppercase tracking-[0.3em] text-slate-400 font-semibold bg-slate-200/50 px-3 py-2 rounded-xl backdrop-blur-sm">
                              {product.brand}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                          {product.brand}
                        </p>
                        <h4 className="font-semibold text-slate-900 text-sm leading-tight line-clamp-2 group-hover:text-slate-950">
                          {product.name}
                        </h4>
                      </div>
                      <div className="pt-2 space-y-2">
                        <div className="flex items-baseline justify-between">
                          <div>
                            <div className="text-xl font-bold text-emerald-600 tracking-tight">
                              ${product.price.toFixed(2)}
                            </div>
                            {product.shelf_price > product.price && (
                              <div className="text-[11px] text-slate-500 font-mono line-through">
                                ${product.shelf_price.toFixed(2)}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => addToCart(product)}
                            className="group-hover:scale-110 bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-[12px] font-bold text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap"
                          >
                            Add
                            <span>🛒</span>
                          </button>
                        </div>
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
      <section
        id="how-it-works"
        className="py-20 bg-gradient-to-b from-slate-50 to-white"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text mb-6">
              How GoJack AI works
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Time-based shopping meets intelligent batching
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "☀️",
                title: "Time-based niches",
                desc: "Shop by when you need it - morning coffee to evening meal prep across your day.",
              },
              {
                icon: "⚡",
                title: "Smart batching",
                desc: "AI groups nearby orders by time + suburb patterns for perfect dispatch timing.",
              },
              {
                icon: "📦",
                title: "Clear delivery",
                desc: "Store prep → driver pickup → batch delivery. Simple statuses you can trust.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group p-8 rounded-3xl bg-white/70 border border-slate-200 hover:border-indigo-200 hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 backdrop-blur-sm"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform">
                  <span className="text-2xl">{feature.icon}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4 group-hover:text-indigo-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/70 bg-white/90 backdrop-blur-xl shadow-2xl">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-2xl">🛒</div>
              <div>
                <p className="font-bold text-lg text-slate-900">
                  {cartTotalItems} {cartTotalItems === 1 ? "item" : "items"}
                </p>
                <p className="text-sm text-slate-600">
                  Batch value:{" "}
                  <span className="font-mono">
                    ${cartTotalValue.toFixed(2)}
                  </span>{" "}
                  / $100
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCart(true)}
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 text-white font-bold rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300 text-sm whitespace-nowrap"
              disabled={cartTotalItems === 0}
            >
              {cartTotalItems === 0
                ? "Add items to continue"
                : `Review batch (${cartTotalItems})`}
            </button>
          </div>
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
        @media (max-width: 768px) {
          .lg\\:grid-cols-\\[1\\.3fr\\,1fr\\] {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
