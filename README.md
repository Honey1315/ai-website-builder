# AI Website Builder

A modern, full-stack AI website builder powered by Next.js 16, React 19, and Tailwind CSS v4. Generate, preview, iteratively refine, and deploy complete multi-file React web applications directly in your browser using natural language prompts.

---

## Features

- **Contract-First Multi-File Generation**  
  Generates production-ready, modular React projects following a contract-first architecture (Structure &rarr; Manifest &rarr; Generation &rarr; Contract Validation &rarr; Auto-Fixing) streamed in real-time via Server-Sent Events (SSE).

- **Multi-Provider AI Support**  
  - **Google Gemini** (Default / Primary): Supports models like `gemini-3.5-flash-lite`, `gemini-3.6-flash`, `gemini-3.8-flash`, and `gemini-3.7-flash`.
  - **OpenRouter**: Selectable free/paid models (e.g. `poolside/laguna-xs-2.1:free`, `qwen/qwen3.8-27b:free`, `z-ai/glm-5.2:free`).
  - **NVIDIA NIM**: Accelerated models (e.g. `nvidia/nemotron-3-super-120b-a12b`).

- **Partial Generation & Resumption**  
  If generation is interrupted or encounters rate limits, completed files are preserved in a partial project state. Resume generation with one click or switch models seamlessly without losing progress.

- **Interactive Code Refinement & Auto-Fix**  
  Chat with AI to modify specific components or add features. Runtime errors detected in the Sandpack preview feature a 1-click **Auto-Fix ↗** button that automatically feeds the stack trace and fix prompt to the AI.

- **In-Browser Live Sandbox & Code Editor**  
  Live interactive preview powered by CodeSandbox Sandpack with Vite, React, and Tailwind CSS support. Includes a multi-tab file explorer and syntax-highlighted editor.

- **Unsaved Work Guard & Local Drafts**  
  - Draft projects and generated files are automatically preserved in `localStorage`.
  - Browser `beforeunload` protection warns on accidental window/tab close when unsaved work exists.
  - Safe SPA navigation modal alerts users before leaving the builder with options to **Save & Leave**, **Leave Without Saving**, or **Cancel**.

- **Seamless Google OAuth Authentication**  
  Powered by Supabase Auth (`@supabase/ssr`) with PKCE cookie sessions. In-place authentication gates for both generation and refinement modules guide unauthenticated users to sign in with a single click.

- **Cloud Projects Management**  
  Save and manage projects in a PostgreSQL database via Prisma ORM. View, search, rename, edit descriptions, or reopen saved projects on the `/projects` dashboard.

- **1-Click GitHub & Vercel Deployment**  
  Deploy generated apps directly to GitHub (new repository creation and code push) and Vercel (automated build and deployment). Personal access tokens are securely encrypted at rest using AES-256-GCM.

- **Standalone ZIP Export**  
  Download a fully configured Vite + React + Tailwind CSS project ready to run locally with `npm install && npm run dev`.

---

## Technology Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **UI & Styling**: React 19, Tailwind CSS v4 (`@tailwindcss/postcss`)
- **Code Sandbox**: CodeSandbox Sandpack React
- **Database & ORM**: PostgreSQL, Prisma ORM (`@prisma/client`)
- **Authentication**: Supabase Auth with `@supabase/ssr` (Google OAuth)
- **AI SDKs**: `@google/generative-ai` (Gemini), OpenAI SDK (OpenRouter & NVIDIA NIM)
- **Export & Packaging**: JSZip, FileSaver
- **Security**: Node.js `crypto` (AES-256-GCM token encryption)

---

## Getting Started

### Prerequisites

- **Node.js**: `v18.18.0` or later (Node.js 20+ recommended)
- **Package Manager**: npm, pnpm, yarn, or bun
- **Supabase Account**: A Supabase project for authentication and PostgreSQL database
- **Google Gemini API Key**: Free API key from [Google AI Studio](https://aistudio.google.com/apikey)

---

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Honey1315/ai-website-builder.git
   cd ai-website-builder
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory (refer to `.env.example`):

   ```env
   # -----------------------------------------------------------------------------
   # Supabase Configuration (Authentication & Client)
   # -----------------------------------------------------------------------------
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
   SUPABASE_SECRET_KEY=your-supabase-service-role-key

   # -----------------------------------------------------------------------------
   # Database Configuration (PostgreSQL / Supabase Pooler)
   # -----------------------------------------------------------------------------
   DATABASE_URL="postgresql://postgres.[project-id]:[password]@aws-1-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.[project-id]:[password]@aws-1-[region].pooler.supabase.com:5432/postgres"

   # -----------------------------------------------------------------------------
   # AI Providers
   # -----------------------------------------------------------------------------
   # Google Gemini (Primary / Default: https://aistudio.google.com/apikey)
   GEMINI_API_KEY=your_gemini_api_key

   # OpenRouter (Optional: https://openrouter.ai/keys)
   OPENROUTER_API_KEY=your_openrouter_api_key

   # NVIDIA NIM (Optional: https://build.nvidia.com/)
   NVIDIA_API_KEY=your_nvidia_api_key

   # -----------------------------------------------------------------------------
   # Security & Token Encryption
   # -----------------------------------------------------------------------------
   # Secret used to encrypt GitHub & Vercel deployment tokens (minimum 32 characters)
   TOKEN_ENCRYPTION_SECRET=your_32_character_random_encryption_secret_key
   ```

4. **Initialize Database Schema:**
   Generate the Prisma client and synchronize the database schema:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the Development Server:**
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser. The builder workspace is accessible at [http://localhost:3000/builder](http://localhost:3000/builder).

---

## Generation & Build Workflow

```mermaid
graph TD
    A[Natural Language Prompt] --> B[AI Project Structure]
    B --> C[Project Manifest & Contracts]
    C --> D[Incremental File Generation]
    D --> E[Sandpack Live Preview]
    E --> F{Runtime Error?}
    F -- Yes --> G[1-Click Auto-Fix via AI]
    G --> D
    F -- No --> H[Iterative Chat Refinement]
    H --> D
    E --> I[Export ZIP / 1-Click Deploy to GitHub & Vercel]
```

1. **Prompt**: Enter a project prompt or select from curated quick-start examples.
2. **Structure & Manifest**: The AI defines the file topology, component hierarchy, and export/import contracts before writing code.
3. **Streamed Generation**: Code is generated and streamed per-file over Server-Sent Events, instantly appearing in the Sandpack editor and preview.
4. **Validation & Auto-Fix**: Imports, dependencies, and contract mismatches are inspected; any Sandpack build errors can be auto-fixed with a single click.
5. **Refine & Save**: Chat to tweak styles or logic. Save the project to your cloud dashboard or export/deploy when ready.

---

## Project Structure

```text
├── app/
│   ├── api/
│   │   ├── deploy/
│   │   │   ├── github/route.ts       # GitHub repo creation and commit dispatch
│   │   │   └── vercel/route.ts       # Automated Vercel project deployment
│   │   ├── export/route.ts           # Server-side ZIP export endpoint
│   │   ├── generate/route.ts         # SSE streaming code generation endpoint
│   │   ├── project/                  # Project CRUD and cloud save endpoints
│   │   ├── refine/route.ts           # Code refinement endpoint
│   │   └── tokens/                   # Encrypted GitHub/Vercel token management
│   ├── auth/
│   │   ├── callback/route.ts         # Supabase OAuth PKCE callback handler
│   │   └── error/page.tsx            # Auth error display
│   ├── builder/
│   │   ├── components/
│   │   │   ├── ChatPanel.tsx         # Refinement chat panel & auto-fix UI
│   │   │   ├── DeployModal.tsx       # GitHub & Vercel deployment modal
│   │   │   ├── ExportModal.tsx       # ZIP export options modal
│   │   │   ├── PromptInput.tsx       # Generation input & auth gate module
│   │   │   ├── SandpackEditor.tsx    # Live preview & in-browser code editor
│   │   │   └── TokensModal.tsx       # Token management modal
│   │   └── page.tsx                  # Main builder workspace page
│   ├── projects/
│   │   └── page.tsx                  # User projects dashboard
│   ├── layout.tsx                    # Root layout with fonts and metadata
│   └── page.tsx                      # Landing page
├── components/                       # Shared UI components (Navbar, Modals, Buttons)
├── lib/
│   ├── auth-client.ts                # Client-side Supabase authentication helpers
│   ├── auth.ts                       # Server-side user authentication verification
│   ├── encryption.ts                 # AES-256-GCM token encryption and decryption
│   ├── gemini.ts                     # Google Gemini SDK client
│   └── sandpackTheme.ts              # Custom editor themes for Sandpack
├── prisma/
│   └── schema.prisma                 # Database schema for users, projects, and tokens
├── services/
│   └── ai.service.ts                 # Core AI generation, manifest, and validation logic
└── utils/
    └── constants.ts                  # Model catalogs, default providers, and prompts
```

---

## Deployment Configuration

### 1-Click Deploy (GitHub & Vercel)
Users can securely store personal access tokens in their account to deploy apps in one click:
- **GitHub Personal Access Token**: Requires `repo` permissions to create repositories and push source code.
- **Vercel Access Token**: Created in your Vercel Account Settings &rarr; Tokens.
- All tokens are encrypted using **AES-256-GCM** using the `TOKEN_ENCRYPTION_SECRET` prior to storage in PostgreSQL.

### Hosting on Vercel
Deploy the AI Website Builder web application to Vercel:
1. Push your repository to GitHub.
2. Import the project into [Vercel](https://vercel.com/new).
3. Add all environment variables listed in `.env.example`.
4. Deploy!

---

## License

This project is licensed under the [MIT License](LICENSE).