import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DesiCart - Authentic Indian Groceries",
  description: "Save up to 40% on premium Indian groceries with batch delivery",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#f97316" />
      </head>
      <body>{children}</body>
    </html>
  );
}
