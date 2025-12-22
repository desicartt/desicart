"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  delivery_date: string;
  total: number;
  status: string;
  store_id: string;
  items: string;
  created_at: string;
  stores: {
    name: string;
    location: any;
  };
}

interface Batch {
  delivery_date: string;
  store: string;
  store_id: string;
  orders: Order[];
  total: number;
}

export default function AdminDashboard() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingBatch, setProcessingBatch] = useState<string | null>(null);

  useEffect(() => {
    fetchBatches();

    // Realtime updates when new orders come in
    const subscription = supabase
      .channel("orders-admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        fetchBatches
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchBatches() {
    const { data: orders } = await supabase
      .from("orders")
      .select("*, stores(name, location)")
      .eq("status", "pending")
      .order("delivery_date");

    if (!orders) {
      setLoading(false);
      return;
    }

    // Group by delivery_date + store_id
    const grouped = orders.reduce(
      (acc: Record<string, Batch>, order: Order) => {
        const key = `${order.delivery_date}-${order.store_id}`;
        if (!acc[key]) {
          acc[key] = {
            delivery_date: order.delivery_date,
            store: order.stores.name,
            store_id: order.store_id,
            orders: [],
            total: 0,
          };
        }
        acc[key].orders.push(order);
        acc[key].total += order.total;
        return acc;
      },
      {}
    );

    setBatches(Object.values(grouped));
    setLoading(false);
  }

  async function markBatchReady(batch: Batch) {
    const batchKey = `${batch.delivery_date}-${batch.store_id}`;
    setProcessingBatch(batchKey);

    try {
      // Update all orders in batch to 'ready'
      const orderIds = batch.orders.map((o) => o.id);
      const { error: updateError } = await supabase
        .from("orders")
        .update({ status: "ready" })
        .in("id", orderIds);

      if (updateError) {
        console.error("Error updating orders:", updateError);
        alert("Failed to update orders");
        setProcessingBatch(null);
        return;
      }

      // Send email notifications to all customers
      const notificationPromises = batch.orders.map((order) =>
        fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order.id,
            customerEmail: order.customer_email,
            customerName: order.customer_name,
            status: "ready",
          }),
        }).catch((err) => {
          console.error(`Failed to notify ${order.customer_email}:`, err);
          // Continue even if notification fails
        })
      );

      await Promise.all(notificationPromises);

      // Refresh batches
      await fetchBatches();
      alert(`✓ Batch marked ready! ${batch.orders.length} customers notified.`);
    } catch (error) {
      console.error("Error processing batch:", error);
      alert("Error processing batch");
    } finally {
      setProcessingBatch(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading batches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">DesiCart Admin</h1>
          <p className="text-gray-600 mt-2">
            Manage order batches and deliveries
          </p>
        </div>

        {batches.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Pending Orders
            </h2>
            <p className="text-gray-500">
              Orders will appear here once customers place them
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {batches.map((batch) => {
              const batchKey = `${batch.delivery_date}-${batch.store_id}`;
              const isProcessing = processingBatch === batchKey;
              const isReady = batch.total >= 100;
              const remaining = 100 - batch.total;

              return (
                <div
                  key={batchKey}
                  className="bg-white border rounded-lg shadow-sm overflow-hidden"
                >
                  {/* Header */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 border-b">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-1">
                          {batch.store}
                        </h2>
                        <p className="text-gray-600 text-sm mb-1">
                          📅 Delivery:{" "}
                          {new Date(batch.delivery_date).toLocaleDateString(
                            "en-AU",
                            {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </p>
                        <p className="text-gray-500 text-sm">
                          📋 {batch.orders.length} order
                          {batch.orders.length !== 1 ? "s" : ""}
                        </p>
                      </div>

                      <div className="text-right">
                        <p
                          className={`text-4xl font-bold mb-1 ${
                            isReady ? "text-green-600" : "text-orange-500"
                          }`}
                        >
                          ${batch.total.toFixed(2)}
                        </p>
                        {isReady ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            ✓ Ready to Process
                          </span>
                        ) : (
                          <p className="text-sm text-gray-600">
                            ${remaining.toFixed(2)} until $100
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {!isReady && (
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Batch Progress</span>
                          <span>{Math.round((batch.total / 100) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-orange-400 to-orange-500 h-3 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(
                                (batch.total / 100) * 100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Orders List */}
                  <div className="p-6">
                    <div className="space-y-3">
                      {batch.orders.map((order) => (
                        <div
                          key={order.id}
                          className="flex justify-between items-center bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {order.customer_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {order.customer_phone}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {order.delivery_address}
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            <p className="font-bold text-lg text-gray-900">
                              ${order.total.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(order.created_at).toLocaleTimeString(
                                "en-AU",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  {isReady && (
                    <div className="p-6 bg-gray-50 border-t">
                      <button
                        onClick={() => markBatchReady(batch)}
                        disabled={isProcessing}
                        className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all ${
                          isProcessing
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700 hover:shadow-lg"
                        }`}
                      >
                        {isProcessing ? (
                          <span className="flex items-center justify-center">
                            <svg
                              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Processing & Notifying...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center">
                            ✓ Mark Batch Ready & Notify {batch.orders.length}{" "}
                            Customer{batch.orders.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Stats Summary */}
        {batches.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm mb-1">Total Pending Orders</p>
              <p className="text-3xl font-bold text-gray-900">
                {batches.reduce((sum, b) => sum + b.orders.length, 0)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm mb-1">Total Pending Value</p>
              <p className="text-3xl font-bold text-gray-900">
                ${batches.reduce((sum, b) => sum + b.total, 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm mb-1">Ready Batches</p>
              <p className="text-3xl font-bold text-green-600">
                {batches.filter((b) => b.total >= 100).length}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
