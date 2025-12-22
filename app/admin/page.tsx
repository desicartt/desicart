"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Admin() {
  const [orders, setOrders] = useState([]);
  const [revenue, setRevenue] = useState(0);

  useEffect(() => {
    supabase
      .channel("orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => fetchData()
      )
      .subscribe();
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: ords } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    setOrders(ords || []);
    setRevenue(
      (ords?.filter((o: any) => o.status === "delivered").length || 0) * 10
    );
  };

  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = new FormData(e.target as HTMLFormElement);
    const file = form.get("image") as File;
    if (file) {
      const { data } = await supabase.storage
        .from("product-images")
        .upload(Date.now().toString(), file);
      await supabase
        .from("products")
        .insert({
          name: form.get("name"),
          price: Number(form.get("price")),
          image_url: data?.path,
        });
      fetchData();
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-3xl font-bold">Control Room</h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="card bg-blue-500 text-white">
          Orders: {orders.length}
        </div>
        <div className="card bg-green-500 text-white">Revenue: ${revenue}</div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h2>Live Orders</h2>
          {orders.slice(0, 5).map((order: any) => (
            <div key={order.id} className="py-2 border-b">
              #{order.id.slice(-4)} {order.status}
            </div>
          ))}
        </div>
        <form onSubmit={addProduct} className="card space-y-2">
          <input
            name="name"
            placeholder="Product Name"
            className="w-full p-2 border rounded"
          />
          <input
            name="price"
            type="number"
            placeholder="12.50"
            className="w-full p-2 border rounded"
          />
          <input
            name="image"
            type="file"
            className="w-full p-2 border rounded"
          />
          <button type="submit" className="btn-primary">
            Add Product
          </button>
        </form>
      </div>
    </div>
  );
}
