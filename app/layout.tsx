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
      <body className="bg-slate-100 min-h-screen antialiased">
        <div className="border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-2 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live in West Melbourne · Same-day batches before 2pm</span>
            </div>
            <div className="hidden sm:flex items-center gap-4">
              <span>Support: hello@gojack.app</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5">
                Transparent batch pricing · No surge fees
              </span>
            </div>
          </div>
        </div>

        <main className="min-h-[calc(100vh-40px)] flex items-center justify-center px-4 sm:px-6 py-6">
          <div className="w-full max-w-6xl bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
