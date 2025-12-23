// app/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
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

  // Daily niches (Morning → Day → Evening → Night)
  const niches: Niche[] = [
    {
      id: "morning",
      name: "☀️ Morning Start",
      time: "6-10 AM",
      categories: ["beverages", "dairy", "breakfast"],
    },
    {
      id: "day",
      name: "🌞 Day Essentials",
      time: "10 AM-4 PM",
      categories: ["snacks", "lunch", "beverages"],
    },
    {
      id: "evening",
      name: "🌅 Evening Prep",
      time: "4-8 PM",
      categories: ["dinner", "pantry", "spices"],
    },
    {
      id: "night",
      name: "🌙 Night Wind-down",
      time: "8 PM+",
      categories: ["snacks", "beverages", "dessert"],
    },
  ];

  // Categories by niche
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
        brand: p.brand ?? null,
      })) || [];

    setProducts(normalised);
    setLoading(false);
  }

  const applyFilters = useCallback(() => {
    let filtered = products;

    // Niche filter (limits categories)
    if (selectedNiche !== "morning") {
      const nicheCats =
        niches.find((n) => n.id === selectedNiche)?.categories || [];
      filtered = filtered.filter((p) => nicheCats.includes(p.category || ""));
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    // Search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.brand?.toLowerCase().includes(term) ||
          p.category?.toLowerCase().includes(term)
      );
    }

    // Sort
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
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    setFilteredProducts(filtered);
  }, [products, selectedNiche, selectedCategory, sortBy, searchTerm, niches]);

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

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-slate-50 text-slate-900 pb-20">
      {/* Background accents */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-24 -left-32 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="absolute -top-32 right-0 h-80 w-80 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl" />
      </div>

      {/* Header */}
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur-xl sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-lg shadow-indigo-500/40" />
              <div className="relative h-full w-full rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-700 flex items-center justify-center text-white text-lg font-bold">
                GJ
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">GoJack</p>
              <p className="text-xs text-slate-500">
                AI‑powered batch grocery for Melbourne
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCart(true)}
            className="relative hidden sm:flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:border-indigo-500 hover:shadow-md transition"
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

      {/* Hero with animated flow */}
      <section className="border-b border-slate-200 bg-gradient-to-br from-white/90 via-slate-50 to-slate-100">
        <div className="mx-auto max-w-6xl px-6 py-10 grid md:grid-cols-[1.3fr,1fr] gap-10 items-center">
          {/* Left */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs text-slate-600 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>GoJack AI balances speed and savings for every batch</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900">
              Smarter, AI‑powered{" "}
              <span className="bg-gradient-to-r from-indigo-500 to-emerald-500 bg-clip-text text-transparent">
                grocery runs
              </span>{" "}
              that feel effortless.
            </h1>

            <p className="text-sm md:text-base text-slate-600 max-w-xl">
              A calm interface for building your order while GoJack's AI groups
              nearby baskets, times dispatch, and keeps delivery fees fair.
            </p>

            {/* Demo stats card */}
            <div className="relative mt-4">
              <div className="h-24 rounded-3xl bg-white/80 border border-slate-200 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-sm flex items-center justify-between px-5">
                <div>
                  <p className="text-xs text-slate-500 mb-1">
                    Example batch view · Melbourne
                  </p>
                  <p className="text-2xl font-semibold text-slate-900">
                    $74.20
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Sample numbers showing how GoJack AI tracks batch value and
                    timing. Not live data yet.
                  </p>
                </div>
                <div className="w-32 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-500 shadow-lg shadow-indigo-500/40 flex flex-col justify-center px-3 text-[11px] text-white">
                  <p className="opacity-80">GoJack engine</p>
                  <p className="font-semibold">Batch optimisation</p>
                  <p className="opacity-80 mt-1">
                    Learns local demand to reduce your per‑order cost.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href="#products"
                className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-400/40 hover:bg-indigo-700 transition"
              >
                Start shopping with GoJack
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/80 px-5 py-2.5 text-sm font-medium text-slate-800 hover:border-indigo-500 hover:shadow-md transition"
              >
                How the AI batching works
              </a>
            </div>
          </div>

          {/* Right: animated GoJack flow */}
          <div className="hidden md:block">
            <div className="relative h-72">
              <div className="absolute inset-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 shadow-[0_28px_80px_rgba(15,23,42,0.5)]" />
              <div className="absolute inset-4 rounded-3xl bg-slate-950/95 border border-slate-700/80 shadow-[0_22px_60px_rgba(15,23,42,0.6)] overflow-hidden">
                <div className="h-full w-full relative">
                  {/* Dotted path */}
                  <div className="absolute inset-10 border border-dashed border-slate-700 rounded-2xl" />
                  <div className="absolute left-10 top-1/2 -translate-y-1/2 h-0.5 w-[55%] bg-gradient-to-r from-emerald-400 via-indigo-400 to-sky-400 opacity-60 blur-[1px]" />

                  {/* Customer card */}
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 -translate-x-4 animate-float-slow">
                    <div className="rounded-2xl bg-slate-900 border border-slate-600/70 px-4 py-3 shadow-lg shadow-slate-900/60 w-40">
                      <p className="text-[11px] text-slate-400 mb-1">
                        Step 1 · Customer
                      </p>
                      <p className="text-xs font-medium text-slate-50">
                        You add items at calm pace.
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        GoJack watches total, not every click.
                      </p>
                    </div>
                  </div>

                  {/* GoJack AI card */}
                  <div className="absolute left-1/2 top-8 -translate-x-1/2 animate-float-medium">
                    <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-500 px-4 py-3 shadow-xl shadow-emerald-500/50 w-44">
                      <p className="text-[11px] text-emerald-100/90 mb-1">
                        Step 2 · GoJack AI
                      </p>
                      <p className="text-xs font-semibold text-white">
                        Groups nearby orders into smart batches.
                      </p>
                      <p className="mt-1 text-[11px] text-emerald-100/80">
                        Predicts when to lock in and dispatch.
                      </p>
                    </div>
                  </div>

                  {/* Store & driver card */}
                  <div className="absolute right-4 bottom-10 animate-float-fast">
                    <div className="rounded-2xl bg-slate-900 border border-slate-600/70 px-4 py-3 shadow-lg shadow-slate-900/60 w-44">
                      <p className="text-[11px] text-slate-400 mb-1">
                        Step 3 · Store & driver
                      </p>
                      <p className="text-xs font-medium text-slate-50">
                        Partner shop prepares, driver collects.
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Clear statuses, no noisy maps.
                      </p>
                    </div>
                  </div>

                  {/* Little pulsing indicator */}
                  <div className="absolute right-8 top-1/2 -translate-y-1/2">
                    <div className="relative">
                      <span className="absolute inline-flex h-7 w-7 rounded-full bg-emerald-400/40 animate-ping" />
                      <span className="relative inline-flex h-7 w-7 rounded-full bg-emerald-500 text-[11px] text-white items-center justify-center">
                        GO
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-emerald-300">
                      Batch ready
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Time-of-day Niche Selector */}
      <section className="bg-white/95 border-b border-slate-200 sticky top-[72px] z-30 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex overflow-x-auto gap-3 scrollbar-hide mb-4">
            {niches.map((niche) => (
              <button
                key={niche.id}
                onClick={() => {
                  setSelectedNiche(niche.id);
                  setSelectedCategory("all");
                }}
                className={`flex-shrink-0 px-6 py-3 rounded-2xl text-sm font-medium whitespace-nowrap transition shadow-sm ${
                  selectedNiche === niche.id
                    ? "bg-gradient-to-r from-indigo-500 to-emerald-500 text-white shadow-lg shadow-indigo-400/40"
                    : "bg-slate-100 text-slate-700 border border-slate-200 hover:border-indigo-300 hover:shadow-md"
                }`}
              >
                <span className="mr-2 text-lg">{niche.icon}</span>
                {niche.name}
                <span className="ml-1 text-xs opacity-80">({niche.time})</span>
              </button>
            ))}
          </div>

          {/* Category pills */}
          <div className="flex overflow-x-auto gap-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition ${
                  selectedCategory === cat.id
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-400/40"
                    : "bg-slate-100 text-slate-700 border border-slate-200 hover:border-indigo-500 hover:bg-white"
                }`}
              >
                <span className="mr-2">{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Filters & Sort */}
      <section className="bg-white/90 border-b border-slate-200 sticky top-[200px] z-30 backdrop-blur py-3">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Quick search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
              />
              <div className="flex gap-1">
                {[
                  { id: "price-asc", label: "Price ↑" },
                  { id: "price-desc", label: "Price ↓" },
                  { id: "discount", label: "Deals" },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSortBy(option.id)}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      sortBy === option.id
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-slate-500">
              {filteredProducts.length} items · Batch: $
              {cartTotalValue.toFixed(0)}/100
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section
        id="products"
        className="py-10 bg-gradient-to-b from-slate-50 to-slate-100"
      >
        <div className="mx-auto max-w-6xl px-6">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 py-24">
              {Array(12)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="h-64 bg-slate-100 animate-pulse rounded-2xl"
                  />
                ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-xl font-semibold text-slate-900 mb-2">
                No products for this time of day
              </p>
              <p className="text-sm text-slate-500 mb-6">
                Try switching to another niche or clearing filters.
              </p>
              <button
                onClick={() => {
                  setSelectedNiche("morning");
                  setSelectedCategory("all");
                  setSearchTerm("");
                }}
                className="rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-400/40"
              >
                Start with Morning
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
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
                    className="group relative bg-white/90 border border-slate-200 rounded-2xl shadow-sm hover:shadow-[0_16px_40px_rgba(15,23,42,0.16)] hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col backdrop-blur-sm h-full"
                  >
                    <div className="relative h-40 lg:h-44 bg-slate-50 flex items-center justify-center overflow-hidden p-2">
                      {discount > 0 && (
                        <div className="absolute top-2 left-2 z-10 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-lg">
                          {discount}% OFF
                        </div>
                      )}
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-full w-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-slate-200 to-slate-300 rounded-xl flex items-center justify-center">
                          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                            {product.brand || "GoJack"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between gap-2">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">
                          {product.brand}
                        </p>
                        <h3 className="text-sm font-semibold text-slate-900 line-clamp-2">
                          {product.name}
                        </h3>
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <div className="text-lg font-bold text-emerald-600">
                            ${product.price.toFixed(2)}
                          </div>
                          {product.shelf_price > product.price && (
                            <div className="text-[11px] text-slate-500 line-through">
                              ${product.shelf_price.toFixed(2)}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => addToCart(product)}
                          className="rounded-full bg-indigo-600 px-4 py-2 text-[11px] font-semibold text-white shadow-sm shadow-indigo-400/40 hover:bg-indigo-700 transition flex items-center gap-1"
                        >
                          Add 🛒
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

      {/* How it works - unchanged */}
      <section
        id="how-it-works"
        className="border-t border-slate-200 bg-white/90 backdrop-blur py-16"
      >
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-semibold text-slate-900 mb-8 text-center">
            How GoJack's AI fits into your day
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-slate-200 rounded-3xl p-6 bg-gradient-to-b from-slate-50 to-white shadow-sm hover:shadow-xl transition">
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-xl">🎯</span>
              </div>
              <h3 className="font-semibold mb-3">Time-based niches</h3>
              <p className="text-sm text-slate-600">
                Shop by when you need it - morning coffee to evening dinner
                prep.
              </p>
            </div>
            <div className="border border-slate-200 rounded-3xl p-6 bg-gradient-to-b from-emerald-50 to-white shadow-sm hover:shadow-xl transition">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-xl">⚡</span>
              </div>
              <h3 className="font-semibold mb-3">Smart batching</h3>
              <p className="text-sm text-slate-600">
                AI groups nearby orders by time and suburb for optimal dispatch.
              </p>
            </div>
            <div className="border border-slate-200 rounded-3xl p-6 bg-gradient-to-b from-sky-50 to-white shadow-sm hover:shadow-xl transition">
              <div className="w-12 h-12 bg-sky-100 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-xl">📦</span>
              </div>
              <h3 className="font-semibold mb-3">Clear delivery</h3>
              <p className="text-sm text-slate-600">
                Store prep → driver pickup → your door. Simple status updates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer & Cart - unchanged */}
      <footer className="border-t border-slate-200 bg-white text-[11px] text-slate-500 py-6">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <span>© {new Date().getFullYear()} GoJack</span>
        </div>
      </footer>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-slate-200 px-4 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.12)] backdrop-blur">
        <div className="mx-auto max-w-6xl flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-3">
            <span className="text-xl">🛒</span>
            <div>
              <p className="font-semibold text-slate-900">
                {cartTotalItems} item{cartTotalItems !== 1 ? "s" : ""}
              </p>
              <p className="text-[11px] text-slate-500">
                Batch: ${cartTotalValue.toFixed(2)} · Target $100
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCart(true)}
            className="rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-400/40 hover:shadow-xl transition"
          >
            Review & checkout
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
        @keyframes float-slow {
          0%,
          100% {
            transform: translateY(-50%) translateX(-1px);
          }
          50% {
            transform: translateY(-54%) translateX(1px);
          }
        }
        @keyframes float-medium {
          0%,
          100% {
            transform: translateX(-50%) translateY(0px);
          }
          50% {
            transform: translateX(-50%) translateY(-6px);
          }
        }
        @keyframes float-fast {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
        }
        .animate-float-medium {
          animation: float-medium 8s ease-in-out infinite;
        }
        .animate-float-fast {
          animation: float-fast 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
