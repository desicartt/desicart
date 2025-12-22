"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [cartTotal, setCartTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    // Fetch products
    supabase
      .from("products")
      .select("*")
      .then(({ data }) => {
        if (data) setProducts(data);
      });

    // Realtime orders
    const channel = supabase
      .channel("orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload: any) => {
          setOrders((prev) => [payload.new, ...prev.slice(0, 4)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addToCart = (product: any) => {
    setCart([...cart, product]);
    setCartTotal((prev) => prev + product.price);
  };

  const placeOrder = async () => {
    if (cartTotal < 100) {
      alert("Free delivery over $100");
      return;
    }
    setLoading(true);
    const storeId = products[0]?.store_id || "";

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_id: "poc-customer-uuid",
        store_id: storeId,
        items: cart.map((item) => ({ id: item.id, qty: 1, price: item.price })),
      }),
    });

    if (res.ok) {
      setCart([]);
      setCartTotal(0);
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div className="p-4 space-y-4 pb-32">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent">
          DesiCart
        </h1>
        <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
          {cart.length}
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-2">Same Day Grocery</h2>
        <p className="text-gray-600">
          Free over $100 • 2hr prep • 30% off shelf
        </p>
        <p className="text-lg font-bold text-emerald-600 mt-2">
          Cart Total: ${cartTotal.toFixed(2)}
        </p>
      </div>

      <div className="space-y-4">
        {products.map((product) => (
          <div key={product.id} className="card">
            <div className="flex items-start space-x-3">
              <img
                src={product.image_url || "/placeholder-rice.jpg"}
                alt={product.name}
                className="w-20 h-20 rounded-xl object-cover"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{product.name}</h3>
                <p className="text-sm text-gray-500">
                  ${product.price}{" "}
                  <span className="line-through text-xs">
                    was ${product.shelf_price}
                  </span>
                </p>
                <button
                  onClick={() => addToCart(product)}
                  className="btn-primary text-sm mt-2"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-4 left-4 right-4 z-40 max-w-md mx-auto">
        <button
          onClick={placeOrder}
          disabled={loading || cartTotal < 100}
          className="btn-primary text-lg shadow-2xl"
        >
          {loading
            ? "Ordering..."
            : `Checkout Free Delivery ($${cartTotal.toFixed(2)})`}
        </button>
      </div>

      {orders.length > 0 && (
        <div className="card mt-4">
          <h3 className="font-semibold mb-2">Recent Orders</h3>
          {orders.map((order) => (
            <div key={order.id} className="py-1 text-sm">
              {order.status} - ${order.total}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
