import type { Metadata } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "@/app/components/service-worker-register";

export const metadata: Metadata = {
  title: "My personal shiesty planner",
  description: "A local-first planner that keeps your schedule, chat input, and reminders on your device.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 text-slate-900">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}