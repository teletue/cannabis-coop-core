import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "../globals.css";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "weeds.dk — Nordic Botanical Shop",
  description: "Premium hemp-derived botanicals. Member-governed cooperative with transparent sourcing.",
};

export default function ShopLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${geist.variable} min-h-screen flex flex-col font-sans`}>
      <Navigation />
      <main className="flex-1 bg-[#FAF9F6]">
        {children}
      </main>
      <Footer />
    </div>
  );
}
