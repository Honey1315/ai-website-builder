# AI Website Builder

An AI-powered website builder built with Next.js that allows users to generate websites through natural language prompts.

## Features

- **AI-Powered Generation**: Generate complete website projects from natural language descriptions
- **Interactive Refinement**: Chat with the AI to modify and improve generated code
- **Live Preview**: See your changes in real-time with Sandpack integration
- **Code Editing**: Directly edit generated code in the browser-based code editor
- **File Management**: Explore and manage generated project files
- **Component-Based Architecture**: Generates modular, component-based web applications

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI Library**: Tailwind CSS
- **Code Editor**: Sandpack (live code playground)
- **State Management**: React Hooks (useState)
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

## How It Works

1. **Generate**: Describe your website idea in natural language
2. **Review**: The AI generates a project structure, manifest, and initial code
3. **Refine**: Chat with the AI to modify specific aspects of your website
4. **Edit**: Make direct code changes in the built-in editor
5. **Preview**: See live updates in the preview pane
6. **Export**: Download or deploy your generated website

## Project Structure

- `/app/builder/page.tsx` - Main builder interface
- `/app/api/generate/route.ts` - API endpoint for code generation
- `/app/api/refine/route.ts` - API endpoint for code refinement
- `/components/` - Reusable UI components (PromptInput, PreviewPanel, etc.)
- `/lib/` - Utility functions (code extraction, prompts, etc.)
- `/services/` - AI service integration
- `/types/` - TypeScript interfaces and contracts

## Features Removed

*Note: The contract validation feature has been removed to simplify the workflow and focus on core generation capabilities.*

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Sandpack Documentation](https://codesandbox.io/sandpack/react)

## Deploy on Vercel

The easiest way to deploy your AI Website Builder is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

## License

This project is licensed under the MIT License.