import type { Metadata } from "next";
import { Lora } from "next/font/google";
import "../globals.css";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "weeds.dk — Nordic Botanical Journal",
  description: "Scientific insights and wellness perspectives on Nordic hemp cultivation and cooperative commerce.",
};

export default function MediaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${lora.variable} min-h-screen flex flex-col font-serif`}>
      <Navigation />
      <main className="flex-1 bg-[#FAF9F6]">
        {children}
      </main>
      <Footer />
    </div>
  );
}
