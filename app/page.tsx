"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Cart from "@/components/Cart";

interface Product {
  id: string;
  name: string;
  price: number;
  shelf_price: number;
  image_url?: string;
  category?: string;
}

interface CartItem extends Product {
  quantity: number;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const { data } = await supabase.from("products").select("*").order("name");

    setProducts(data || []);
    setLoading(false);
  }

  function addToCart(product: Product) {
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  }

  function updateQuantity(id: string, quantity: number) {
    if (quantity === 0) {
      setCart(cart.filter((item) => item.id !== id));
    } else {
      setCart(
        cart.map((item) => (item.id === id ? { ...item, quantity } : item))
      );
    }
  }

  function removeFromCart(id: string) {
    setCart(cart.filter((item) => item.id !== id));
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-2xl">🛒</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent">
                DesiCart
              </h1>
            </div>

            <nav className="hidden md:flex space-x-8">
              <a
                href="#products"
                className="text-gray-700 hover:text-orange-600 font-medium"
              >
                Products
              </a>
              <a
                href="#how-it-works"
                className="text-gray-700 hover:text-orange-600 font-medium"
              >
                How It Works
              </a>
              <a
                href="/admin"
                className="text-gray-700 hover:text-orange-600 font-medium"
              >
                Admin
              </a>
            </nav>

            <button
              onClick={() => setShowCart(true)}
              className="relative bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2 rounded-full hover:shadow-lg transition-all flex items-center space-x-2"
            >
              <span className="text-xl">🛒</span>
              <span className="font-semibold">Cart</span>
              {cartTotal > 0 && (
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {cartTotal}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Indian Groceries
                <span className="block bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent">
                  Delivered Fresh
                </span>
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Save up to 40% with our batch delivery system. Orders ship when
                they reach $100 in your area.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="#products"
                  className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-full font-semibold hover:shadow-xl transition-all"
                >
                  Shop Now
                </a>
                <a
                  href="#how-it-works"
                  className="bg-white text-gray-700 px-8 py-4 rounded-full font-semibold border-2 border-gray-300 hover:border-orange-500 transition-all"
                >
                  Learn More
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl p-6 text-center">
                  <div className="text-4xl mb-2">🌾</div>
                  <p className="font-semibold text-gray-700">Premium Rice</p>
                </div>
                <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-2xl p-6 text-center mt-8">
                  <div className="text-4xl mb-2">🌶️</div>
                  <p className="font-semibold text-gray-700">Fresh Spices</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl p-6 text-center">
                  <div className="text-4xl mb-2">🫘</div>
                  <p className="font-semibold text-gray-700">Lentils & Daal</p>
                </div>
                <div className="bg-gradient-to-br from-red-100 to-red-200 rounded-2xl p-6 text-center mt-8">
                  <div className="text-4xl mb-2">🫖</div>
                  <p className="font-semibold text-gray-700">Chai & Tea</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-12 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-orange-600 mb-2">40%</div>
              <div className="text-gray-600">Average Savings</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">$100</div>
              <div className="text-gray-600">Batch Minimum</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">24h</div>
              <div className="text-gray-600">Fast Delivery</div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Featured Products
            </h2>
            <p className="text-xl text-gray-600">
              Fresh Indian groceries at unbeatable prices
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-2xl font-semibold text-gray-700 mb-2">
                No Products Yet
              </h3>
              <p className="text-gray-500">
                Check back soon for amazing deals!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300 group"
                >
                  {/* Product Image */}
                  <div className="h-56 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="text-gray-400 text-7xl">🛒</div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-5">
                    <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
                      {product.name}
                    </h3>

                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-3xl font-bold text-green-600">
                        ${product.price.toFixed(2)}
                      </span>
                      {product.shelf_price > product.price && (
                        <>
                          <span className="text-lg text-gray-400 line-through">
                            ${product.shelf_price.toFixed(2)}
                          </span>
                          <span className="text-sm font-semibold text-orange-600 bg-orange-100 px-2 py-1 rounded">
                            {Math.round(
                              (1 - product.price / product.shelf_price) * 100
                            )}
                            % OFF
                          </span>
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => addToCart(product)}
                      className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2"
                    >
                      <span>Add to Cart</span>
                      <span>🛒</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="bg-gradient-to-r from-orange-500 to-green-600 py-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            How It Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🛒</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                1. Shop Products
              </h3>
              <p className="text-gray-600">
                Browse our selection of fresh Indian groceries and add items to
                your cart.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⏳</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                2. Wait for Batch
              </h3>
              <p className="text-gray-600">
                Your order joins others in your area. Delivery starts when batch
                reaches $100.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🚚</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                3. Get Delivered
              </h3>
              <p className="text-gray-600">
                Receive your fresh groceries within 24 hours at unbeatable
                prices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-xl mb-4">DesiCart</h3>
              <p className="text-gray-400">
                Bringing authentic Indian groceries to your doorstep.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#products" className="hover:text-white">
                    Products
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-white">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="/admin" className="hover:text-white">
                    Admin
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>📧 hello@desicart.com</li>
                <li>📱 1300 DESI CART</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Follow Us</h4>
              <div className="flex space-x-4 text-2xl">
                <a href="#" className="hover:text-orange-500">
                  📘
                </a>
                <a href="#" className="hover:text-orange-500">
                  📷
                </a>
                <a href="#" className="hover:text-orange-500">
                  🐦
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 DesiCart. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Cart Modal */}
      {showCart && (
        <Cart
          cart={cart}
          onUpdateQuantity={updateQuantity}
          onRemove={removeFromCart}
          onClose={() => setShowCart(false)}
        />
      )}
    </div>
  );
}
