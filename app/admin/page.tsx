// app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Product {
  id: string;
  name: string;
  price: number;
  shelf_price: number;
  image_url: string | null;
  category: string | null;
}

const CATEGORY_OPTIONS = [
  "rice",
  "spices",
  "lentils",
  "snacks",
  "beverages",
  "other",
];

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const { data } = await supabase
      .from("products")
      .select("id, name, price, shelf_price, image_url, category")
      .order("name");

    setProducts((data as Product[]) || []);
    setLoading(false);
  }

  function handleLocalChange(id: string, field: keyof Product, value: string) {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  }

  async function saveProduct(product: Product) {
    setSavingId(product.id);

    const { error } = await supabase
      .from("products")
      .update({
        image_url: product.image_url,
        category: product.category,
      })
      .eq("id", product.id);

    setSavingId(null);

    if (error) {
      console.error(error);
      alert("Failed to save product");
      return;
    }

    alert("Product updated");
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-500">Loading products…</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-[600px]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            GoJack · Product Admin
          </h1>
          <p className="text-xs text-slate-500">
            Set categories and image URLs for each product.
          </p>
        </div>
        <button
          onClick={fetchProducts}
          className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-xs font-medium text-slate-700 hover:border-primary-500"
        >
          Refresh
        </button>
      </div>

      <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden">
        <div className="grid grid-cols-[2fr,1.5fr,1fr,auto] gap-4 px-4 py-2 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
          <div>Name</div>
          <div>Image URL</div>
          <div>Category</div>
          <div></div>
        </div>

        <div className="max-h-[480px] overflow-y-auto divide-y divide-slate-100">
          {products.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-[2fr,1.5fr,1fr,auto] gap-4 px-4 py-3 items-center text-[13px]"
            >
              <div>
                <div className="font-medium text-slate-900">{p.name}</div>
                <div className="text-[11px] text-slate-400">
                  ${p.price.toFixed(2)} · Shelf ${p.shelf_price.toFixed(2)}
                </div>
              </div>

              <div>
                <input
                  type="text"
                  value={p.image_url || ""}
                  onChange={(e) =>
                    handleLocalChange(p.id, "image_url", e.target.value)
                  }
                  placeholder="https://…"
                  className="w-full rounded-md border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs text-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <select
                  value={p.category || ""}
                  onChange={(e) =>
                    handleLocalChange(p.id, "category", e.target.value)
                  }
                  className="w-full rounded-md border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs text-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">Unset</option>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                {p.image_url && (
                  <div className="h-8 w-8 rounded-md overflow-hidden border border-slate-200 bg-slate-100">
                    <img
                      src={p.image_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <button
                  onClick={() => saveProduct(p)}
                  disabled={savingId === p.id}
                  className="rounded-full bg-primary-500 px-3 py-1 text-[11px] font-medium text-white hover:bg-primary-600 disabled:bg-slate-300"
                >
                  {savingId === p.id ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
