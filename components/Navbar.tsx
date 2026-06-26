"use client";

import Link from "next/link";
import { Button } from "./UI/Button";

export function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <span className="text-xl font-bold text-gray-900">
              Website Builder
            </span>
          </Link>

          <div className="flex gap-4 items-center">
            <Link href="/projects">
              <Button variant="secondary">Projects</Button>
            </Link>
            <Link href="/builder">
              <Button variant="primary">Build</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
