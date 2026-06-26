# Getting Started with AI Website Builder

## Project Structure Overview

This project is fully scaffolded with a clean, scalable architecture:

```
app/                    # Next.js App Router
├── api/               # Backend routes
├── builder/           # Main builder UI
├── projects/          # Saved projects
└── auth/              # Authentication (optional)

lib/                    # Core business logic
├── openrouter.ts      # AI API integration
├── prompts.ts         # Prompt templates
├── extractCode.ts     # Parse AI responses
├── fileParser.ts      # Multi-file support
├── sandbox.ts         # Preview handling
├── zipExporter.ts     # Export projects
└── modelFallback.ts   # Retry logic

services/              # Service layer
└── ai.service.ts      # Centralized AI calls

hooks/                 # React hooks
├── useGenerateCode.ts
├── useRefineCode.ts
└── useProjects.ts

store/                 # Global state
└── useAppStore.ts     # Zustand store

types/                 # TypeScript definitions
components/            # Reusable UI components
utils/                 # Utilities
```

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
# Copy the example
cp .env.local.example .env.local

# Edit .env.local and add your OpenRouter API key
# NEXT_PUBLIC_OPENROUTER_KEY=your_key_here
```

Get your API key from: https://openrouter.ai

### 3. Run Development Server
```bash
npm run dev
```

Visit http://localhost:3000

## Architecture

### Data Flow

1. **User Input** → PromptInput component
2. **Generate Request** → useGenerateCode hook → /api/generate
3. **AI Service** → AIService calls OpenRouter API
4. **Extract Code** → extractCode parses response
5. **Display** → PreviewPanel (Sandpack) renders code

### Key Components

- **PreviewPanel**: Displays live code using Sandpack
- **CodeEditor**: Editable code with syntax highlighting
- **ChatPanel**: Refinement chat with AI
- **FileTree**: Multi-file project structure

### State Management

Global state via Zustand (`useAppStore`):
- Current code
- Current project
- Saved projects
- UI loading/error states
- Code history

## Using the App

### Generate Code
1. Enter a description in the prompt input
2. Click "Generate"
3. AI generates React code
4. Code runs live in Sandpack preview

### Refine Code
1. Use ChatPanel to send refinement requests
2. AI modifies existing code
3. Preview updates in real-time

### Save Projects
1. Click "Save Project"
2. Give it a name
3. Project saved to /projects page

### Export
1. Click "Export"
2. Download as ZIP
3. Run locally with `npm install && npm start`

## API Endpoints

### Generate Code
```bash
POST /api/generate
{
  "prompt": "Create a todo app",
  "model": "openai/gpt-4-turbo" // optional
}
```

### Refine Code
```bash
POST /api/refine
{
  "code": "existing code",
  "message": "make it responsive",
  "model": "openai/gpt-4-turbo" // optional
}
```

### Export Project
```bash
POST /api/export
{
  "projectName": "my-app",
  "code": "React code",
  "files": [] // optional additional files
}
```

### Save/Get Projects
```bash
POST /api/project/save - Save project
GET /api/project/save?id=projectId - Get project
DELETE /api/project/save?id=projectId - Delete project
```

## Customization

### Change AI Model
Edit `lib/openrouter.ts`:
```typescript
export const DEFAULT_MODEL = "anthropic/claude-3-opus"; // Change this
```

### Modify Prompts
Edit `lib/prompts.ts` to change how AI behaves

### Add Dependencies
1. Update `lib/zipExporter.ts` for project exports
2. Update Sandpack dependencies in `lib/sandbox.ts`

## Next Steps

1. ✅ Sandpack integration - Done
2. ✅ Project structure - Done
3. 🔲 Add authentication (NextAuth.js)
4. 🔲 Add database (Supabase, Firebase, etc)
5. 🔲 Deploy to Vercel

## Troubleshooting

### "NEXT_PUBLIC_OPENROUTER_KEY is not set"
- Check .env.local file exists
- Verify key is set correctly
- Restart dev server

### Code not running in preview
- Check browser console for errors
- Ensure code is valid JSX/React
- Check Sandpack dependencies

### Exports failing
- Ensure jszip is installed: `npm install jszip`
- Check browser console for errors

## Resources

- [Next.js Documentation](https://nextjs.org)
- [OpenRouter API](https://openrouter.ai)
- [Sandpack Documentation](https://sandpack.codesandbox.io)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Tailwind CSS](https://tailwindcss.com)
