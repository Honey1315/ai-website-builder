"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarLink {
  label: string;
  href: string;
  icon?: string;
}

const links: SidebarLink[] = [
  { label: "Dashboard", href: "/", icon: "🏠" },
  { label: "Builder", href: "/builder", icon: "🛠️" },
  { label: "Projects", href: "/projects", icon: "📁" },
  { label: "Settings", href: "/settings", icon: "⚙️" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen p-4">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">AI Builder</h2>
      </div>

      <nav className="space-y-2">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            <div
              className={`px-4 py-2 rounded-lg transition-colors ${
                pathname === link.href
                  ? "bg-blue-600"
                  : "hover:bg-gray-800"
              }`}
            >
              <span className="mr-2">{link.icon}</span>
              {link.label}
            </div>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
