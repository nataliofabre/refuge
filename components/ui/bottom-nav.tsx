"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Plus, LineChart, BookOpen, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Accueil", icon: Home },
  { href: "/evolution", label: "Évolution", icon: LineChart },
  { href: "/log", label: "Noter", icon: Plus, big: true },
  { href: "/resources", label: "Ressources", icon: BookOpen },
  { href: "/profile", label: "Profil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-ink-100 bg-white/90 backdrop-blur-lg">
      <ul className="mx-auto flex max-w-xl items-center justify-between px-4 py-2">
        {items.map(({ href, label, icon: Icon, big }) => {
          const active = pathname?.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-1 text-xs",
                  active ? "text-clinic-600" : "text-ink-400"
                )}
              >
                {big ? (
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-clinic-500 text-white shadow-soft -mt-6 border-4 border-white">
                    <Icon size={22} />
                  </span>
                ) : (
                  <Icon size={22} />
                )}
                <span className={cn(big && "hidden")}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
