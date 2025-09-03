"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/upload-cv", label: "Upload CV" },
  { href: "/settings", label: "Settings" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background shadow-sm">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="text-lg font-bold">
          JobTracker Pro
        </Link>

        {/* Desktop Menu */}
        <div className="hidden space-x-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${
                pathname === item.href
                  ? "text-primary font-medium"
                  : "text-muted-foreground"
              } hover:text-primary transition-colors`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="bg-white sm:w-64 w-3/4 shadow-lg"
            >
              <SheetTitle className="text-lg font-semibold mb-4">
                Menu
              </SheetTitle>
              <div className="flex flex-col space-y-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${
                      pathname === item.href
                        ? "text-primary font-medium"
                        : "text-muted-foreground"
                    } hover:text-primary transition-colors`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
