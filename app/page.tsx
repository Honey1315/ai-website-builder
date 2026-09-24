"use client";

import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/UI/Button";
import Link from "next/link";
import { useState } from "react";
import { signInWithGoogle } from "@/lib/auth-client";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"pipeline" | "files" | "preview" | "deploy">("pipeline");
  const [selectedFile, setSelectedFile] = useState<string>("App.jsx");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [appTheme, setAppTheme] = useState<"dark" | "teal">("dark");

  const fileCodeSnippets: Record<string, string> = {
    "App.jsx": `import React, { useState } from "react";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import PricingGrid from "./components/PricingGrid";

export default function App() {
  const [userState, setUserState] = useState({ plan: "pro", active: true });
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar plan={userState.plan} />
      <HeroSection />
      <PricingGrid onSelect={(plan) => setUserState({ ...userState, plan })} />
    </div>
  );
}`,
    "PricingGrid.jsx": `import React from "react";

export default function PricingGrid({ onSelect }) {
  const plans = [
    { name: "Starter", price: "$0", features: ["1 Project", "Community Support"] },
    { name: "Pro Edge", price: "$29", featured: true, features: ["Unlimited Apps", "1-Click Deploy", "Auto-Fix"] },
    { name: "Enterprise", price: "$99", features: ["Custom Domains", "Team Workspaces", "SLA"] },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
      {plans.map((p) => (
        <div key={p.name} className={\`p-6 border \${p.featured ? "border-teal-400 bg-teal-950/20" : "border-slate-800 bg-slate-900"}\`}>
          <h3 className="text-xl font-bold">{p.name}</h3>
          <p className="text-3xl font-mono mt-2">{p.price}<span className="text-xs text-slate-400">/mo</span></p>
          <button onClick={() => onSelect(p.name)} className="mt-4 w-full py-2 bg-teal-500 text-slate-950 font-bold hover:bg-teal-400">
            Select Plan
          </button>
        </div>
      ))}
    </div>
  );
}`,
    "Navbar.jsx": `import React from "react";

export default function Navbar({ plan }) {
  return (
    <nav className="border-b border-slate-800 px-6 py-3.5 flex justify-between items-center">
      <div className="flex items-center gap-2 font-bold tracking-wider text-teal-400">
        <span className="w-2 h-2 bg-teal-400 animate-pulse"></span>
        SaaS.APP
      </div>
      <div className="flex items-center gap-4 text-xs font-mono">
        <span className="px-2 py-0.5 border border-teal-500/40 text-teal-300">PLAN: {plan.toUpperCase()}</span>
        <button className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white">Dashboard</button>
      </div>
    </nav>
  );
}`,
    "index.css": `@import "tailwindcss";

@theme {
  --color-brand: #33b5aa;
  --font-display: "Plus Jakarta Sans", sans-serif;
}

body {
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
  background: #090d16;
}`,
    "vite.config.js": `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
  },
});`,
    "package.json": `{
  "name": "ai-generated-react-app",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "lucide-react": "^0.475.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "vite": "^6.1.0",
    "tailwindcss": "^4.0.0"
  }
}`,
  };

  return (
    <div className="min-h-screen bg-[#05080c] text-secondary-50 font-sans overflow-x-hidden selection:bg-primary-500/20 selection:text-primary-300">
      <Navbar />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-8 sm:pt-16 md:pt-20 pb-16 sm:pb-24 relative">
        {/* Ambient atmospheric glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] sm:w-[500px] lg:w-[800px] h-[280px] sm:h-[400px] bg-primary-900/15 blur-[120px] sm:blur-[160px] rounded-full pointer-events-none"></div>
        <div className="absolute top-8 right-4 sm:right-10 w-32 sm:w-48 h-32 sm:h-48 bg-primary-400/5 blur-[80px] rounded-full pointer-events-none"></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-14 items-center relative z-10">
          {/* Left Content Column */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            <div className="space-y-4 sm:space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 border border-primary-500/30 bg-primary-500/5 text-[10px] sm:text-xs font-mono uppercase tracking-[0.18em] text-primary-400">
                <span className="w-1.5 h-1.5 bg-primary-400 animate-pulse"></span>
                <span>SYS_V3.5 // MULTI-MODEL AUTONOMOUS REACT ENGINE</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-light text-white leading-[1.12] tracking-tight break-words">
                Prompt to <br />
                Production-Ready <br />
                <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-teal-300 to-primary-200">
                  Full React Apps.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-xs sm:text-base md:text-lg text-secondary-400 font-light leading-relaxed max-w-2xl">
                Transform natural language prompts into modular, multi-file Vite + React + Tailwind applications in seconds.
                Powered by Google Gemini, OpenRouter, and NVIDIA with intelligent fallbacks. Test in an in-browser live Sandpack sandbox,
                resume partial builds on demand, auto-heal runtime glitches, and deploy to GitHub and Vercel with one click.
              </p>
            </div>

            {/* CTA Action Cluster */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-1">
              <Link href="/builder" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto bg-primary-500 hover:bg-primary-400 text-secondary-900 font-bold rounded-none px-6 sm:px-8 py-3.5 sm:py-4 uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-primary-500/10"
                >
                  Launch Builder _
                  <span className="text-secondary-900 font-bold">→</span>
                </Button>
              </Link>
              <Link href="/projects" className="w-full sm:w-auto">
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto bg-transparent border border-secondary-700 hover:border-primary-400 text-white rounded-none px-6 sm:px-8 py-3.5 sm:py-4 uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Workspace Projects ↗
                </Button>
              </Link>
            </div>

            {/* Performance & Spec Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-6 border-t border-secondary-800/80">
              <div className="p-2 sm:p-0">
                <div className="text-xl sm:text-2xl md:text-3xl font-display font-light text-white tracking-tight">
                  &lt; 1.5<span className="text-primary-400 text-base sm:text-lg">s</span>
                </div>
                <div className="text-[9px] sm:text-[10px] font-mono text-secondary-500 uppercase tracking-widest leading-tight mt-0.5">
                  Sandpack Live HMR
                </div>
              </div>
              <div className="p-2 sm:p-0">
                <div className="text-xl sm:text-2xl md:text-3xl font-display font-light text-white tracking-tight">
                  React 19
                </div>
                <div className="text-[9px] sm:text-[10px] font-mono text-secondary-500 uppercase tracking-widest leading-tight mt-0.5">
                  Tailwind & Lucide
                </div>
              </div>
              <div className="p-2 sm:p-0">
                <div className="text-xl sm:text-2xl md:text-3xl font-display font-light text-white tracking-tight">
                  1-Click
                </div>
                <div className="text-[9px] sm:text-[10px] font-mono text-secondary-500 uppercase tracking-widest leading-tight mt-0.5">
                  GitHub & Vercel
                </div>
              </div>
              <div className="p-2 sm:p-0">
                <div className="text-xl sm:text-2xl md:text-3xl font-display font-light text-white tracking-tight">
                  Tri-Model
                </div>
                <div className="text-[9px] sm:text-[10px] font-mono text-secondary-500 uppercase tracking-widest leading-tight mt-0.5">
                  Gemini, OR & NVIDIA
                </div>
              </div>
            </div>
          </div>

          {/* Right Showcase Column - Interactive System Monitor */}
          <div className="lg:col-span-5 w-full">
            <div className="relative border border-secondary-800 bg-[#0a0f16]/95 backdrop-blur-md shadow-2xl p-3.5 sm:p-5 flex flex-col gap-4 overflow-hidden">
              {/* Corner tech accent */}
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary-500 opacity-60 pointer-events-none"></div>

              {/* Terminal Window Chrome */}
              <div className="flex justify-between items-center border-b border-secondary-800/80 pb-2.5">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 bg-danger-500/80"></div>
                  <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 bg-yellow-500/80"></div>
                  <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 bg-primary-400"></div>
                  <span className="text-[9px] sm:text-[10px] font-mono text-secondary-400 uppercase tracking-wider ml-1.5 sm:ml-2">
                    SYS_MONITOR // SANDBOX
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[9px] text-primary-400 uppercase">
                  <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-pulse"></span>
                  ONLINE
                </div>
              </div>

              {/* Tab Selector (Horizontally scrollable on small mobile) */}
              <div className="flex overflow-x-auto no-scrollbar gap-1 border-b border-secondary-800 text-[10px] font-mono uppercase tracking-wider pb-1">
                <button
                  onClick={() => setActiveTab("pipeline")}
                  className={`py-1 px-2.5 sm:px-3 whitespace-nowrap transition-colors border-b-2 cursor-pointer ${activeTab === "pipeline" ? "border-primary-400 text-primary-300 font-bold" : "border-transparent text-secondary-500 hover:text-secondary-300"}`}
                >
                  Pipeline
                </button>
                <button
                  onClick={() => setActiveTab("files")}
                  className={`py-1 px-2.5 sm:px-3 whitespace-nowrap transition-colors border-b-2 cursor-pointer ${activeTab === "files" ? "border-primary-400 text-primary-300 font-bold" : "border-transparent text-secondary-500 hover:text-secondary-300"}`}
                >
                  File Tree
                </button>
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`py-1 px-2.5 sm:px-3 whitespace-nowrap transition-colors border-b-2 cursor-pointer ${activeTab === "preview" ? "border-primary-400 text-primary-300 font-bold" : "border-transparent text-secondary-500 hover:text-secondary-300"}`}
                >
                  Live Preview
                </button>
                <button
                  onClick={() => setActiveTab("deploy")}
                  className={`py-1 px-2.5 sm:px-3 whitespace-nowrap transition-colors border-b-2 cursor-pointer ${activeTab === "deploy" ? "border-primary-400 text-primary-300 font-bold" : "border-transparent text-secondary-500 hover:text-secondary-300"}`}
                >
                  Deployment
                </button>
              </div>

              {/* Tab 1: Pipeline Telemetry */}
              {activeTab === "pipeline" && (
                <div className="space-y-3.5 py-1">
                  <div className="space-y-1.5">
                    <div className="text-[10px] sm:text-[11px] font-mono text-primary-400 flex items-center gap-1.5">
                      <span className="text-secondary-600">&gt;</span> Prompt Input
                    </div>
                    <div className="p-2.5 sm:p-3 bg-[#05080c] border border-secondary-800 text-secondary-300 font-mono text-[11px] sm:text-xs leading-relaxed border-l-2 border-l-primary-500 break-words">
                      &quot;Create a high-converting SaaS billing &amp; analytics dashboard with dark theme, pricing tiers, and interactive charts&quot;
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="text-[9px] sm:text-[10px] font-mono text-secondary-500 uppercase tracking-wider border-b border-secondary-800/60 pb-1 flex justify-between">
                      <span>Telemetry Feed</span>
                      <span className="text-primary-400 font-bold">STATUS: 200 OK</span>
                    </div>
                    <div className="space-y-1.5 font-mono text-[10px] sm:text-[11px]">
                      <div className="flex justify-between items-center text-secondary-400">
                        <span className="truncate pr-2">[1] Model Engine: Google Gemini 3.6 / OpenRouter</span>
                        <span className="text-primary-400 text-[9px] sm:text-[10px] shrink-0">ENGAGED</span>
                      </div>
                      <div className="flex justify-between items-center text-secondary-400">
                        <span className="truncate pr-2">[2] Contract Architecture &amp; Scaffolding</span>
                        <span className="text-primary-400 text-[9px] sm:text-[10px] shrink-0">5 FILES</span>
                      </div>
                      <div className="flex justify-between items-center text-secondary-400">
                        <span className="truncate pr-2">[3] Fast Sandpack React Sandbox</span>
                        <span className="text-primary-400 text-[9px] sm:text-[10px] shrink-0">ACTIVE</span>
                      </div>
                      <div className="flex justify-between items-center text-secondary-400">
                        <span className="truncate pr-2">[4] Dependency Sanitizer &amp; Error Interceptor</span>
                        <span className="text-primary-400 text-[9px] sm:text-[10px] shrink-0">ARMED</span>
                      </div>
                      <div className="flex justify-between items-center text-secondary-400">
                        <span className="truncate pr-2">[5] 1-Click Git &amp; Vercel Edge Pipeline</span>
                        <span className="text-primary-400 text-[9px] sm:text-[10px] shrink-0">READY</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Interactive File Tree Explorer */}
              {activeTab === "files" && (
                <div className="space-y-3 py-1 font-mono text-xs">
                  <div className="flex justify-between items-center text-[10px] text-secondary-500 uppercase tracking-widest pb-1 border-b border-secondary-800">
                    <span>Select File to Preview</span>
                    <span className="text-primary-400">{selectedFile}</span>
                  </div>

                  {/* Clickable File Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {Object.keys(fileCodeSnippets).map((filename) => (
                      <button
                        key={filename}
                        onClick={() => setSelectedFile(filename)}
                        className={`text-[10px] px-2 py-1 border transition-all cursor-pointer ${selectedFile === filename
                          ? "border-primary-400 bg-primary-500/10 text-primary-300 font-bold"
                          : "border-secondary-800 bg-[#05080c] text-secondary-400 hover:border-secondary-700"
                          }`}
                      >
                        {filename.endsWith(".jsx") ? "📄 " : filename.endsWith(".css") ? "🎨 " : "⚙️ "}
                        {filename}
                      </button>
                    ))}
                  </div>

                  {/* Code Viewer */}
                  <div className="bg-[#05080c] border border-secondary-800 p-2.5 max-h-48 overflow-y-auto overflow-x-auto text-[10px] text-secondary-300 leading-relaxed font-mono select-text">
                    <pre>
                      <code>{fileCodeSnippets[selectedFile]}</code>
                    </pre>
                  </div>
                </div>
              )}

              {/* Tab 3: Interactive Mini App Preview */}
              {activeTab === "preview" && (
                <div className="space-y-3 py-1">
                  <div className="flex justify-between items-center text-[10px] font-mono text-secondary-500 uppercase tracking-widest pb-1 border-b border-secondary-800">
                    <span>Sandpack Sandbox Output</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setAppTheme(appTheme === "dark" ? "teal" : "dark")}
                        className="text-[9px] px-1.5 py-0.5 border border-secondary-700 text-secondary-400 hover:text-primary-300 cursor-pointer"
                      >
                        Theme: {appTheme.toUpperCase()}
                      </button>
                    </div>
                  </div>

                  {/* Mini Interactive App Canvas */}
                  <div className={`p-3.5 border rounded-none transition-colors ${appTheme === "dark"
                    ? "bg-[#04060a] border-secondary-800 text-white"
                    : "bg-[#071318] border-primary-800/60 text-teal-100"
                    }`}>
                    <div className="flex justify-between items-center pb-2.5 border-b border-secondary-800/60 text-[11px]">
                      <div className="font-bold flex items-center gap-1.5 text-primary-400">
                        <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-ping"></span>
                        CloudMetrics
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setBillingCycle("monthly")}
                          className={`px-1.5 py-0.5 text-[9px] font-mono transition-colors cursor-pointer ${billingCycle === "monthly" ? "bg-primary-500 text-secondary-950 font-bold" : "text-secondary-400"}`}
                        >
                          Mo
                        </button>
                        <button
                          onClick={() => setBillingCycle("yearly")}
                          className={`px-1.5 py-0.5 text-[9px] font-mono transition-colors cursor-pointer ${billingCycle === "yearly" ? "bg-primary-500 text-secondary-950 font-bold" : "text-secondary-400"}`}
                        >
                          Yr (-20%)
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 my-2.5">
                      <div className="p-2 border border-secondary-800 bg-[#090f17]">
                        <div className="text-[9px] text-secondary-500 uppercase font-mono">Total ARR</div>
                        <div className="text-sm font-mono font-bold text-white mt-0.5">
                          {billingCycle === "monthly" ? "$24,580" : "$294,960"}
                        </div>
                      </div>
                      <div className="p-2 border border-secondary-800 bg-[#090f17]">
                        <div className="text-[9px] text-secondary-500 uppercase font-mono">Conversion</div>
                        <div className="text-sm font-mono font-bold text-primary-400 mt-0.5">4.82% ↑</div>
                      </div>
                    </div>

                    <div className="text-[10px] text-secondary-400 flex items-center justify-between pt-1">
                      <span className="font-mono text-[9px] text-secondary-500">Live Virtual Sandbox Active</span>
                      <span className="text-primary-400 font-mono text-[9px]">Responsive 100%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Cloud Deployment */}
              {activeTab === "deploy" && (
                <div className="space-y-3 py-1 font-mono">
                  <div className="text-[10px] text-secondary-500 uppercase tracking-widest pb-1 border-b border-secondary-800 flex justify-between">
                    <span>Cloud Deployment Pipeline</span>
                    <span className="text-primary-400">READY (Edge)</span>
                  </div>
                  <div className="p-2.5 sm:p-3 bg-[#05080c] border border-secondary-800 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-secondary-500 text-[11px]">GitHub Repo:</span>
                      <span className="text-primary-400 text-[11px] truncate max-w-[170px] sm:max-w-none">
                        github.com/user/saas-dashboard
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-secondary-500 text-[11px]">Vercel Edge:</span>
                      <span className="text-primary-400 text-[11px] font-bold">200 OK (Instant)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-secondary-500 text-[11px]">Database Sync:</span>
                      <span className="text-secondary-300 text-[11px]">Auto-saved to Supabase</span>
                    </div>
                    <div className="pt-2 border-t border-secondary-800/80 flex items-center justify-between">
                      <span className="text-[9px] sm:text-[10px] text-secondary-500 uppercase">Live URL:</span>
                      <a
                        href="/builder"
                        className="text-primary-300 text-xs underline hover:text-primary-200 transition-colors flex items-center gap-1"
                      >
                        saas-dashboard.vercel.app ↗
                      </a>
                    </div>
                  </div>
                  <div className="text-[10px] text-secondary-500 leading-relaxed">
                    Auto-saves your project before deploying. Live URLs and repository links are permanently preserved in your workspace dashboard.
                  </div>
                </div>
              )}

              {/* Status bar */}
              <div className="border-t border-secondary-800/80 pt-2.5 flex items-center justify-between text-[9px] sm:text-[10px] font-mono text-secondary-500">
                <span>VITE + REACT + TAILWIND</span>
                <span className="text-primary-400">AUTO_HEALING_&amp;_RESUME_READY</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Infinite Scrolling Ticker Tape Marquee */}
      <div className="w-full border-y border-secondary-800 bg-[#070c12] py-2.5 sm:py-3 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap text-[10px] sm:text-xs font-mono uppercase tracking-[0.22em] text-secondary-400">
          <span className="mx-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-primary-400"></span> GOOGLE GEMINI • OPENROUTER • NVIDIA ENGINES
          </span>
          <span className="mx-4 flex items-center gap-2 text-primary-300">
            <span>+</span> MULTI-FILE REACT ARCHITECTURE
          </span>
          <span className="mx-4 flex items-center gap-2">
            <span>+</span> FAST SANDPACK IN-BROWSER SANDBOX
          </span>
          <span className="mx-4 flex items-center gap-2 text-primary-300">
            <span>+</span> PARTIAL GENERATION PRESERVATION &amp; RESUME
          </span>
          <span className="mx-4 flex items-center gap-2">
            <span>+</span> SELF-HEALING AI ERROR DIAGNOSTICS
          </span>
          <span className="mx-4 flex items-center gap-2 text-primary-300">
            <span>+</span> FULLSCREEN MODAL &amp; NEW TAB POP-OUT
          </span>
          <span className="mx-4 flex items-center gap-2">
            <span>+</span> 1-CLICK VERCEL &amp; GITHUB DEPLOYMENT
          </span>
          <span className="mx-4 flex items-center gap-2 text-primary-300">
            <span>+</span> DEPENDENCY AUTO-SANITIZER
          </span>
          <span className="mx-4 flex items-center gap-2">
            <span>+</span> STANDALONE NPM ZIP EXPORT
          </span>
          <span className="mx-4 flex items-center gap-2 text-primary-300">
            <span>+</span> SUPABASE PERSISTENT WORKSPACES
          </span>
          <span className="mx-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-primary-400"></span> GOOGLE GEMINI • OPENROUTER • NVIDIA ENGINES
          </span>
          <span className="mx-4 flex items-center gap-2 text-primary-300">
            <span>+</span> MULTI-FILE REACT ARCHITECTURE
          </span>
          <span className="mx-4 flex items-center gap-2">
            <span>+</span> FAST SANDPACK IN-BROWSER SANDBOX
          </span>
          <span className="mx-4 flex items-center gap-2 text-primary-300">
            <span>+</span> PARTIAL GENERATION PRESERVATION &amp; RESUME
          </span>
          <span className="mx-4 flex items-center gap-2">
            <span>+</span> SELF-HEALING AI ERROR DIAGNOSTICS
          </span>
          <span className="mx-4 flex items-center gap-2 text-primary-300">
            <span>+</span> FULLSCREEN MODAL &amp; NEW TAB POP-OUT
          </span>
          <span className="mx-4 flex items-center gap-2">
            <span>+</span> 1-CLICK VERCEL &amp; GITHUB DEPLOYMENT
          </span>
          <span className="mx-4 flex items-center gap-2 text-primary-300">
            <span>+</span> DEPENDENCY AUTO-SANITIZER
          </span>
          <span className="mx-4 flex items-center gap-2">
            <span>+</span> STANDALONE NPM ZIP EXPORT
          </span>
          <span className="mx-4 flex items-center gap-2 text-primary-300">
            <span>+</span> SUPABASE PERSISTENT WORKSPACES
          </span>
        </div>
      </div>

      {/* Core Capabilities Grid Section */}
      <section className="py-16 sm:py-24 md:py-28 border-b border-secondary-800 relative">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="mb-10 sm:mb-16 max-w-3xl">
            <div className="text-[10px] sm:text-xs font-mono text-primary-400 uppercase tracking-widest mb-2.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary-400 block"></span>
              CORE CAPABILITIES
            </div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-display font-light text-white mb-3.5 tracking-tight">
              Engineered for Speed, <br />
              <span className="text-primary-400 font-medium">Built for Production.</span>
            </h2>
            <p className="text-xs sm:text-base text-secondary-400 font-light leading-relaxed">
              Every stage of modern web app construction is handled autonomously—from multi-file modular code generation and in-browser execution to one-click deployment.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[
              {
                id: "01",
                title: "Multi-File React Architecture",
                description: "Generates modular JSX components with strict contract validation, local relative imports, and zero broken placeholders. Clean, maintainable code structure.",
                badge: "CONTRACT ENGINE",
              },
              {
                id: "02",
                title: "Live Sandpack Sandbox",
                description: "Experience your application in real-time inside an in-browser live virtual filesystem. Switch between desktop, tablet, and mobile viewports, or launch into Fullscreen and New Tab.",
                badge: "HMR SANDBOX",
              },
              {
                id: "03",
                title: "Partial Generation & Resume",
                description: "Never lose code to quota limits or timeouts. Completed files are preserved, drafts auto-save to storage, and you can resume missing files in a single click.",
                badge: "RESUME ENGINE",
              },
              {
                id: "04",
                title: "Self-Healing AI Diagnostics",
                description: "Frame-boundary interceptors catch runtime evaluation errors and syntax hiccups. One-click AI quick-fix heals the codebase automatically with full stack trace diagnostics.",
                badge: "AUTO-FIX",
              },
              {
                id: "05",
                title: "1-Click GitHub & Vercel Deploy",
                description: "Auto-saves unsaved work, creates a personal GitHub repository, and triggers production edge builds on Vercel with dedicated live domain links.",
                badge: "PRODUCTION DEPLOY",
              },
              {
                id: "06",
                title: "Multi-Provider AI Orchestration",
                description: "Powered by Google Gemini 3.6/3.8 Flash, OpenRouter, and NVIDIA NIM with automated 35-second timeouts and circuit-breaker failovers.",
                badge: "TRI-ENGINE",
              },
              {
                id: "07",
                title: "Conversational AI Refinement",
                description: "Multi-turn database memory feeds full conversation context into refinement prompts. Tweak components, adjust designs, or abort anytime with the interactive Stop button.",
                badge: "AI CHAT",
              },
              {
                id: "08",
                title: "Dependency Auto-Sanitizer",
                description: "Automatically detects external npm imports, reconciles version hallucination with a curated semver catalog, and injects compatible packages into Sandpack seamlessly.",
                badge: "SMART PACKAGES",
              },
              {
                id: "09",
                title: "Standalone ZIP Export",
                description: "Download ready-to-run project archives configured with Vite, React 18/19, Lucide icons, and Tailwind CSS. Run locally anywhere with `npm run dev`.",
                badge: "EXPORT ZIP",
              },
            ].map((feature) => (
              <div
                key={feature.id}
                className="bg-secondary-900/70 border border-secondary-800 p-5 sm:p-7 hover:border-primary-500/50 hover:bg-secondary-900 transition-all group relative flex flex-col justify-between"
              >
                <div>
                  <div className="text-xs font-mono text-primary-400 mb-4 flex items-center justify-between">
                    <span className="font-bold">[{feature.id}]</span>
                    <span className="text-[9px] uppercase tracking-wider text-secondary-500 border border-secondary-700/60 px-2 py-0.5 group-hover:border-primary-500/40 group-hover:text-primary-300 transition-colors">
                      {feature.badge}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-display text-white mb-2 uppercase tracking-wide">
                    {feature.title}
                  </h3>
                  <p className="text-secondary-400 text-xs sm:text-sm leading-relaxed font-light">
                    {feature.description}
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-secondary-800/60 flex items-center justify-between text-[10px] font-mono text-secondary-600 group-hover:text-primary-400 transition-colors">
                  <span>SYSTEM_CAPABILITY</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works / Workflow */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-16 sm:py-24 md:py-28">
        <div className="mb-10 sm:mb-16">
          <div className="text-[10px] sm:text-xs font-mono text-primary-400 uppercase tracking-widest mb-2.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-primary-400 block"></span>
            WORKFLOW PIPELINE
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-display font-light text-white tracking-tight">
            From Natural Language to <br />
            <span className="text-primary-400 font-medium">Live Cloud Deployment.</span>
          </h2>
        </div>

        <div className="space-y-4">
          {[
            {
              step: "01",
              title: "Prompt & Architect",
              description: "Select your AI engine (Google Gemini, OpenRouter, or NVIDIA) and describe your application in natural language. The system creates contract schemas, generates modular JSX components, and configures Tailwind styling.",
              tag: "STEP 1: ARCHITECTURE",
            },
            {
              step: "02",
              title: "Interactive Sandbox & Refinement",
              description: "Test your application in real-time using the Sandpack in-browser preview. Switch viewport modes (Desktop, Tablet, Mobile), expand fullscreen or pop out to a new tab, chat to refine with persistent memory, or resume partial builds.",
              tag: "STEP 2: VALIDATION & CHAT",
            },
            {
              step: "03",
              title: "1-Click Production Deploy & Export",
              description: "Click Deploy or Export. The system auto-saves your project, creates a repository on your personal GitHub, spins up a live edge production build on Vercel, or packages a ready-to-run Vite+React ZIP archive.",
              tag: "STEP 3: CLOUD LAUNCH",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="group border border-secondary-800 bg-secondary-900/60 p-5 sm:p-7 flex flex-col md:flex-row md:items-center gap-4 sm:gap-6 hover:border-primary-500/50 transition-all relative overflow-hidden"
            >
              <div className="flex-shrink-0 w-12 sm:w-14 h-12 sm:h-14 border border-secondary-700 bg-secondary-800/80 flex items-center justify-center text-base sm:text-lg font-display text-primary-400 group-hover:bg-primary-500/10 group-hover:border-primary-400 transition-colors">
                {item.step}
              </div>
              <div className="flex-grow space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <h3 className="text-base sm:text-lg font-display text-white uppercase tracking-wide">
                    {item.title}
                  </h3>
                  <span className="text-[9px] font-mono text-primary-400/90 bg-primary-500/10 px-2 py-0.5">
                    {item.tag}
                  </span>
                </div>
                <p className="text-secondary-400 text-xs sm:text-sm font-light leading-relaxed">
                  {item.description}
                </p>
              </div>
              <div className="flex-shrink-0 pt-2 md:pt-0">
                <Link href="/builder">
                  <span className="text-[10px] sm:text-xs font-mono text-primary-400 uppercase tracking-widest hover:text-primary-300 flex items-center gap-2 transition-colors cursor-pointer">
                    Execute Stage <span className="bg-primary-500/20 px-2 py-1">&gt;</span>
                  </span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison: Why AI Website Builder */}
      <section className="border-t border-secondary-800 bg-[#060a10] py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="mb-10 sm:mb-14 text-center max-w-2xl mx-auto">
            <div className="text-[10px] sm:text-xs font-mono text-primary-400 uppercase tracking-widest mb-2">
              SYSTEM ADVANTAGE
            </div>
            <h2 className="text-2xl sm:text-4xl font-display font-light text-white tracking-tight">
              Standard Code, <span className="text-primary-400 font-medium">No Proprietary Lock-In.</span>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-secondary-800 text-[10px] sm:text-xs font-mono uppercase tracking-widest text-secondary-500">
                  <th className="py-3 px-4">Feature</th>
                  <th className="py-3 px-4 text-primary-400">AI Website Builder</th>
                  <th className="py-3 px-4 text-secondary-500">Legacy AI Builders</th>
                </tr>
              </thead>
              <tbody className="text-xs sm:text-sm font-light divide-y divide-secondary-800/60">
                <tr>
                  <td className="py-3.5 px-4 font-mono text-secondary-300">File Structure</td>
                  <td className="py-3.5 px-4 text-white font-medium">Modular multi-file Vite + React JSX</td>
                  <td className="py-3.5 px-4 text-secondary-500">Single giant monolithic file</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-mono text-secondary-300">Preview Engine</td>
                  <td className="py-3.5 px-4 text-white font-medium">Fast Sandpack with Fullscreen &amp; Viewports</td>
                  <td className="py-3.5 px-4 text-secondary-500">Laggy remote iframes</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-mono text-secondary-300">Build Resilience</td>
                  <td className="py-3.5 px-4 text-white font-medium">Partial file preservation &amp; 1-click resume</td>
                  <td className="py-3.5 px-4 text-secondary-500">Wipes all progress on model timeout</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-mono text-secondary-300">Error Handling</td>
                  <td className="py-3.5 px-4 text-white font-medium">Self-Healing AI Auto-Fix &amp; Dependency Sanitizer</td>
                  <td className="py-3.5 px-4 text-secondary-500">Manual copy-paste error prompts</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-mono text-secondary-300">Cloud Deployment</td>
                  <td className="py-3.5 px-4 text-white font-medium">1-Click direct to user GitHub &amp; Vercel</td>
                  <td className="py-3.5 px-4 text-secondary-500">Walled garden hosting fees</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-mono text-secondary-300">Code Export</td>
                  <td className="py-3.5 px-4 text-white font-medium">Ready-to-run ZIP archive with Vite + Tailwind</td>
                  <td className="py-3.5 px-4 text-secondary-500">Incomplete code or raw snippets</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Navigation Quick Access (Cyberpunk Panels) */}
      <section className="border-t border-secondary-800 bg-[#070b10] py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Builder Workspace */}
            <Link href="/builder">
              <div className="h-full p-5 sm:p-7 border border-secondary-800 bg-secondary-900/70 hover:border-primary-400 transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-6 sm:w-8 h-6 sm:h-8 border-t-2 border-r-2 border-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div>
                  <div className="text-[10px] font-mono text-primary-400 uppercase tracking-widest mb-3 sm:mb-4 border-b border-secondary-800 pb-2 flex items-center justify-between">
                    <span>WORKSPACE</span>
                    <span className="w-1.5 h-1.5 bg-primary-400 animate-pulse"></span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-display text-white mb-2">Builder</h3>
                  <p className="text-xs sm:text-sm text-secondary-400 font-light mb-5 sm:mb-6 leading-relaxed">
                    AI generation canvas, multi-provider model selection, Sandpack live sandbox, Monaco code editor, and 1-click Vercel deployment.
                  </p>
                </div>
                <div className="text-primary-400 font-mono text-xs uppercase tracking-widest flex items-center justify-between pt-3 sm:pt-4 border-t border-secondary-800/80">
                  Launch Environment
                  <span className="transform group-hover:translate-x-2 transition-transform">→</span>
                </div>
              </div>
            </Link>

            {/* Project Repository */}
            <Link href="/projects">
              <div className="h-full p-5 sm:p-7 border border-secondary-800 bg-secondary-900/70 hover:border-primary-400 transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-6 sm:w-8 h-6 sm:h-8 border-t-2 border-r-2 border-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div>
                  <div className="text-[10px] font-mono text-primary-400 uppercase tracking-widest mb-3 sm:mb-4 border-b border-secondary-800 pb-2 flex items-center justify-between">
                    <span>REPOSITORY</span>
                    <span className="text-[9px] text-secondary-500">SUPABASE</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-display text-white mb-2">My Projects</h3>
                  <p className="text-xs sm:text-sm text-secondary-400 font-light mb-5 sm:mb-6 leading-relaxed">
                    Browse saved applications, manage versions, and jump directly to your live Vercel domains and GitHub repositories.
                  </p>
                </div>
                <div className="text-primary-400 font-mono text-xs uppercase tracking-widest flex items-center justify-between pt-3 sm:pt-4 border-t border-secondary-800/80">
                  Access Projects
                  <span className="transform group-hover:translate-x-2 transition-transform">→</span>
                </div>
              </div>
            </Link>

            {/* Authentication Portal */}
            <div
              onClick={() => signInWithGoogle('/builder')}
              className="h-full p-5 sm:p-7 border border-secondary-800 bg-secondary-900/70 hover:border-primary-400 transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-6 sm:w-8 h-6 sm:h-8 border-t-2 border-r-2 border-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div>
                <div className="text-[10px] font-mono text-primary-400 uppercase tracking-widest mb-3 sm:mb-4 border-b border-secondary-800 pb-2 flex items-center justify-between">
                  <span>SECURITY</span>
                  <span className="text-[9px] text-secondary-500">GOOGLE OAUTH</span>
                </div>
                <h3 className="text-lg sm:text-xl font-display text-white mb-2">Cloud Access</h3>
                <p className="text-xs sm:text-sm text-secondary-400 font-light mb-5 sm:mb-6 leading-relaxed">
                  Authenticate with Google to unlock cloud synchronization, auto-saving before deploy, and persistent project history.
                </p>
              </div>
              <div className="text-primary-400 font-mono text-xs uppercase tracking-widest flex items-center justify-between pt-3 sm:pt-4 border-t border-secondary-800/80">
                Connect with Google
                <span className="transform group-hover:translate-x-2 transition-transform">→</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Full Width CTA Banner */}
      <section className="bg-gradient-to-b from-primary-950/20 to-[#05080c] border-t border-primary-900/40 py-16 sm:py-24 relative overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(var(--color-primary-400) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary-400) 1px, transparent 1px)', backgroundSize: '36px 36px' }}></div>

        <div className="max-w-4xl mx-auto px-3 sm:px-6 text-center relative z-10 space-y-5 sm:space-y-6">
          <div className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-primary-400">
            <span className="w-1.5 h-1.5 bg-primary-400 animate-pulse"></span>
            ZERO SETUP REQUIRED
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-display font-light text-white tracking-tight">
            Ready to Build and <br />
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-teal-200">
              Deploy Your Vision?
            </span>
          </h2>
          <p className="text-xs sm:text-base md:text-lg text-secondary-400 font-light max-w-xl mx-auto leading-relaxed">
            Create production React applications with Tailwind CSS in seconds.
            No dependencies to configure, no complex build scripts.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/builder" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto bg-primary-500 hover:bg-primary-400 text-secondary-900 font-bold rounded-none px-8 sm:px-12 py-3.5 sm:py-4 uppercase tracking-widest text-xs transition-colors shadow-lg shadow-primary-500/20 cursor-pointer"
              >
                Launch Builder Workspace _
              </Button>
            </Link>
            <Link href="/projects" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto bg-transparent border border-secondary-700 hover:border-primary-400 text-white rounded-none px-8 sm:px-10 py-3.5 sm:py-4 uppercase tracking-widest text-xs transition-colors cursor-pointer"
              >
                My Projects ↗
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#03060a] border-t border-secondary-800 py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-primary-500/10 border border-primary-500/30 flex items-center justify-center">
              <span className="text-primary-400 font-mono text-[10px]">AI</span>
            </div>
            <span className="text-white font-display uppercase tracking-widest text-xs font-medium">
              AI Website Builder
            </span>
          </div>
          <div className="text-secondary-500 text-[9px] sm:text-[11px] font-mono uppercase tracking-widest">
            © {new Date().getFullYear()} AI WEBSITE BUILDER. VITE • REACT • TAILWIND • GEMINI • VERCEL.
          </div>
        </div>
      </footer>
    </div>
  );
}