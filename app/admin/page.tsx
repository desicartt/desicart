// app/admin/page.tsx
"use client";

import { useEffect, useState, ChangeEvent, FormEvent } from "react";
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

const STORAGE_BUCKET = "product-images"; // make sure this bucket exists and is public

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    shelf_price: "",
    image_url: "",
    category: "",
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);

    const { data, error } = await supabase
      .from("products")
      .select("id, name, price, shelf_price, image_url, category")
      .order("name");

    if (error) {
      console.error(error);
      alert("Failed to load products");
      setLoading(false);
      return;
    }

    const normalised: Product[] =
      (data || []).map((p: any) => ({
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

  function handleLocalChange(
    id: string,
    field: keyof Product,
    value: string | number | null
  ) {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value as any } : p))
    );
  }

  async function saveProduct(product: Product) {
    setSavingId(product.id);

    const { error } = await supabase
      .from("products")
      .update({
        name: product.name,
        price: product.price,
        shelf_price: product.shelf_price,
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

    await fetchProducts();
  }

  async function deleteProduct(id: string) {
    if (!confirm("Delete this product?")) return;

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      console.error(error);
      alert("Failed to delete product");
      return;
    }

    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleImageUpload(
    id: string,
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop();
    const filePath = `${id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error(uploadError);
      alert("Failed to upload image");
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

    handleLocalChange(id, "image_url", publicUrl);

    const { error: updateError } = await supabase
      .from("products")
      .update({ image_url: publicUrl })
      .eq("id", id);

    if (updateError) {
      console.error(updateError);
      alert("Failed to save image URL");
      return;
    }
  }

  function handleNewChange(field: keyof typeof newProduct, value: string) {
    setNewProduct((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) {
      alert("Name and price are required");
      return;
    }

    setCreating(true);

    const { error } = await supabase.from("products").insert({
      name: newProduct.name,
      price: parseFloat(newProduct.price),
      shelf_price: newProduct.shelf_price
        ? parseFloat(newProduct.shelf_price)
        : parseFloat(newProduct.price),
      image_url: newProduct.image_url || null,
      category: newProduct.category || null,
      // store_id: ... // set if you use stores
    });

    setCreating(false);

    if (error) {
      console.error(error);
      alert("Failed to create product");
      return;
    }

    setNewProduct({
      name: "",
      price: "",
      shelf_price: "",
      image_url: "",
      category: "",
    });

    await fetchProducts();
  }

  return (
    <div className="min-h-[600px] bg-slate-50 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            GoJack · Product Admin
          </h1>
          <p className="text-xs text-slate-500">
            Create, edit, upload images and manage categories.
          </p>
        </div>
        <button
          onClick={fetchProducts}
          className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-xs font-medium text-slate-700 hover:border-indigo-500"
        >
          Refresh
        </button>
      </div>

      {/* Create new product */}
      <form
        onSubmit={handleCreate}
        className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <h2 className="text-sm font-semibold text-slate-800 mb-3">
          Add new product
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr,1fr,1.5fr,1fr,auto] gap-3 items-end text-xs">
          <div>
            <label className="block text-[11px] text-slate-500 mb-1">
              Name
            </label>
            <input
              type="text"
              value={newProduct.name}
              onChange={(e) => handleNewChange("name", e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-500 mb-1">
              Price
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={newProduct.price}
              onChange={(e) => handleNewChange("price", e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-500 mb-1">
              Shelf price
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={newProduct.shelf_price}
              onChange={(e) => handleNewChange("shelf_price", e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="Defaults to price"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-500 mb-1">
              Image URL (optional)
            </label>
            <input
              type="text"
              value={newProduct.image_url}
              onChange={(e) => handleNewChange("image_url", e.target.value)}
              placeholder="https://…"
              className="w-full rounded-md border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-500 mb-1">
              Category
            </label>
            <select
              value={newProduct.category}
              onChange={(e) => handleNewChange("category", e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Select</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="h-[36px] rounded-full bg-indigo-600 px-4 text-[11px] font-medium text-white hover:bg-indigo-700 disabled:bg-slate-300"
          >
            {creating ? "Creating…" : "Add"}
          </button>
        </div>
      </form>

      {/* Product list */}
      <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden">
        <div className="grid grid-cols-[2fr,1fr,1fr,1.5fr,1fr,auto] gap-4 px-4 py-2 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
          <div>Name</div>
          <div>Price</div>
          <div>Shelf</div>
          <div>Image URL / Upload</div>
          <div>Category</div>
          <div></div>
        </div>

        {loading ? (
          <div className="p-4 text-xs text-slate-500">Loading…</div>
        ) : (
          <div className="max-h-[480px] overflow-y-auto divide-y divide-slate-100">
            {products.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-[2fr,1fr,1fr,1.5fr,1fr,auto] gap-4 px-4 py-3 items-center text-[13px]"
              >
                {/* Name */}
                <div>
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) =>
                      handleLocalChange(p.id, "name", e.target.value)
                    }
                    className="w-full rounded-md border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Price */}
                <div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={p.price}
                    onChange={(e) =>
                      handleLocalChange(
                        p.id,
                        "price",
                        parseFloat(e.target.value || "0")
                      )
                    }
                    className="w-full rounded-md border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Shelf price */}
                <div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={p.shelf_price}
                    onChange={(e) =>
                      handleLocalChange(
                        p.id,
                        "shelf_price",
                        parseFloat(e.target.value || "0")
                      )
                    }
                    className="w-full rounded-md border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Image URL + upload */}
                <div>
                  <input
                    type="text"
                    value={p.image_url || ""}
                    onChange={(e) =>
                      handleLocalChange(p.id, "image_url", e.target.value)
                    }
                    placeholder="https://…"
                    className="mb-1 w-full rounded-md border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  <div className="flex items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center rounded-full border border-slate-300 bg-slate-50 px-2 py-1 text-[10px] text-slate-600 hover:border-indigo-500">
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(p.id, e)}
                      />
                    </label>
                    {p.image_url && (
                      <div className="h-8 w-8 rounded-md overflow-hidden border border-slate-200 bg-slate-100">
                        <img
                          src={p.image_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <select
                    value={p.category || ""}
                    onChange={(e) =>
                      handleLocalChange(p.id, "category", e.target.value)
                    }
                    className="w-full rounded-md border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">Unset</option>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => saveProduct(p)}
                    disabled={savingId === p.id}
                    className="rounded-full bg-indigo-600 px-3 py-1 text-[11px] font-medium text-white hover:bg-indigo-700 disabled:bg-slate-300"
                  >
                    {savingId === p.id ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={() => deleteProduct(p.id)}
                    className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
