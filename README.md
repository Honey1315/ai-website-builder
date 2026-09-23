# AI Website Builder

An AI-powered website builder built with Next.js that allows users to generate websites through natural language prompts.

## Features

- **AI-Powered Generation**: Generate complete website projects from natural language descriptions
- **Interactive Refinement**: Chat with the AI to modify and improve generated code  
- **Live Preview**: See your changes in real-time with Sandpack integration
- **Code Editing**: Directly edit generated code in the browser-based code editor
- **File Management**: Explore and manage generated project files
- **Component-Based Architecture**: Generates modular, component-based web applications
- **User Authentication**: Secure authentication with Google OAuth and session management using Supabase Auth

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI Library**: Tailwind CSS
- **Code Editor**: Sandpack (live code playground)
- **State Management**: React Hooks (useState)
- **Authentication**: Supabase Auth with Google OAuth provider
- **AI Integration**: Custom API routes for code generation and refinement

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

### Environment Variables

Create a `.env.local` file in the root directory with:

```env
# NVIDIA API Configuration
NVIDIA_API_KEY=your_nvidia_api_key

# OpenRouter API Configuration (optional — enables the OpenRouter model provider)
OPENROUTER_API_KEY=your_openrouter_api_key

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key

# Optional: For direct database access (if needed)
# DATABASE_URL=your_postgresql_connection_string

# Optional: Google OAuth Configuration (for additional configuration if needed)
# GOOGLE_CLIENT_ID=your_google_client_id
# GOOGLE_CLIENT_SECRET=your_google_client_secret

NEXTAUTH_SECRET=your_super_secret_key_here
NEXTAUTH_URL=http://localhost:3000
```

**Important**: 
- For Supabase, you need to get your `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` from your Supabase project settings
- For production, use a strong random string for `NEXTAUTH_SECRET` and set `NEXTAUTH_URL` to your production domain
- `NVIDIA_API_KEY` (from [build.nvidia.com](https://build.nvidia.com/)) and `OPENROUTER_API_KEY` (from [openrouter.ai/keys](https://openrouter.ai/keys)) power the two selectable model providers in the builder. NVIDIA is the default; add the OpenRouter key to use OpenRouter models

### Development

Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000/builder](http://localhost:3000/builder) to access the website builder interface.

## Authentication Features

The application includes seamless, in-place Google OAuth authentication:

- **In-Place Sign In**: 1-click Google authentication directly from the Navbar, Projects page, or Builder workspace
- **Session Management**: Automatic session handling and token refresh via `@supabase/ssr` cookies
- **Cloud Synchronization**: Auto-saves unsaved drafts to Supabase when logging in
- **Auto-Restoration**: Restores local workspace drafts seamlessly upon returning from OAuth

### How Authentication Works

1. Users click "Sign In with Google" directly from the navigation bar or action gate
2. Client helper `signInWithGoogle()` initiates Google OAuth via Supabase with return path preservation
3. `/app/auth/callback/route.ts` exchanges auth code for user session and upserts user record in Prisma
4. Safe redirect returns the user directly to their previous view (`/builder`, `/projects`, etc.)

## How It Works

1. **Generate**: Describe your website idea in natural language
2. **Review**: The AI generates a project structure, manifest, and initial code
3. **Refine**: Chat with the AI to modify specific aspects of your website
4. **Edit**: Make direct code changes in the built-in editor
5. **Preview**: See live updates in the preview pane
6. **Export**: Download standalone ZIP or deploy 1-click to GitHub and Vercel

## Project Structure

- `/app/builder/page.tsx` - Main builder interface with Sandpack sandbox
- `/app/projects/page.tsx` - Workspace dashboard for saved projects and deployment links
- `/app/api/generate/route.ts` - API endpoint for code generation
- `/app/api/refine/route.ts` - API endpoint for code refinement
- `/app/auth/callback/route.ts` - Supabase OAuth callback handler
- `/app/auth/error/page.tsx` - Authentication error handler
- `/lib/auth-client.ts` - Client-side Google OAuth helper
- `/lib/auth.ts` - Server-side authentication and session verification
- `/components/Navbar.tsx` - Navigation bar with direct in-place Google sign-in
- `/components/` - Reusable UI components (PromptInput, PreviewPanel, etc.)
- `/lib/` - Utility functions (code extraction, prompts, etc.)
- `/services/` - AI service integration
- `/types/` - TypeScript interfaces and contracts

## Features Removed

*Note: The following features have been removed to simplify the authentication flow:*
- *Email/password registration form (signup page)*
- *Credentials-based authentication*
- *NextAuth.js authentication library*
- *Contract validation feature*

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js Authentication Guide](https://nextjs.org/docs/app/guides/authentication)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Sandpack Documentation](https://codesandbox.io/sandpack/react)
- [NextAuth.js Documentation](https://next-auth.js.org)

## Deploy on Vercel

The easiest way to deploy your AI Website Builder is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

## License

This project is licensed under the MIT License.