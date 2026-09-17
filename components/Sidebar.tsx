"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome, IconWand, IconFolder, IconSettings } from "./UI/Icons";

interface SidebarLink {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const links: SidebarLink[] = [
  { label: "Dashboard", href: "/", icon: <IconHome className="w-4 h-4" /> },
  { label: "Builder", href: "/builder", icon: <IconWand className="w-4 h-4" /> },
  { label: "Projects", href: "/projects", icon: <IconFolder className="w-4 h-4" /> },
  { label: "Settings", href: "/settings", icon: <IconSettings className="w-4 h-4" /> },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#05080c] border-r border-secondary-800 text-white min-h-screen p-6 flex flex-col">
      <div className="mb-12 border-b border-secondary-800 pb-6 flex items-center gap-3">
        <div className="w-2 h-2 bg-primary-400 animate-pulse"></div>
        <h2 className="text-[10px] font-mono tracking-widest text-secondary-400 uppercase">SYS_Navigation</h2>
      </div>

      <nav className="space-y-1 flex-grow">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link key={link.href} href={link.href}>
              <div
                className={`flex items-center px-4 py-3 border-l-2 transition-all ${
                  isActive
                    ? "border-primary-400 bg-secondary-800/50 text-primary-400"
                    : "border-transparent text-secondary-500 hover:border-secondary-600 hover:bg-secondary-900 hover:text-white"
                }`}
              >
                <span className="mr-4 opacity-70">{link.icon}</span>
                <span className="font-display text-sm uppercase tracking-wide">{link.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
      
      <div className="pt-6 border-t border-secondary-800">
        <div className="text-[10px] font-mono text-secondary-600 uppercase">v.2.0.4-beta</div>
      </div>
    </aside>
  );
}