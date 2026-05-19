import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Marketing ROI Dashboard",
  description: "Intelligent multi-model system for marketing ROI optimization",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        <Sidebar />
        <main className="ml-60 min-h-screen">
          <div className="max-w-7xl mx-auto px-8 py-8">{children}</div>
        </main>
      </body>
    </html>
  );
}
