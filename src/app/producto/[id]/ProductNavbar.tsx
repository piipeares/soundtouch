"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Logo from "@/components/layout/Logo";

export default function ProductNavbar() {
  return (
    <header className="sticky top-0 z-50 bg-brand-black/95 backdrop-blur-md border-b border-brand-gray">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-zinc-300 hover:text-brand-orange transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <Link href="/">
              <Logo />
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}