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

/* NEW: batch types */
interface BatchInsert {
  id?: string;
  profile_id?: string | null;
  session_id?: string | null;
  suburb?: string | null;
  time_slot?: string | null;
  status?: string;
  total_value: number;
}

interface BatchItemInsert {
  id?: string;
  batch_id: string;
  product_id: string;
  name: string;
  brand?: string | null;
  unit_price: number;
  quantity: number;
}

/* UPDATED: Cart now accepts onCheckout */
function Cart({
  cart,
  onUpdateQuantity,
  onRemove,
  onClose,
  onCheckout,
}: {
  cart: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
  onCheckout: () => void;
}) {
  const total = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);

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
          <button
            onClick={onCheckout}
            className="mt-2 w-full rounded-full bg-slate-900 text-white text-sm font-semibold py-2.5 hover:bg-slate-800 disabled:bg-slate-400"
            disabled={cart.length === 0}
          >
            Confirm batch & save
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

  /* NEW: session + time slot */
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [timeSlot, setTimeSlot] = useState<string | null>(null);

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

  /* NEW: initialise anonymous session id */
  useEffect(() => {
    const key = "gojack_session_id";
    if (typeof window === "undefined") return;
    const existing = window.localStorage.getItem(key);
    if (existing) {
      setSessionId(existing);
    } else {
      const id = crypto.randomUUID();
      window.localStorage.setItem(key, id);
      setSessionId(id);
    }
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

  /* NEW: checkout handler */
  async function handleCheckout() {
    if (cart.length === 0) return;
    if (!sessionId) {
      alert("Session not ready yet. Please wait a moment and try again.");
      return;
    }

    const total = cart.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );

    const batchPayload: BatchInsert = {
      session_id: sessionId,
      suburb: null,
      time_slot: timeSlot ?? "today-evening",
      status: "pending",
      total_value: Number(total.toFixed(2)),
    };

    const { data: batchData, error: batchError } = await supabase
      .from("batches")
      .insert(batchPayload)
      .select("id")
      .single();

    if (batchError || !batchData) {
      console.error("Error creating batch", batchError);
      alert("Could not create batch. Please try again.");
      return;
    }

    const batchId = batchData.id as string;

    const itemsPayload: BatchItemInsert[] = cart.map((item) => ({
      batch_id: batchId,
      product_id: item.id,
      name: item.name,
      brand: item.brand ?? null,
      unit_price: Number(item.price.toFixed(2)),
      quantity: item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from("batch_items")
      .insert(itemsPayload);

    if (itemsError) {
      console.error("Error inserting batch items", itemsError);
      alert("Batch created but items failed. Please contact support.");
      return;
    }

    setCart([]);
    setShowCart(false);
    alert(
      "Your batch has been created. GoJack will group it with nearby orders."
    );
  }

  const cartTotalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotalValue = cart.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-slate-50 text-slate-900 pb-24">
      {/* Header */}
      {/* ... all your existing JSX from header, hero, selectors, products, how-it-works, footer ... */}

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
          onCheckout={handleCheckout}
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
