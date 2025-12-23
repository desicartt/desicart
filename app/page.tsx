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

interface Category {
  id: string;
  name: string;
  icon: string;
  topBrands: string[];
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("price-asc");
  const [searchTerm, setSearchTerm] = useState("");

  // AI-curated categories with top brands only
  const categories: Category[] = [
    { id: "all", name: "All Products", icon: "🌐", topBrands: [] },
    {
      id: "rice",
      name: "Rice & Grains",
      icon: "🌾",
      topBrands: ["SunRice", "Uncle Ben's", "Tilda", "Dineamic"],
    },
    {
      id: "spices",
      name: "Spices",
      icon: "🌶️",
      topBrands: ["MasterFoods", "McCormick", "Greggs", "Keens"],
    },
    {
      id: "lentils",
      name: "Lentils & Pulses",
      icon: "🫘",
      topBrands: ["Macro", "Coles", "TruBlue", "San Remo"],
    },
    {
      id: "snacks",
      name: "Snacks",
      icon: "🍿",
      topBrands: ["Arnott's", "Smith's", "Temptin", "Kettle"],
    },
    {
      id: "beverages",
      name: "Beverages",
      icon: "🫖",
      topBrands: ["Coca-Cola", "Pepsi", "San Pellegrino", "Monster"],
    },
    {
      id: "dairy",
      name: "Dairy",
      icon: "🧀",
      topBrands: ["Paul's", "Anchor", "Bulla", "Devondale"],
    },
    {
      id: "pantry",
      name: "Pantry Staples",
      icon: "🧺",
      topBrands: ["Arnotts", "Heinz", "Campbell's", "Maggi"],
    },
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, selectedCategory, selectedBrand, sortBy, searchTerm]);

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

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    // Brand filter (AI-curated top brands only)
    if (selectedBrand) {
      filtered = filtered.filter((p) => p.brand === selectedBrand);
    }

    // Search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.brand?.toLowerCase().includes(term)
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
  }, [products, selectedCategory, selectedBrand, sortBy, searchTerm]);

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

  const currentCategory = categories.find((c) => c.id === selectedCategory);
  const availableBrands = Array.from(
    new Set(filteredProducts.map((p) => p.brand).filter(Boolean))
  );

  const heroSample = filteredProducts[0];

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-slate-50 text-slate-900 pb-20">
      {/* Background accents */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-24 -left-32 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="absolute -top-32 right-0 h-80 w-80 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl" />
      </div>

      {/* Header */}
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur-xl sticky top-0 z-50">
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
                AI‑curated grocery · Melbourne batching
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

      {/* Hero */}
      <section className="border-b border-slate-200 bg-gradient-to-br from-white/90 via-slate-50 to-slate-100">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="space-y-6 mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs text-slate-600 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>AI selects top brands + best prices for batching</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900">
              AI‑curated{" "}
              <span className="bg-gradient-to-r from-indigo-500 to-emerald-500 bg-clip-text text-transparent">
                grocery essentials
              </span>
            </h1>

            <p className="text-sm md:text-base text-slate-600 max-w-2xl">
              GoJack AI picks only top brands at best prices across Melbourne
              stores. Browse 100+ curated products designed for efficient batch
              delivery.
            </p>

            {/* Demo batch stats */}
            <div className="grid md:grid-cols-2 gap-4 max-w-md">
              <div className="h-20 rounded-2xl bg-white/80 border border-slate-200 shadow-sm backdrop-blur-sm flex items-center px-5">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Example batch</p>
                  <p className="text-xl font-semibold text-slate-900">$74.20</p>
                  <p className="text-[10px] text-slate-500">
                    Melbourne · 8 orders
                  </p>
                </div>
              </div>
              <div className="h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-500 shadow-lg shadow-indigo-500/40 flex items-center px-4 text-white text-[11px]">
                <p>AI engine learns demand patterns</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters & Controls - Sticky */}
      <section className="bg-white/95 border-b border-slate-200 sticky top-[72px] z-40 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
            {/* Search */}
            <div>
              <input
                type="text"
                placeholder="Search products or brands..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition"
              />
            </div>

            {/* Category */}
            <div className="md:col-span-2 flex flex-wrap gap-2 overflow-x-auto scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSelectedBrand("");
                  }}
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

          {/* Brand & Sort - Secondary row */}
          <div className="mt-4 flex flex-wrap gap-3 items-center text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <span>AI‑curated brands:</span>
              {currentCategory?.topBrands.slice(0, 4).map((brand) => (
                <button
                  key={brand}
                  onClick={() =>
                    setSelectedBrand(brand === selectedBrand ? "" : brand)
                  }
                  className={`px-3 py-1 rounded-full border transition ${
                    selectedBrand === brand
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 hover:border-indigo-300"
                  }`}
                >
                  {brand}
                </button>
              ))}
              {availableBrands.length > 4 && (
                <span className="text-slate-400">
                  +{availableBrands.length - 4}
                </span>
              )}
            </div>

            <div className="ml-auto flex gap-1">
              {[
                { id: "price-asc", label: "Price ↑" },
                { id: "price-desc", label: "Price ↓" },
                { id: "discount", label: "Best deals" },
                { id: "name", label: "Name" },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSortBy(option.id)}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    sortBy === option.id
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results summary */}
          <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
            <span>
              Showing {filteredProducts.length} of {products.length} AI‑curated
              products
            </span>
            <span>
              Batch target: <strong>${cartTotalValue.toFixed(2)} / $100</strong>
            </span>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section id="products" className="py-10">
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
              <div className="w-24 h-24 mx-auto mb-6 bg-slate-100 rounded-3xl flex items-center justify-center">
                <span className="text-2xl">🛒</span>
              </div>
              <p className="text-xl font-semibold text-slate-900 mb-2">
                No products match your filters
              </p>
              <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
                Try adjusting category, brand, or search term. GoJack AI curates
                only top brands at best prices.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={() => {
                    setSelectedCategory("all");
                    setSelectedBrand("");
                    setSearchTerm("");
                  }}
                  className="rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-400/40 hover:bg-indigo-700 transition"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-5">
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
                          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">
                            {product.brand || "GoJack"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                      <div>
                        <p className="text-xs text-slate-500 mb-1 line-clamp-1">
                          {product.brand}
                        </p>
                        <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 leading-tight">
                          {product.name}
                        </h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-baseline justify-between">
                          <div>
                            <div className="text-lg font-bold text-emerald-600 tracking-tight">
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
                            className="group-hover:scale-105 rounded-full bg-indigo-600 px-4 py-2 text-[11px] font-semibold text-white shadow-sm shadow-indigo-400/40 hover:bg-indigo-700 transition-all duration-200 flex items-center gap-1.5"
                          >
                            Add
                            <span className="text-indigo-200">🛒</span>
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
        className="border-t border-slate-200 bg-white/90 backdrop-blur py-16"
      >
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-semibold text-slate-900 mb-8 text-center">
            How GoJack AI curates for batch delivery
          </h2>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div className="border border-slate-200 rounded-3xl p-6 bg-gradient-to-b from-slate-50 to-white shadow-sm hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-xl">🎯</span>
              </div>
              <h3 className="font-semibold mb-3">AI Brand Selection</h3>
              <p className="text-slate-600">
                Only top 4-6 trusted brands per category at best available price
                across partner stores.
              </p>
            </div>
            <div className="border border-slate-200 rounded-3xl p-6 bg-gradient-to-b from-emerald-50 to-white shadow-sm hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-xl">⚡</span>
              </div>
              <h3 className="font-semibold mb-3">Smart Batching</h3>
              <p className="text-slate-600">
                Groups nearby orders by suburb demand patterns for optimal
                dispatch timing and fees.
              </p>
            </div>
            <div className="border border-slate-200 rounded-3xl p-6 bg-gradient-to-b from-sky-50 to-white shadow-sm hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-sky-100 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-xl">📦</span>
              </div>
              <h3 className="font-semibold mb-3">Clear Tracking</h3>
              <p className="text-slate-600">
                Store prep → driver pickup → batch delivery. Simple statuses, no
                map clutter.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white text-xs text-slate-500 py-8">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <p>
            © {new Date().getFullYear()} GoJack · AI‑powered grocery batching
            for Melbourne
          </p>
          <p className="mt-1 text-[11px] opacity-75">
            {products.length} products from{" "}
            {Array.from(new Set(products.map((p) => p.store_id))).length} stores
          </p>
        </div>
      </footer>

      {/* Fixed bottom cart bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 border-t border-slate-200 px-4 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.12)] backdrop-blur-sm">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🛒</span>
            <div>
              <p className="font-semibold text-slate-900 text-sm">
                {cartTotalItems} item{cartTotalItems !== 1 ? "s" : ""}
              </p>
              <p className="text-[11px] text-slate-500">
                Batch value:{" "}
                <span className="font-mono">${cartTotalValue.toFixed(2)}</span>{" "}
                / $100 target
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCart(true)}
            className="rounded-2xl bg-gradient-to-r from-indigo-600 to-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/40 hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
          >
            Review batch & checkout
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
        .line-clamp-1,
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-1 {
          -webkit-line-clamp: 1;
        }
        .line-clamp-2 {
          -webkit-line-clamp: 2;
        }
      `}</style>
    </div>
  );
}
