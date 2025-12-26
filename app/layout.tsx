import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Schedule",
  description: "A personal scheduling app to organize your days and weeks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
