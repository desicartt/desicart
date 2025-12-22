// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GoJack - Smart Grocery Batching",
  description:
    "Futuristic online grocery store with intelligent batch delivery.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 min-h-screen flex items-center justify-center antialiased">
        <div className="w-full max-w-6xl bg-slate-950/70 border border-slate-800 rounded-3xl shadow-[0_0_80px_rgba(79,70,229,0.35)] overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
