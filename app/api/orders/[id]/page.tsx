"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";

export default function OrderStatus() {
  const params = useParams();
  const [order, setOrder] = useState<any>(null);
  const [batchTotal, setBatchTotal] = useState(0);

  useEffect(() => {
    fetchOrder();

    const subscription = supabase
      .channel(`order-${params.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${params.id}`,
        },
        fetchOrder
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [params.id]);

  async function fetchOrder() {
    const { data: orderData } = await supabase
      .from("orders")
      .select("*, stores(name)")
      .eq("id", params.id)
      .single();

    setOrder(orderData);

    if (orderData?.status === "pending") {
      // Calculate batch total
      const { data: batchOrders } = await supabase
        .from("orders")
        .select("total")
        .eq("delivery_date", orderData.delivery_date)
        .eq("store_id", orderData.store_id)
        .eq("status", "pending");

      const total = batchOrders?.reduce((sum, o) => sum + o.total, 0) || 0;
      setBatchTotal(total);
    }
  }

  if (!order) return <div className="p-8">Loading order...</div>;

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    ready: "bg-blue-100 text-blue-800",
    delivered: "bg-green-100 text-green-800",
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Order Status</h1>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Order ID</span>
          <span className="font-mono">{order.id.slice(0, 8)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Status</span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              statusColors[order.status]
            }`}
          >
            {order.status.toUpperCase()}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Store</span>
          <span className="font-medium">{order.stores.name}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Delivery Date</span>
          <span className="font-medium">
            {new Date(order.delivery_date).toLocaleDateString()}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Total</span>
          <span className="text-xl font-bold">${order.total.toFixed(2)}</span>
        </div>

        {order.status === "pending" && (
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="font-semibold mb-2">⏳ Waiting for Batch</h3>
            <p className="text-sm text-gray-700 mb-2">
              Your order will be prepared once the batch reaches $100.
            </p>
            <div className="flex justify-between text-sm">
              <span>Current batch total:</span>
              <span className="font-bold">${batchTotal.toFixed(2)} / $100</span>
            </div>
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(batchTotal, 100)}%` }}
              />
            </div>
          </div>
        )}

        {order.status === "ready" && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold">🚚 Out for Delivery</h3>
            <p className="text-sm text-gray-700">
              Your order is being prepared and will be delivered soon!
            </p>
          </div>
        )}

        {order.status === "delivered" && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-semibold">✅ Delivered</h3>
            <p className="text-sm text-gray-700">
              Your order has been delivered. Thank you!
            </p>
          </div>
        )}

        <div className="pt-4 border-t">
          <h3 className="font-semibold mb-2">Items</h3>
          {JSON.parse(order.items).map((item: any, idx: number) => (
            <div key={idx} className="flex justify-between text-sm py-1">
              <span>
                {item.name} × {item.quantity}
              </span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
