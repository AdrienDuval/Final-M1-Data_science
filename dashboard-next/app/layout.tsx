import type { Metadata } from "next";
import "./globals.css";
import NavigationBar from "@/components/NavigationBar";

export const metadata: Metadata = {
  title: "Marketing ROI Dashboard",
  description: "Intelligent multi-model system for marketing ROI optimization",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }} className="min-h-screen">
        <NavigationBar />
        <main className="pt-16 min-h-screen">
          <div className="max-w-7xl mx-auto px-8 py-8">{children}</div>
        </main>
      </body>
    </html>
  );
}
