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
        {/* Top info bar */}
        <div className="border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live across key suburbs in Melbourne</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
              <span className="text-[11px] text-slate-600">
                AI‑powered batching for fair delivery fees.
              </span>
              <span className="hidden sm:inline text-[11px] text-slate-500">
                Transparent pricing · Local grocery partners
              </span>
            </div>
          </div>
        </div>

        {/* Main shell */}
        <main className="min-h-[calc(100vh-40px)] flex items-center justify-center px-4 sm:px-6 py-6">
          <div className="w-full max-w-6xl bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
