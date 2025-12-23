"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface CartItem {
  id: string;
  name: string;
  price: number;
  shelf_price: number;
  quantity: number;
  image_url?: string;
}

interface CartProps {
  cart: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

export default function Cart({
  cart,
  onUpdateQuantity,
  onRemove,
  onClose,
}: CartProps) {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    delivery_date: "",
  });

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const savings = cart.reduce(
    (sum, item) => sum + (item.shelf_price - item.price) * item.quantity,
    0
  );
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  async function handleCheckout() {
    if (cart.length === 0) return;

    if (
      !customerInfo.name ||
      !customerInfo.email ||
      !customerInfo.phone ||
      !customerInfo.address ||
      !customerInfo.delivery_date
    ) {
      alert("Please fill in all fields");
      return;
    }

    setIsCheckingOut(true);

    try {
      const orderData = {
        store_id: "00000000-0000-0000-0000-000000000001",
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        delivery_address: customerInfo.address,
        delivery_date: customerInfo.delivery_date,
        items: JSON.stringify(
          cart.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          }))
        ),
        total: subtotal,
        status: "pending",
      };

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        console.error("Order creation error:", orderError);
        alert("Failed to create order. Please try again.");
        setIsCheckingOut(false);
        return;
      }

      alert(`✓ Order placed successfully! Order ID: ${order.id.slice(0, 8)}`);
      window.location.href = `/orders/${order.id}`;
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Checkout failed. Please try again.");
      setIsCheckingOut(false);
    }
  }

  if (cart.length === 0) {
    return (
      <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-3xl">
            🛒
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-1">
            Your cart is empty
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Browse products and tap “Add” to start building your GoJack batch.
          </p>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition"
          >
            Continue shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex">
      {/* Backdrop */}
      <div
        className="flex-1 bg-black/40"
        onClick={() => {
          if (!isCheckingOut) onClose();
        }}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md sm:max-w-lg bg-white shadow-2xl h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Your GoJack cart
            </p>
            <p className="text-xs text-slate-500">
              {itemCount} item{itemCount !== 1 ? "s" : ""} · Batch target $100
            </p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
          >
            ×
          </button>
        </div>

        {!showCheckoutForm ? (
          <>
            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {cart.map((item) => {
                const lineTotal = item.price * item.quantity;
                const lineSaving =
                  item.shelf_price > item.price
                    ? (item.shelf_price - item.price) * item.quantity
                    : 0;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3"
                  >
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-14 w-14 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-xl bg-slate-100 flex items-center justify-center text-[10px] uppercase tracking-[0.2em] text-slate-400">
                        GJ
                      </div>
                    )}

                    <div className="flex-1 space-y-1">
                      <p className="text-xs font-medium text-slate-900 line-clamp-2">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-emerald-600">
                          ${item.price.toFixed(2)}
                        </span>
                        {item.shelf_price > item.price && (
                          <span className="text-[11px] text-slate-400 line-through">
                            ${item.shelf_price.toFixed(2)}
                          </span>
                        )}
                      </div>
                      {lineSaving > 0 && (
                        <p className="text-[11px] text-emerald-600">
                          Saving ${lineSaving.toFixed(2)} on this item
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="inline-flex items-center rounded-full bg-white border border-slate-200">
                        <button
                          onClick={() =>
                            onUpdateQuantity(
                              item.id,
                              Math.max(0, item.quantity - 1)
                            )
                          }
                          className="h-7 w-7 flex items-center justify-center text-xs text-slate-600 hover:bg-slate-100 rounded-full"
                        >
                          −
                        </button>
                        <span className="w-7 text-center text-xs font-semibold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            onUpdateQuantity(item.id, item.quantity + 1)
                          }
                          className="h-7 w-7 flex items-center justify-center text-xs text-slate-600 hover:bg-slate-100 rounded-full"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => onRemove(item.id)}
                        className="text-[11px] text-rose-500 hover:text-rose-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="border-t border-slate-200 px-5 py-4 space-y-3 bg-white">
              <div className="flex justify-between text-xs text-slate-600">
                <span>
                  Subtotal ({itemCount} item{itemCount !== 1 ? "s" : ""})
                </span>
                <span className="font-semibold text-slate-900">
                  ${subtotal.toFixed(2)}
                </span>
              </div>

              {savings > 0 && (
                <div className="flex justify-between text-xs text-emerald-600">
                  <span>Your batch savings vs shelf</span>
                  <span className="font-semibold">−${savings.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-200">
                <span className="text-sm font-medium text-slate-900">
                  Estimated total
                </span>
                <span className="text-lg font-semibold text-slate-900">
                  ${subtotal.toFixed(2)}
                </span>
              </div>

              {subtotal < 100 && (
                <div className="rounded-2xl bg-indigo-50 border border-indigo-100 px-3 py-2 text-[11px] text-indigo-700">
                  Current batch is at <strong>${subtotal.toFixed(2)}</strong>.
                  Orders in your area are grouped until the combined total hits{" "}
                  <strong>$100</strong>, then dispatched together.
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:border-slate-400"
                >
                  Keep browsing
                </button>
                <button
                  onClick={() => setShowCheckoutForm(true)}
                  className="flex-1 rounded-full bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700"
                >
                  Proceed to checkout
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Checkout form */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Delivery details
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block mb-1 text-slate-600">
                    Full name *
                  </label>
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) =>
                      setCustomerInfo({ ...customerInfo, name: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-600">
                    Email address *
                  </label>
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        email: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-600">
                    Phone number *
                  </label>
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        phone: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="04XX XXX XXX"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-600">
                    Delivery address *
                  </label>
                  <textarea
                    value={customerInfo.address}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        address: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="123 Main St, Suburb, VIC 3000"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-600">
                    Preferred delivery date *
                  </label>
                  <input
                    type="date"
                    value={customerInfo.delivery_date}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        delivery_date: e.target.value,
                      })
                    }
                    min={minDate}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    Actual day may shift slightly depending on when your batch
                    crosses $100.
                  </p>
                </div>
              </div>
            </div>

            {/* Checkout actions */}
            <div className="border-t border-slate-200 px-5 py-4 space-y-3 bg-white">
              <div className="flex justify-between text-sm font-medium text-slate-900">
                <span>Total</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowCheckoutForm(false)}
                  disabled={isCheckingOut}
                  className="flex-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:border-slate-400 disabled:opacity-60"
                >
                  Back to cart
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className={`flex-1 rounded-full px-4 py-2 text-xs font-medium text-white ${
                    isCheckingOut
                      ? "bg-slate-400 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  {isCheckingOut ? "Processing…" : "Place order"}
                </button>
              </div>

              <p className="text-[11px] text-slate-500 text-center">
                Payment on delivery for now. Online payments will be enabled in
                the next release.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
