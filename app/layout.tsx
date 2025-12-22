import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DayCart - Same Day Grocery",
  description: "Ethnic groceries delivered same day via local drivers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="theme-color" content="#10b981" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="bg-gradient-to-br from-emerald-50 to-green-50 min-h-screen">
        <div className="max-w-md mx-auto h-screen bg-white shadow-2xl">
          {children}
        </div>
      </body>
    </html>
  );
}
