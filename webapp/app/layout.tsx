import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Providers } from "@/components/layout/providers";

export const metadata: Metadata = {
  title: "BANTAY-ANI — IoT Monitoring",
  description:
    "BANTAY-ANI: Bird-detection and Automated Noise-based Threat Alert System for Yield Protection and Agricultural Notification and IoT-based Monitoring.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen">
        <Providers>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 min-w-0 pb-20 md:pb-0">{children}</main>
          </div>
          <MobileNav />
        </Providers>
      </body>
    </html>
  );
}
