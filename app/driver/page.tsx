"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DriverDashboard() {
  const [readyOrders, setReadyOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchReadyOrders();
  }, []);

  async function fetchReadyOrders() {
    const { data } = await supabase
      .from("orders")
      .select("*, stores(name, location)")
      .eq("status", "ready")
      .eq("delivery_date", new Date().toISOString().split("T")[0])
      .order("created_at");

    setReadyOrders(data || []);
  }

  async function markDelivered(orderId: string) {
    await supabase
      .from("orders")
      .update({ status: "delivered" })
      .eq("id", orderId);

    fetchReadyOrders();
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">
        🚗 Driver Dashboard - Today's Deliveries
      </h1>

      {readyOrders.length === 0 ? (
        <p className="text-gray-500">No deliveries scheduled for today</p>
      ) : (
        <div className="space-y-4">
          {readyOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white border rounded-lg p-4 shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">
                    {order.customer_name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {order.customer_phone}
                  </p>
                  <p className="text-sm text-gray-600">
                    {order.delivery_address}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Store: {order.stores.name}
                  </p>
                </div>
                <span className="text-xl font-bold">
                  ${order.total.toFixed(2)}
                </span>
              </div>

              <button
                onClick={() => markDelivered(order.id)}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
              >
                ✓ Mark Delivered
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
