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
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

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

    // Success feedback
    const button = document.activeElement as HTMLElement;
    button?.classList.add("scale-95");
    setTimeout(() => button?.classList.remove("scale-95"), 150);
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
  const cartValue = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const categories = [
    { id: "all", name: "All Products", icon: "🏪" },
    { id: "rice", name: "Rice & Grains", icon: "🌾" },
    { id: "spices", name: "Spices", icon: "🌶️" },
    { id: "lentils", name: "Lentils & Daal", icon: "🫘" },
    { id: "snacks", name: "Snacks", icon: "🍿" },
    { id: "beverages", name: "Beverages", icon: "🫖" },
  ];

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 text-white text-center py-2 text-sm font-medium">
        🎉 Save up to 40% with batch delivery • Free shipping on orders over
        $100
      </div>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl font-bold">D</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">DesiCart</h1>
                <p className="text-xs text-gray-500">Fresh Indian Groceries</p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="w-full relative">
                <input
                  type="text"
                  placeholder="Search for rice, spices, lentils..."
                  className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">
                  🔍
                </span>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-4">
              <a
                href="/admin"
                className="hidden md:flex items-center space-x-2 text-gray-700 hover:text-orange-600 transition-colors"
              >
                <span className="text-xl">⚙️</span>
                <span className="font-medium">Admin</span>
              </a>

              <button
                onClick={() => setShowCart(true)}
                className="relative bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl hover:shadow-xl transition-all duration-300 flex items-center space-x-2 group"
              >
                <span className="text-xl group-hover:scale-110 transition-transform">
                  🛒
                </span>
                <div className="hidden sm:block">
                  <div className="text-xs opacity-90">Cart</div>
                  <div className="text-sm font-bold">
                    ${cartValue.toFixed(2)}
                  </div>
                </div>
                {cartTotal > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-lg animate-pulse">
                    {cartTotal}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-5"></div>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        ></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <div className="inline-block bg-white bg-opacity-20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-6">
                ✨ Premium Quality • Lowest Prices
              </div>
              <h2 className="text-6xl font-bold mb-6 leading-tight">
                Authentic Indian
                <span className="block">Groceries</span>
                <span className="block text-yellow-200">Delivered Fresh</span>
              </h2>
              <p className="text-xl text-white text-opacity-90 mb-8 leading-relaxed">
                Experience the taste of home with our curated selection of
                premium Indian groceries. Save up to 40% with our smart batch
                delivery system.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="#products"
                  className="bg-white text-orange-600 px-8 py-4 rounded-xl font-bold hover:shadow-2xl transition-all inline-flex items-center space-x-2"
                >
                  <span>Start Shopping</span>
                  <span>→</span>
                </a>
                <a
                  href="#how-it-works"
                  className="bg-white bg-opacity-10 backdrop-blur-sm text-white border-2 border-white px-8 py-4 rounded-xl font-bold hover:bg-opacity-20 transition-all"
                >
                  How It Works
                </a>
              </div>
            </div>

            <div className="relative hidden md:block">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="bg-white rounded-3xl p-8 shadow-2xl transform hover:scale-105 transition-transform">
                    <div className="text-6xl mb-4">🌾</div>
                    <h3 className="font-bold text-xl mb-2">Basmati Rice</h3>
                    <p className="text-gray-600 text-sm">Premium quality</p>
                    <div className="mt-4 flex items-baseline">
                      <span className="text-2xl font-bold text-green-600">
                        $12.50
                      </span>
                      <span className="text-sm text-gray-400 line-through ml-2">
                        $18.00
                      </span>
                    </div>
                  </div>
                  <div className="bg-white rounded-3xl p-8 shadow-2xl transform hover:scale-105 transition-transform">
                    <div className="text-6xl mb-4">🌶️</div>
                    <h3 className="font-bold text-xl mb-2">Masala Mix</h3>
                    <p className="text-gray-600 text-sm">Fresh spices</p>
                    <div className="mt-4 flex items-baseline">
                      <span className="text-2xl font-bold text-green-600">
                        $8.40
                      </span>
                      <span className="text-sm text-gray-400 line-through ml-2">
                        $12.00
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-6 pt-12">
                  <div className="bg-white rounded-3xl p-8 shadow-2xl transform hover:scale-105 transition-transform">
                    <div className="text-6xl mb-4">🫖</div>
                    <h3 className="font-bold text-xl mb-2">Chai Tea</h3>
                    <p className="text-gray-600 text-sm">Authentic blend</p>
                    <div className="mt-4 flex items-baseline">
                      <span className="text-2xl font-bold text-green-600">
                        $5.60
                      </span>
                      <span className="text-sm text-gray-400 line-through ml-2">
                        $8.00
                      </span>
                    </div>
                  </div>
                  <div className="bg-white rounded-3xl p-8 shadow-2xl transform hover:scale-105 transition-transform">
                    <div className="text-6xl mb-4">🫘</div>
                    <h3 className="font-bold text-xl mb-2">Daal Mix</h3>
                    <p className="text-gray-600 text-sm">Protein rich</p>
                    <div className="mt-4 flex items-baseline">
                      <span className="text-2xl font-bold text-green-600">
                        $6.80
                      </span>
                      <span className="text-sm text-gray-400 line-through ml-2">
                        $10.00
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="bg-white py-8 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-2">🚚</div>
              <div className="font-bold text-gray-900">Fast Delivery</div>
              <div className="text-sm text-gray-500">Within 24 hours</div>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">💰</div>
              <div className="font-bold text-gray-900">Best Prices</div>
              <div className="text-sm text-gray-500">Up to 40% off</div>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">✨</div>
              <div className="font-bold text-gray-900">Fresh Products</div>
              <div className="text-sm text-gray-500">Direct from source</div>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">🔒</div>
              <div className="font-bold text-gray-900">Secure Payment</div>
              <div className="text-sm text-gray-500">Safe & encrypted</div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Pills */}
      <section className="bg-white py-6 border-b border-gray-200 sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto space-x-3 pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 px-6 py-3 rounded-full font-semibold transition-all whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span className="mr-2">{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section id="products" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center items-center py-32">
              <div className="relative">
                <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-orange-500"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl">🛒</span>
                </div>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-32">
              <div className="text-8xl mb-6">🔍</div>
              <h3 className="text-3xl font-bold text-gray-900 mb-3">
                No products found
              </h3>
              <p className="text-gray-600 text-lg mb-8">
                Try selecting a different category
              </p>
              <button
                onClick={() => setSelectedCategory("all")}
                className="bg-orange-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-orange-600"
              >
                View All Products
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProducts.map((product) => {
                const discount =
                  product.shelf_price > product.price
                    ? Math.round(
                        (1 - product.price / product.shelf_price) * 100
                      )
                    : 0;

                return (
                  <div
                    key={product.id}
                    className="group bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100"
                  >
                    {/* Product Image */}
                    <div className="relative h-64 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                      {discount > 0 && (
                        <div className="absolute top-4 left-4 z-10 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                          {discount}% OFF
                        </div>
                      )}
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-8xl opacity-20">🛒</span>
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="p-6">
                      <h3 className="font-bold text-lg text-gray-900 mb-3 line-clamp-2 min-h-[3.5rem]">
                        {product.name}
                      </h3>

                      <div className="flex items-end justify-between mb-4">
                        <div>
                          <div className="text-3xl font-bold text-green-600">
                            ${product.price.toFixed(2)}
                          </div>
                          {product.shelf_price > product.price && (
                            <div className="text-sm text-gray-400 line-through">
                              ${product.shelf_price.toFixed(2)}
                            </div>
                          )}
                        </div>
                        {discount > 0 && (
                          <div className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-lg">
                            Save $
                            {(product.shelf_price - product.price).toFixed(2)}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => addToCart(product)}
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2 group-hover:scale-105"
                      >
                        <span>Add to Cart</span>
                        <span className="text-xl">🛒</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white py-24"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">How DesiCart Works</h2>
            <p className="text-xl text-gray-400">
              Save money with our innovative batch delivery system
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-8 text-center shadow-2xl transform hover:scale-105 transition-all">
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-white rounded-full flex items-center justify-center font-bold text-orange-600 text-xl shadow-lg">
                1
              </div>
              <div className="text-6xl mb-6 mt-4">🛒</div>
              <h3 className="text-2xl font-bold mb-4">Shop & Order</h3>
              <p className="text-white text-opacity-90 leading-relaxed">
                Browse our premium selection of Indian groceries and place your
                order. No minimum purchase required.
              </p>
            </div>

            <div className="relative bg-gradient-to-br from-amber-500 to-yellow-500 rounded-3xl p-8 text-center shadow-2xl transform hover:scale-105 transition-all">
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-white rounded-full flex items-center justify-center font-bold text-amber-600 text-xl shadow-lg">
                2
              </div>
              <div className="text-6xl mb-6 mt-4">⏳</div>
              <h3 className="text-2xl font-bold mb-4">Smart Batching</h3>
              <p className="text-white text-opacity-90 leading-relaxed">
                Your order joins others in your area. When the batch reaches
                $100, we prepare everything fresh.
              </p>
            </div>

            <div className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-3xl p-8 text-center shadow-2xl transform hover:scale-105 transition-all">
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-white rounded-full flex items-center justify-center font-bold text-green-600 text-xl shadow-lg">
                3
              </div>
              <div className="text-6xl mb-6 mt-4">🚚</div>
              <h3 className="text-2xl font-bold mb-4">Fast Delivery</h3>
              <p className="text-white text-opacity-90 leading-relaxed">
                Get your fresh groceries delivered within 24 hours at up to 40%
                lower prices than retail.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-orange-500 to-red-500 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-5xl font-bold mb-6">Start Saving Today</h2>
          <p className="text-2xl mb-8 text-white text-opacity-90">
            Join thousands of happy customers enjoying authentic Indian
            groceries at unbeatable prices
          </p>
          <a
            href="#products"
            className="inline-block bg-white text-orange-600 px-12 py-5 rounded-2xl font-bold text-xl hover:shadow-2xl transition-all transform hover:scale-105"
          >
            Browse Products →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">D</span>
                </div>
                <h3 className="font-bold text-xl">DesiCart</h3>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Your trusted source for authentic Indian groceries delivered
                fresh to your doorstep.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">Shop</h4>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <a
                    href="#products"
                    className="hover:text-white transition-colors"
                  >
                    All Products
                  </a>
                </li>
                <li>
                  <a
                    href="#products"
                    className="hover:text-white transition-colors"
                  >
                    Rice & Grains
                  </a>
                </li>
                <li>
                  <a
                    href="#products"
                    className="hover:text-white transition-colors"
                  >
                    Spices
                  </a>
                </li>
                <li>
                  <a
                    href="#products"
                    className="hover:text-white transition-colors"
                  >
                    Snacks
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">Company</h4>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <a
                    href="#how-it-works"
                    className="hover:text-white transition-colors"
                  >
                    How It Works
                  </a>
                </li>
                <li>
                  <a
                    href="/admin"
                    className="hover:text-white transition-colors"
                  >
                    Admin Portal
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">Contact</h4>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-center space-x-2">
                  <span>📧</span>
                  <span>hello@desicart.com</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span>📱</span>
                  <span>1300 DESI CART</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span>📍</span>
                  <span>Melbourne, VIC</span>
                </li>
              </ul>
              <div className="flex space-x-4 mt-6 text-3xl">
                <a href="#" className="hover:scale-110 transition-transform">
                  📘
                </a>
                <a href="#" className="hover:scale-110 transition-transform">
                  📷
                </a>
                <a href="#" className="hover:scale-110 transition-transform">
                  🐦
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm">
            <p>&copy; 2025 DesiCart. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Refund Policy
              </a>
            </div>
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
      `}</style>
    </div>
  );
}
