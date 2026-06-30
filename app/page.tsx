"use client";

import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/UI/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20 sm:py-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-block bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold">
                ✨ AI-Powered Website Builder
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                Create Stunning Websites with{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  AI
                </span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Transform your ideas into beautiful, functional websites in seconds. 
                Just describe what you want, and our AI creates production-ready React code.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/builder">
                <Button variant="primary" size="lg" className="w-full sm:w-auto">
                  🚀 Start Building
                </Button>
              </Link>
              <Link href="/projects">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  📁 View Projects
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-gray-200">
              <div>
                <div className="text-2xl font-bold text-gray-900">∞</div>
                <div className="text-sm text-gray-600">Possibilities</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">⚡</div>
                <div className="text-sm text-gray-600">Lightning Fast</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">🎨</div>
                <div className="text-sm text-gray-600">Beautiful Design</div>
              </div>
            </div>
          </div>

          {/* Right - Showcase */}
          <div className="relative">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 text-white shadow-2xl">
              <div className="space-y-4">
                <div className="text-sm font-mono bg-white/10 px-3 py-2 rounded">
                  &gt; Describe your website...
                </div>
                <div className="space-y-2 text-sm opacity-90">
                  <p>"Create a modern e-commerce site with product cards and a shopping cart"</p>
                </div>
                <div className="border-t border-white/20 pt-4 mt-4">
                  <div className="text-sm font-mono text-green-400">✓ Code generated</div>
                  <div className="text-sm font-mono text-green-400">✓ Live preview ready</div>
                  <div className="text-sm font-mono text-green-400">✓ Fully editable</div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-blue-200 rounded-full opacity-20 blur-3xl"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600">
              Powerful features to bring your creative ideas to life
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            {[
              {
                icon: "🤖",
                title: "AI Code Generation",
                description: "Describe your website and let AI generate clean, modern React code instantly.",
              },
              {
                icon: "🎨",
                title: "Live Preview",
                description: "See your changes in real-time with Sandpack's live sandbox environment.",
              },
              {
                icon: "♻️",
                title: "AI Refinement",
                description: "Chat with AI to refine and improve your code based on your feedback.",
              },
              {
                icon: "📦",
                title: "One-Click Export",
                description: "Export your project as a complete, ready-to-run npm package.",
              },
              {
                icon: "💾",
                title: "Save & Continue",
                description: "Save your projects and continue editing them anytime from anywhere.",
              },
              {
                icon: "🎯",
                title: "Multi-File Support",
                description: "Work with multiple files and components in a single project.",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow"
              >
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600">
            Three simple steps to create your website
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: 1,
              title: "Describe",
              description: "Tell AI what website you want to create. Be as detailed as you like.",
              action: "Write a prompt",
            },
            {
              step: 2,
              title: "Generate",
              description: "AI instantly generates clean, modern React code with Tailwind CSS.",
              action: "Review code",
            },
            {
              step: 3,
              title: "Export & Deploy",
              description: "Download as a complete project or deploy directly to your server.",
              action: "Get your site",
            },
          ].map((item) => (
            <div key={item.step} className="relative">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-lg border border-gray-200">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 mb-4">{item.description}</p>
                <p className="text-sm text-blue-600 font-semibold">{item.action}</p>
              </div>
              {item.step < 3 && (
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                  <div className="text-3xl text-gray-300">→</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Build?</h2>
          <p className="text-lg text-blue-100 mb-8">
            Start creating your next website with AI in seconds
          </p>
          <Link href="/builder">
            <Button
              variant="primary"
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100"
            >
              Launch Builder →
            </Button>
          </Link>
        </div>
      </section>

      {/* Navigation Links Section */}
      <section className="bg-gray-50 py-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Builder */}
            <Link href="/builder">
              <div className="p-6 bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="text-2xl mb-2">🛠️</div>
                <h3 className="font-semibold text-gray-900 mb-2">Builder</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Create new websites with AI assistance and live preview.
                </p>
                <span className="text-blue-600 font-semibold text-sm">
                  Start building →
                </span>
              </div>
            </Link>

            {/* Projects */}
            <Link href="/projects">
              <div className="p-6 bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="text-2xl mb-2">📁</div>
                <h3 className="font-semibold text-gray-900 mb-2">Projects</h3>
                <p className="text-sm text-gray-600 mb-4">
                  View and manage all your saved projects in one place.
                </p>
                <span className="text-blue-600 font-semibold text-sm">
                  View projects →
                </span>
              </div>
            </Link>

            {/* Auth */}
            <div className="space-y-4">
              <Link href="/auth/signup">
                <div className="p-6 bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="text-2xl mb-2">🔐</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Sign Up with Google</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Create your account and start building.
                  </p>
                  <span className="text-blue-600 font-semibold text-sm">
                    Get started →
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">AI</span>
            </div>
            <span className="text-white font-semibold">AI Website Builder</span>
          </div>
          <p className="text-sm mb-4">
            Create beautiful websites with the power of AI
          </p>
          <p className="text-xs">
            © 2026 AI Website Builder. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
