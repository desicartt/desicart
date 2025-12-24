app->page.tsx
// app/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

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
const total = cart.reduce((sum, item) => sum + item.quantity \* item.price, 0);

return (
<div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center p-4">
<div className="w-full max-w-md max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
<div className="p-5 border-b border-slate-200 flex items-center justify-between">
<div>
<p className="text-lg font-semibold text-slate-900">Your batch</p>
<p className="text-xs text-slate-500 mt-0.5">{cart.length} items</p>
</div>
<button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
          >
✕
</button>
</div>

        <div className="p-5 space-y-4 overflow-y-auto max-h-80">
          {cart.map((item) => (
            <div
              key={item.id}
              className="flex gap-3 items-center border-b border-slate-100 pb-3 last:border-b-0"
            >
              <div className="h-16 w-16 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    {item.brand || "GJ"}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 line-clamp-2">
                  {item.name}
                </p>
                <p className="text-[11px] text-slate-500">{item.brand}</p>
                <p className="text-sm font-semibold text-emerald-600 mt-1">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                  className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 text-xs"
                >
                  −
                </button>
                <span className="w-7 text-center text-xs font-mono">
                  {item.quantity}
                </span>
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  className="h-7 w-7 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs"
                >
                  +
                </button>
                <button
                  onClick={() => onRemove(item.id)}
                  className="ml-1 h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-5 border-t border-slate-200 space-y-2">
          <div className="flex items-baseline justify-between">
            <p className="text-xs text-slate-500">Batch total</p>
            <p className="text-xl font-semibold text-slate-900">
              ${total.toFixed(2)}
            </p>
          </div>
          <p className="text-[11px] text-slate-500">
            Target $100 · {Math.round((total / 100) * 100)}% complete
          </p>
          <button className="mt-2 w-full rounded-full bg-slate-900 text-white text-sm font-semibold py-2.5 hover:bg-slate-800">
            Continue to checkout
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

const niches: Niche[] = [
{
id: "morning",
name: "Morning start",
icon: "☀️",
time: "6–10am",
categories: ["beverages", "dairy", "breakfast"],
},
{
id: "day",
name: "Day fuel",
icon: "🌞",
time: "10am–4pm",
categories: ["snacks", "lunch", "beverages"],
},
{
id: "evening",
name: "Dinner prep",
icon: "🌅",
time: "4–8pm",
categories: ["dinner", "pantry", "spices"],
},
{
id: "night",
name: "Night bites",
icon: "🌙",
time: "8pm+",
categories: ["snacks", "beverages", "dessert"],
},
];

const currentNiche = niches.find((n) => n.id === selectedNiche);
const categories = [
{ id: "all", name: "All", icon: "🛒" },
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
.select("\*")
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
(sum, item) => sum + item.quantity \* item.price,
0
);

return (
<div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-slate-50 text-slate-900 pb-24">
{/_ Header _/}
<header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-40">
<div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center justify-between">
<div className="flex items-center gap-3">
<div className="relative h-9 w-9">
<div className="absolute inset-0 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 shadow-lg" />
<div className="relative h-full w-full rounded-xl bg-gradient-to-br from-slate-800 to-slate-600 flex items-center justify-center text-white text-sm font-semibold">
GJ
</div>
</div>
<div>
<p className="text-sm font-semibold text-slate-900">
GoJack Grocery
</p>
<p className="text-xs text-slate-500">
AI‑batched delivery · Melbourne
</p>
</div>
</div>

          <button
            onClick={() => setShowCart(true)}
            className="relative flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs sm:text-sm font-medium text-slate-800 shadow-sm hover:border-teal-500 hover:shadow-md"
          >
            <span>🛒</span>
            <span>${cartTotalValue.toFixed(2)}</span>
            {cartTotalItems > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-teal-600 text-[10px] flex items-center justify-center text-white">
                {cartTotalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 grid lg:grid-cols-[1.3fr,1fr] gap-10 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
              <span>AI balances speed and savings for each batch</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900">
              Calm grocery shopping,
              <span className="block bg-gradient-to-r from-teal-600 to-amber-500 bg-clip-text text-transparent">
                smarter shared delivery.
              </span>
            </h1>

            <p className="text-sm md:text-base text-slate-600 max-w-xl">
              Build your order while GoJack AI groups nearby baskets by time of
              day and suburb, then dispatches when the batch hits the sweet
              spot.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 max-w-md">
              <div className="h-24 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center px-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">
                    Example batch · Melbourne
                  </p>
                  <p className="text-2xl font-semibold text-slate-900">
                    $74.20
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Sample numbers showing how batches build. Not live yet.
                  </p>
                </div>
              </div>
              <div className="h-24 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-700 text-white shadow-lg flex flex-col justify-center px-4">
                <p className="text-[11px] text-slate-200">GoJack engine</p>
                <p className="text-sm font-semibold">Batch optimisation</p>
                <p className="text-[11px] text-slate-300 mt-1">
                  Learns local demand to keep per‑order costs fair.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <a
                href="#products"
                className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-slate-800"
              >
                Start shopping
              </a>
              <a
                href="#how-it-works"
                className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-800 hover:border-teal-500 hover:shadow-sm"
              >
                How batching works
              </a>
            </div>
          </div>

          {/* Animated flow – desktop, overlapped cards */}
          <div className="hidden md:block">
            <div className="relative h-72 w-full rounded-3xl bg-slate-950 text-slate-50 shadow-xl border border-slate-900 overflow-hidden">
              {/* Inner dotted frame */}
              <div className="absolute inset-6 rounded-2xl border border-dashed border-slate-700" />

              {/* Gradient line */}
              <div className="absolute left-10 right-10 top-1/2 h-px bg-gradient-to-r from-teal-400 via-emerald-400 to-amber-400" />

              {/* Card 1 – You */}
              <div className="absolute left-16 top-1/2 -translate-y-1/2 -translate-x-6">
                <div className="rounded-2xl bg-slate-900/80 border border-slate-700/80 px-4 py-3 shadow-lg shadow-slate-900/40 min-w-[190px]">
                  <p className="text-[11px] text-slate-400 mb-1">
                    Step 1 · You
                  </p>
                  <p className="text-xs font-semibold text-slate-50">
                    Add items at your own pace.
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    No chasing drivers or timers.
                  </p>
                </div>
              </div>

              {/* Card 2 – AI */}
              <div className="absolute left-1/2 top-6 -translate-x-1/2 ai-card-float">
                <div className="rounded-3xl bg-gradient-to-br from-teal-500 via-emerald-500 to-amber-400 px-5 py-4 shadow-2xl shadow-emerald-500/40 min-w-[220px]">
                  <p className="text-[11px] text-slate-100 mb-1">
                    Step 2 · GoJack AI
                  </p>
                  <p className="text-sm font-semibold text-white">
                    Groups nearby orders into smart batches.
                  </p>
                  <p className="text-[11px] text-emerald-50 mt-1">
                    Watches value and timing in your suburb.
                  </p>
                </div>
              </div>

              {/* Card 3 – Store & driver */}
              <div className="absolute right-10 bottom-8">
                <div className="rounded-2xl bg-slate-900/85 border border-slate-700/80 px-4 py-3 shadow-lg shadow-slate-900/40 min-w-[210px]">
                  <p className="text-[11px] text-slate-400 mb-1">
                    Step 3 · Store & driver
                  </p>
                  <p className="text-xs font-semibold text-slate-50">
                    Partner shop packs, driver collects.
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Batch goes out in one clear window.
                  </p>
                </div>
              </div>

              {/* GO pill under AI card */}
              <div className="absolute left-1/2 top-[4.5rem] -translate-x-1/2 translate-y-full">
                <span className="relative inline-flex h-7 w-7 items-center justify-center">
                  <span className="absolute inline-flex h-7 w-7 rounded-full bg-teal-500/40 animate-ping" />
                  <span className="relative inline-flex h-7 w-7 rounded-full bg-teal-500 text-[11px] text-white font-semibold items-center justify-center">
                    GO
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Simplified flow – mobile */}
          <div className="md:hidden">
            <div className="rounded-3xl bg-slate-950 text-slate-50 p-4 space-y-3 shadow-md border border-slate-800">
              <p className="text-xs text-slate-400">How GoJack works</p>
              <div className="space-y-2 text-[11px]">
                <p>1. You add items at your pace.</p>
                <p>2. GoJack AI groups orders nearby into a batch.</p>
                <p>3. Store prepares, driver delivers the whole batch.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Niche & category selector */}
      <section className="bg-white/90 border-b border-slate-200 sticky top-[72px] z-30 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4">
          <div className="flex overflow-x-auto gap-3 scrollbar-hide mb-3">
            {niches.map((niche) => (
              <button
                key={niche.id}
                onClick={() => {
                  setSelectedNiche(niche.id);
                  setSelectedCategory("all");
                }}
                className={`flex-shrink-0 px-4 py-2 rounded-2xl text-xs font-medium whitespace-nowrap border ${
                  selectedNiche === niche.id
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-slate-100 text-slate-700 border-slate-200 hover:border-teal-500"
                }`}
              >
                <span className="mr-2">{niche.icon}</span>
                {niche.name}
                <span className="ml-1 text-[10px] text-slate-400">
                  {niche.time}
                </span>
              </button>
            ))}
          </div>

          <div className="flex overflow-x-auto gap-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap border ${
                  selectedCategory === cat.id
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-slate-100 text-slate-700 border-slate-200 hover:border-teal-500"
                }`}
              >
                <span className="mr-1">{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white/90 border-b border-slate-200 sticky top-[128px] z-20 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex flex-wrap gap-3 items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-40 sm:w-64 px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:border-teal-500 focus:outline-none"
            />
            <div className="flex gap-1">
              {[
                { id: "price-asc", label: "Price ↑" },
                { id: "price-desc", label: "Price ↓" },
                { id: "discount", label: "Best deals" },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSortBy(option.id)}
                  className={`px-2.5 py-1.5 rounded-lg border ${
                    sortBy === option.id
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-slate-100 text-slate-700 border-slate-200 hover:border-teal-500"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="text-slate-500">
            {filteredProducts.length} items · batch ${cartTotalValue.toFixed(0)}
            /100
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="h-64 bg-slate-100 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-lg font-semibold text-slate-900 mb-1">
                No products match right now
              </p>
              <p className="text-sm text-slate-500 mb-4">
                Try another time of day or clear the search.
              </p>
              <button
                onClick={() => {
                  setSelectedNiche("morning");
                  setSelectedCategory("all");
                  setSearchTerm("");
                }}
                className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
                    className="group bg-white/90 border border-slate-200 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col"
                  >
                    <div className="relative h-36 md:h-40 bg-slate-100 flex items-center justify-center overflow-hidden">
                      {discount > 0 && (
                        <div className="absolute top-2 left-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                          {discount}% OFF
                        </div>
                      )}
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                          {product.brand || "GoJack"}
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex-1 flex flex-col justify-between gap-2">
                      <div>
                        <p className="text-[11px] text-slate-500 mb-0.5">
                          {product.brand}
                        </p>
                        <h3 className="text-xs font-semibold text-slate-900 line-clamp-2">
                          {product.name}
                        </h3>
                      </div>
                      <div className="flex items-end justify-between mt-1">
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
                          className="rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-slate-800"
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
      <section
        id="how-it-works"
        className="border-t border-slate-200 bg-white/90 backdrop-blur py-10"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            How GoJack fits into your day
          </h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-slate-700">
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
              <p className="text-xs text-slate-500 mb-1">
                01 · Time‑based niches
              </p>
              <p className="font-medium mb-1">Shop around your routine</p>
              <p className="text-xs text-slate-600">
                Morning coffee, school snacks, dinner prep – each niche surfaces
                the most relevant items.
              </p>
            </div>
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
              <p className="text-xs text-slate-500 mb-1">02 · Smart batching</p>
              <p className="font-medium mb-1">Orders grouped by suburb</p>
              <p className="text-xs text-slate-600">
                AI watches demand spikes and locks in batches when value and
                timing line up.
              </p>
            </div>
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
              <p className="text-xs text-slate-500 mb-1">
                03 · Simple delivery
              </p>
              <p className="font-medium mb-1">Store to door, clearly</p>
              <p className="text-xs text-slate-600">
                Status stays clear without noisy maps, just the steps that
                matter.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-slate-200 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-3">
            <span className="text-lg">🛒</span>
            <div>
              <p className="font-medium text-slate-900">
                {cartTotalItems} item{cartTotalItems !== 1 ? "s" : ""} in batch
              </p>
              <p className="text-[11px] text-slate-500">
                Batch value ${cartTotalValue.toFixed(2)} · target $100
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCart(true)}
            className="rounded-full bg-slate-900 px-4 py-2 text-[11px] sm:text-xs font-semibold text-white shadow-sm disabled:bg-slate-400"
            disabled={cartTotalItems === 0}
          >
            {cartTotalItems === 0 ? "Add items to proceed" : "Review batch"}
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
        @keyframes float-soft {
          0%,
          100% {
            transform: translateX(-50%) translateY(0);
          }
          50% {
            transform: translateX(-50%) translateY(-6px);
          }
        }
        .ai-card-float {
          animation: float-soft 8s ease-in-out infinite;
        }
      `}</style>
    </div>

);
}
