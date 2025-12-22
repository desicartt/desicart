// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GoJack - Smart Grocery Batching",
  description: "Modern online grocery store with intelligent batch delivery.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-100 min-h-screen flex items-center justify-center antialiased">
        <div className="w-full max-w-6xl bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
