"use client";

import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/UI/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-secondary-900 text-secondary-50 font-sans overflow-x-hidden">
      {/* 
        Note: Navbar is kept as requested to preserve functionality. 
        Assuming it inherits current text colors or has a transparent mode. 
      */}
      <Navbar />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-24 sm:py-32 relative">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary-900/20 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
          {/* Left Content */}
          <div className="space-y-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 text-[10px] md:text-xs font-mono uppercase tracking-[0.2em] text-primary-400">
                <span className="w-2 h-2 bg-primary-400 block"></span>
                AI-Powered Platform
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-light text-white leading-[1.1] tracking-tight">
                Create Stunning <br />
                Websites with <span className="font-medium text-primary-400">AI.</span>
              </h1>
              
              <p className="text-lg md:text-xl text-secondary-400 font-light leading-relaxed max-w-xl">
                Transform your ideas into beautiful, functional websites in seconds. 
                Just describe what you want, and our AI creates production-ready React code.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/builder">
                <Button 
                  variant="primary" 
                  size="lg" 
                  className="w-full sm:w-auto bg-primary-500 hover:bg-primary-400 text-secondary-900 font-semibold rounded-none px-8 py-4 uppercase tracking-wide text-sm transition-all"
                >
                  Start Building ↗
                </Button>
              </Link>
              <Link href="/projects">
                <Button 
                  variant="secondary" 
                  size="lg" 
                  className="w-full sm:w-auto bg-transparent border border-secondary-700 hover:border-primary-400 text-white rounded-none px-8 py-4 uppercase tracking-wide text-sm transition-all"
                >
                  View Projects
                </Button>
              </Link>
            </div>

            {/* Stats - Redesigned to match the reference image's stat blocks */}
            <div className="grid grid-cols-3 gap-8 pt-12 border-t border-secondary-800 mt-12">
              <div>
                <div className="text-4xl font-display font-light text-white mb-2">∞</div>
                <div className="text-[10px] font-mono text-secondary-500 uppercase tracking-widest">Possibilities</div>
              </div>
              <div>
                <div className="text-4xl font-display font-light text-white mb-2">99<span className="text-primary-400 text-2xl">%</span></div>
                <div className="text-[10px] font-mono text-secondary-500 uppercase tracking-widest">Lightning Fast</div>
              </div>
              <div>
                <div className="text-4xl font-display font-light text-white mb-2">01</div>
                <div className="text-[10px] font-mono text-secondary-500 uppercase tracking-widest">Beautiful Design</div>
              </div>
            </div>
          </div>

          {/* Right - Showcase (Technical Data Viz Aesthetic) */}
          <div className="relative w-full aspect-square md:aspect-auto md:h-[600px] border border-secondary-800 bg-secondary-900/50 p-8 flex flex-col">
            {/* Top decorative bar */}
            <div className="flex justify-between items-center border-b border-secondary-800 pb-4 mb-8">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-secondary-600"></div>
                <div className="w-2 h-2 bg-secondary-600"></div>
                <div className="w-2 h-2 bg-primary-400"></div>
              </div>
              <div className="text-[10px] font-mono text-secondary-500 tracking-widest">SYSTEM_READY</div>
            </div>

            <div className="flex-grow flex flex-col justify-center space-y-8">
              <div className="space-y-3">
                <div className="text-xs font-mono text-primary-400 flex items-center gap-3">
                  <span className="text-secondary-600">&gt;</span> Input parameters
                </div>
                <div className="p-4 border border-secondary-800 bg-secondary-900 text-secondary-300 font-sans text-sm leading-relaxed border-l-2 border-l-primary-500">
                  "Create a modern e-commerce site with product cards and a shopping cart"
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <div className="text-[10px] font-mono text-secondary-600 uppercase tracking-widest border-b border-secondary-800 pb-2">Execution Log</div>
                <div className="space-y-2">
                  <div className="text-xs font-mono text-secondary-400 flex justify-between">
                    <span>[SYS] Code generation</span>
                    <span className="text-primary-400">SUCCESS</span>
                  </div>
                  <div className="text-xs font-mono text-secondary-400 flex justify-between">
                    <span>[SYS] Live preview compilation</span>
                    <span className="text-primary-400">SUCCESS</span>
                  </div>
                  <div className="text-xs font-mono text-secondary-400 flex justify-between">
                    <span>[SYS] Editable state</span>
                    <span className="text-primary-400">READY</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Decorative Ticker Tape (Inspired by the reference image) */}
      <div className="w-full border-y border-secondary-800 bg-secondary-900/80 py-4 overflow-hidden flex items-center">
        <div className="flex whitespace-nowrap text-sm font-mono tracking-[0.3em] text-secondary-500 w-full justify-around">
          <span>AI-NATIVE <span className="text-primary-400 mx-4">+</span></span>
          <span>PRODUCTION-READY <span className="text-primary-400 mx-4">+</span></span>
          <span>SEAMLESS INTEGRATION <span className="text-primary-400 mx-4">+</span></span>
          <span className="hidden md:inline">DEVELOPER FIRST <span className="text-primary-400 mx-4">+</span></span>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-24 border-b border-secondary-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-light text-white mb-4 tracking-tight">
              Globally Recognized <br />
              <span className="text-primary-400 font-medium">Technologies</span>
            </h2>
            <p className="text-secondary-400 max-w-2xl font-light">
              Powerful features built from the ground up to bring your creative ideas to life with absolute precision.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-secondary-800">
            {[
              {
                id: "01",
                title: "AI Code Generation",
                description: "Describe your website and let AI generate clean, modern React code instantly.",
              },
              {
                id: "02",
                title: "Live Preview",
                description: "See your changes in real-time with Sandpack's live sandbox environment.",
              },
              {
                id: "03",
                title: "AI Refinement",
                description: "Chat with AI to refine and improve your code based on your feedback.",
              },
              {
                id: "04",
                title: "One-Click Export",
                description: "Export your project as a complete, ready-to-run npm package.",
              },
              {
                id: "05",
                title: "Save & Continue",
                description: "Save your projects and continue editing them anytime from anywhere.",
              },
              {
                id: "06",
                title: "Multi-File Support",
                description: "Work with multiple files and components in a single project.",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-secondary-900 p-8 sm:p-10 hover:bg-secondary-800/50 transition-colors group relative"
              >
                <div className="text-xs font-mono text-primary-400 mb-6 flex items-center justify-between">
                  <span>[{feature.id}]</span>
                  <span className="w-4 h-px bg-primary-400/50 group-hover:w-8 transition-all"></span>
                </div>
                <h3 className="text-xl font-display text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-secondary-400 text-sm leading-relaxed font-light">
                  {feature.description}
                </p>
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-2 h-2 bg-primary-400"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 py-24">
        <div className="mb-16">
          <div className="text-[10px] font-mono text-secondary-500 uppercase tracking-widest mb-4">Workflow</div>
          <h2 className="text-3xl md:text-5xl font-display font-light text-white tracking-tight">
            The foundation underneath<br />
            <span className="text-primary-400 font-medium">both disciplines.</span>
          </h2>
        </div>

        <div className="space-y-4">
          {[
            {
              step: "01",
              title: "Describe",
              description: "Tell AI what website you want to create. Be as detailed as you like.",
              action: "Write a prompt",
            },
            {
              step: "02",
              title: "Generate",
              description: "AI instantly generates clean, modern React code with Tailwind CSS.",
              action: "Review code",
            },
            {
              step: "03",
              title: "Export & Deploy",
              description: "Download as a complete project or deploy directly to your server.",
              action: "Get your site",
            },
          ].map((item) => (
            <div key={item.step} className="group border border-secondary-800 bg-secondary-900 p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6 hover:border-primary-500/50 transition-colors">
              <div className="flex-shrink-0 w-16 h-16 border border-secondary-700 bg-secondary-800 flex items-center justify-center text-xl font-display text-primary-400 group-hover:bg-primary-900/20 transition-colors">
                {item.step}
              </div>
              <div className="flex-grow">
                <h3 className="text-lg font-display text-white mb-2 uppercase tracking-wide">
                  {item.title}
                </h3>
                <p className="text-secondary-400 text-sm font-light">{item.description}</p>
              </div>
              <div className="flex-shrink-0">
                <span className="text-xs font-mono text-primary-400 uppercase tracking-widest group-hover:text-primary-300 flex items-center gap-2">
                  {item.action} <span className="bg-primary-500/20 px-2 py-1">&gt;</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Navigation Links Section (Technical Panels) */}
      <section className="border-t border-secondary-800 bg-[#0a0f16] py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Builder */}
            <Link href="/builder">
              <div className="h-full p-8 border border-secondary-800 bg-secondary-900 hover:border-primary-400 transition-colors cursor-pointer group flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-mono text-primary-400 uppercase tracking-widest mb-6 border-b border-secondary-800 pb-2">Workspace</div>
                  <h3 className="text-2xl font-display text-white mb-3">Builder</h3>
                  <p className="text-sm text-secondary-400 font-light mb-8">
                    Create new websites with AI assistance and live preview.
                  </p>
                </div>
                <div className="text-primary-400 font-mono text-xs uppercase tracking-widest flex items-center justify-between">
                  Start building 
                  <span className="transform group-hover:translate-x-2 transition-transform">→</span>
                </div>
              </div>
            </Link>

            {/* Projects */}
            <Link href="/projects">
              <div className="h-full p-8 border border-secondary-800 bg-secondary-900 hover:border-primary-400 transition-colors cursor-pointer group flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-mono text-primary-400 uppercase tracking-widest mb-6 border-b border-secondary-800 pb-2">Repository</div>
                  <h3 className="text-2xl font-display text-white mb-3">Projects</h3>
                  <p className="text-sm text-secondary-400 font-light mb-8">
                    View and manage all your saved projects in one secure location.
                  </p>
                </div>
                <div className="text-primary-400 font-mono text-xs uppercase tracking-widest flex items-center justify-between">
                  View projects 
                  <span className="transform group-hover:translate-x-2 transition-transform">→</span>
                </div>
              </div>
            </Link>

            {/* Auth */}
            <Link href="/auth/signup">
              <div className="h-full p-8 border border-secondary-800 bg-secondary-900 hover:border-primary-400 transition-colors cursor-pointer group flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-mono text-primary-400 uppercase tracking-widest mb-6 border-b border-secondary-800 pb-2">Access</div>
                  <h3 className="text-2xl font-display text-white mb-3">Authentication</h3>
                  <p className="text-sm text-secondary-400 font-light mb-8">
                    Create your account via Google and initialize your environment.
                  </p>
                </div>
                <div className="text-primary-400 font-mono text-xs uppercase tracking-widest flex items-center justify-between">
                  Get started 
                  <span className="transform group-hover:translate-x-2 transition-transform">→</span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-900/20 border-t border-primary-900/50 py-24 relative overflow-hidden">
        {/* Abstract geometric lines */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(var(--color-primary-400) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary-400) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-display font-light text-white mb-6 tracking-tight">
            Ready to <span className="font-medium text-primary-400">Deploy?</span>
          </h2>
          <p className="text-lg text-secondary-400 font-light mb-10">
            Start creating your next production-ready website with AI today.
          </p>
          <Link href="/builder">
            <Button
              variant="primary"
              size="lg"
              className="bg-primary-500 hover:bg-primary-400 text-secondary-900 font-bold rounded-none px-12 py-4 uppercase tracking-widest text-sm transition-colors"
            >
              Launch Builder _
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#05080c] border-t border-secondary-800 py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-primary-500/10 border border-primary-500/30 flex items-center justify-center">
              <span className="text-primary-400 font-mono text-xs">AI</span>
            </div>
            <span className="text-white font-display uppercase tracking-widest text-sm">AI Website Builder</span>
          </div>
          <div className="text-secondary-500 text-xs font-mono uppercase tracking-widest">
            © 2026 AI BUILDER. ALL RIGHTS RESERVED.
          </div>
        </div>
      </footer>
    </div>
  );
}