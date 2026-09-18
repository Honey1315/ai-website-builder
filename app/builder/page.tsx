"use client";

import { useState, useCallback, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { FileData, GenerateStreamEvent } from "@/types/ai";
import PromptInput from "./components/PromptInput";
import PreviewPanel from "./components/PreviewPanel";
import CodeEditor from "./components/CodeEditor";
import ChatPanel from "./components/ChatPanel";
import SandpackWrapper, { BASE_FILES } from "./components/SandpackWrapper";
// import SandpackFileExplorer from "./components/SandpackFileExplorer";
import SandpackSidebar from "./components/SandpackSidebar";
import DeployButton from "./components/DeployButton";
import DeployModal from "./components/DeployModal";
import ModelSelector from "./components/ModelSelector";
import type { ProjectManifest } from "@/types/contract";
import type { ModelProvider } from "@/types/ai";
import { createBrowserClient } from "@supabase/ssr";
import { Project } from "@/types/project";
import { DEFAULT_MODEL_PROVIDER, MODEL_CATALOG } from "@/utils/constants";
import Link from "next/link";

type RefineApiResponse = {
  code?: string;
  files?: FileData[];
  error?: string;
};

function mergeFile(files: FileData[], nextFile: FileData) {
  const index = files.findIndex((file) => file.name === nextFile.name);
  if (index === -1) return [...files, nextFile];
  const updatedFiles = [...files];
  updatedFiles[index] = nextFile;
  return updatedFiles;
}

function RefineWaitingStatus() {
  return (
    <div className="border border-primary-500/30 bg-primary-500/5 text-primary-400 p-4 font-mono text-xs uppercase tracking-widest flex items-center gap-4">
      <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent animate-spin rounded-none"></div>
      <span>[SYS] Refining code architecture...</span>
    </div>
  );
}

// ─── Inner component (needs Suspense from parent due to useSearchParams) ───────

function BuilderPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlProjectId = searchParams.get("projectId"); // single read, used as source of truth for initial load

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const [refining, setRefining] = useState(false);
  const [error, setError] = useState("");
  const [generationStatus, setGenerationStatus] = useState("");
  const [files, setFiles] = useState<FileData[]>([]);
  const [manifest, setManifest] = useState<ProjectManifest | null>(null);
  const [projectStructure, setProjectStructure] = useState<string[]>([]);
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  // Initialized from URL so the state is the single source of truth after mount
  const [projectId, setProjectId] = useState<string | null>(urlProjectId);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [provider, setProvider] = useState<ModelProvider>(DEFAULT_MODEL_PROVIDER);
  const [model, setModel] = useState<string>(MODEL_CATALOG[DEFAULT_MODEL_PROVIDER].defaultModel);

  const handleProviderChange = (nextProvider: ModelProvider) => {
    setProvider(nextProvider);
    setModel(MODEL_CATALOG[nextProvider].defaultModel);
  };

  // Stable Supabase client — not recreated on every render
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  // Load existing project when URL has ?projectId=
  useEffect(() => {
    if (!urlProjectId) return;

    let cancelled = false;
    setIsLoadingProject(true);
    setError("");

    fetch(`/api/project/save?id=${urlProjectId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load project");
        return res.json();
      })
      .then((project: Project) => {
        if (cancelled) return;
        setProjectId(project.id);
        setOriginalPrompt(project.description || "");
        setFiles(project.files || []);
        // console.log("Loaded project files:", project.files);
        const appFile = project.files?.find((f) => f.name.endsWith("App.jsx"));
        setCode(appFile?.content || project.files?.[0]?.content || "");
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load project");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingProject(false);
      });

    return () => {
      cancelled = true;
    };
  }, [urlProjectId]);

  const generateCode = async (prompt: string) => {
    setLoading(true);
    setError("");
    setGenerationStatus("Determining project structure...");
    setCode("");
    setFiles([]);
    setManifest(null);
    setProjectStructure([]);
    setOriginalPrompt(prompt);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({ prompt, provider, model }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Failed to generate code");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const handleEvent = (event: GenerateStreamEvent) => {
        if (event.type === "structure_paths") {
          setProjectStructure(event.paths);
          setGenerationStatus(`Structure ready: ${event.paths.length} files planned.`);
          return;
        }
        if (event.type === "manifest") {
          setManifest(event.manifest);
          console.log("Manifest:", event.manifest);
          setGenerationStatus(
            `Manifest ready: ${event.manifest.files.length} files, ${event.manifest.components.length} components.`
          );
          return;
        }
        if (event.type === "structure") {
          setFiles(event.files);
          setCode(
            event.files.find((file) => file.name.endsWith("App.jsx"))?.content ||
              event.files[0]?.content ||
              ""
          );
          setGenerationStatus("Generating project files...");
          return;
        }
        if (event.type === "file") {
          setFiles((currentFiles) => mergeFile(currentFiles, event.file));
          if (event.file.name.endsWith("App.jsx")) setCode(event.file.content);
          setGenerationStatus(`Generated ${event.index} of ${event.total}: ${event.file.name}`);
          return;
        }
        if (event.type === "fixing") {
          setGenerationStatus(`Auto-fixing ${event.files.length} file(s): ${event.files.join(", ")}`);
          return;
        }
        if (event.type === "done") {
          setFiles(event.files);
          console.log("Final files:", event.files);
          setCode(event.code);
          setManifest(event.manifest);
          // console.log("Manifest:", event.manifest);
          setGenerationStatus(`Generated ${event.files.length} files.`);
          return;
        }
        if (event.type === "error") {
          setError(event.error);
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";
        for (const eventText of events) {
          const dataLine = eventText.split("\n").find((line) => line.startsWith("data: "));
          if (!dataLine) continue;
          handleEvent(JSON.parse(dataLine.slice(6)) as GenerateStreamEvent);
        }
        if (done) break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  const refineCode = async (message: string) => {
    setError("");
    setRefining(true);

    try {
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          code,
          prompt: originalPrompt,
          structure: projectStructure.length > 0 ? projectStructure : files.map((f) => f.name),
          manifest: manifest || undefined,
          files,
          provider,
          model,
        }),
      });

      const data = (await res.json()) as RefineApiResponse;
      if (!res.ok || data.error) {
        setError(data.error || "Failed to refine code");
        return;
      }

      if (data.code) setCode(data.code);

      if (data.files && data.files.length > 0) {
        setFiles((currentFiles) => {
          const updated = [...currentFiles];
          data.files!.forEach((file) => {
            const index = updated.findIndex((f) => f.name === file.name);
            if (index >= 0) updated[index] = file;
            else updated.push(file);
          });
          return updated;
        });
      } else {
        setFiles((currentFiles) => {
          const updated = [...currentFiles];
          const appIndex = updated.findIndex((f) => f.name === "App.jsx");
          if (appIndex >= 0) {
            updated[appIndex] = { ...updated[appIndex], content: data.code! };
          } else {
            updated.push({ name: "App.jsx", content: data.code!, language: "javascript" });
          }
          return updated;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setRefining(false);
    }
  };

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setError("");

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("User not authenticated");

      // projectId state is the single source of truth — not searchParams
      const id = projectId ?? crypto.randomUUID();
      const isNewProject = !projectId;

      // Generate project name and description using AI via API endpoint
      const metadataResponse = await fetch(`/api/project/metadata`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: originalPrompt || "", provider, model }),
      });

      if (!metadataResponse.ok) {
        throw new Error("Failed to generate project metadata");
      }

      const { name: projectName, description: projectDescription } = await metadataResponse.json();

      // Ensure Sandpack base files are included (only index.js and public/index.html)
      const allFiles = [...files];
      const filesToAdd = ["/index.js", "/public/index.html"];
      
      filesToAdd.forEach((path) => {
        const fileData = BASE_FILES[path];
        if (fileData) {
          // Only add if not already in files
          const exists = allFiles.some(f => f.name === path || f.name === path.slice(1));
          if (!exists) {
            allFiles.push({
              name: path.slice(1), // remove leading slash, so it becomes index.js and public/index.html (not in src/)
              content: fileData.code,
              language: path.endsWith('.html') ? 'html' : 'javascript'
            });
          }
        }
      });
      
      const hasPackageJson = allFiles.some(f => f.name === 'package.json');
      if (!hasPackageJson) {
         allFiles.push({
            name: "package.json",
            content: JSON.stringify({
              name: projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
              version: "0.1.0",
              private: true,
              dependencies: {
                "react": "^18.2.0",
                "react-dom": "^18.2.0",
                "react-scripts": "5.0.1"
              },
              scripts: {
                "start": "react-scripts start",
                "build": "react-scripts build",
                "test": "react-scripts test",
                "eject": "react-scripts eject"
              }
            }, null, 2),
            language: "json"
         });
      }

      // Update state so the user sees it in their editor right after saving
      setFiles(allFiles);

      const projectData: Project = {
        id,
        name: projectName,
        description: projectDescription,
        code: "",
        files: allFiles,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: user.id,
        thumbnail: undefined,
        isPublic: false,
      };

      const response = await fetch("/api/project/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save project");
      }

      if (isNewProject) {
        setProjectId(id);
        // Update the URL so refreshing or subsequent saves use the same ID
        router.replace(`/builder?projectId=${id}`, { scroll: false });
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSaving(false);
    }
  }, [files, originalPrompt, projectId, supabase, router, provider, model]);

  return (
    <div className="min-h-screen flex flex-col bg-[#05080c] text-secondary-50 font-sans relative overflow-hidden">
      {/* HEADER */}
      <nav className="bg-secondary-900 border-b border-secondary-800 shrink-0 z-10 relative">
        <div className="max-w-480 mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center gap-4 group">
                <div className="w-8 h-8 bg-primary-500/10 border border-primary-500/30 flex items-center justify-center group-hover:border-primary-400 transition-colors">
                  <span className="text-primary-400 font-mono text-[10px]">AI</span>
                </div>
                <span className="text-sm font-display tracking-[0.2em] uppercase text-white hidden sm:block">
                  Workspace
                </span>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <ModelSelector
                provider={provider}
                model={model}
                onProviderChange={handleProviderChange}
                onModelChange={setModel}
              />
              {isSaving ? (
                <button disabled className="bg-secondary-800 text-secondary-500 font-mono uppercase tracking-widest text-[10px] px-6 py-2.5 border border-secondary-700 cursor-not-allowed">
                  [ Saving... ]
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  className="bg-primary-500 hover:bg-primary-400 text-secondary-900 font-bold font-mono uppercase tracking-widest text-[10px] px-6 py-2.5 border border-primary-500 transition-colors"
                >
                  Save Project _
                </button>
              )}
              {saveSuccess && <span className="text-primary-400 font-mono text-[10px] uppercase tracking-widest animate-pulse">Success</span>}
              <DeployButton onClick={() => setIsDeployModalOpen(true)} disabled={files.length === 0} />
            </div>
          </div>
        </div>
      </nav>

      <DeployModal 
        isOpen={isDeployModalOpen} 
        onClose={() => setIsDeployModalOpen(false)} 
        files={files} 
        projectName={originalPrompt || "ai-website"} 
      />

      {/* Loading overlay when fetching an existing project */}
      {isLoadingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05080c]/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-6 p-12 bg-secondary-900 border border-secondary-800 shadow-2xl relative">
            {/* Corner accent */}
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary-500 opacity-50"></div>
            
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="absolute inset-0 border border-secondary-800 rounded-none"></div>
              <div className="absolute inset-0 border border-primary-400 animate-[spin_2s_linear_infinite] [clip-path:polygon(50%_0%,100%_0%,100%_50%,50%_50%)]"></div>
              <div className="w-2 h-2 bg-primary-400 animate-pulse"></div>
            </div>
            <p className="text-[10px] font-mono text-secondary-500 uppercase tracking-[0.2em]">
              SYS_Loading_Project...
            </p>
          </div>
        </div>
      )}

      {/* Main Layout - Split Panel Design */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative z-0">
        
        {/* Left Sidebar (Generate & Chat) */}
        <div className="w-full lg:w-105 flex flex-col border-r border-secondary-800 bg-secondary-900/40 shrink-0 overflow-y-auto">
          {/* GENERATE */}
          <div className="p-6 border-b border-secondary-800">
            <h2 className="text-[10px] font-mono text-secondary-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-secondary-600 block"></span> 
              Input Parameters
            </h2>
            <PromptInput onSubmit={generateCode} />
          </div>

          {/* CHAT */}
          <div className="flex-1 p-6 flex flex-col min-h-75">
            <h3 className="text-[10px] font-mono text-secondary-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary-400 block"></span> 
              System Logs / Refine
            </h3>
            <ChatPanel onSend={refineCode} />
          </div>
        </div>

        {/* Right Workspace (Main Content) */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6 bg-[#0a0f16] relative">
          
          {error && (
            <div className="border border-danger-500/50 bg-danger-500/10 text-danger-500 p-4 font-mono text-xs tracking-widest uppercase flex gap-4 items-start shrink-0">
              <span className="font-bold mt-0.5">ERR:</span>
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {loading && (
            <div className="border border-secondary-700 bg-secondary-800/30 p-4 flex items-start gap-4 shrink-0">
              <div className="w-4 h-4 border border-primary-400 border-t-transparent animate-spin rounded-none mt-0.5"></div>
              <div className="font-mono text-xs tracking-widest uppercase text-secondary-300">
                <span className="text-primary-400 block mb-1">[SYS_EXECUTION]</span>
                {generationStatus || "Executing generation sequence..."}
              </div>
            </div>
          )}

          {refining && <RefineWaitingStatus />}

          {manifest && (
            <div className="border border-secondary-800 bg-secondary-900/50 p-6 font-mono text-xs text-secondary-400 shrink-0 relative">
              <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-secondary-600 opacity-50"></div>
              <div className="text-primary-400 uppercase tracking-widest mb-4 border-b border-secondary-800 pb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary-400 block"></span>
                Project Manifest
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div>
                  <span className="text-secondary-600 block mb-2 uppercase tracking-widest text-[10px]">Registered Components</span>
                  <div className="leading-relaxed">
                    {manifest && manifest.components.length > 0
                      ? manifest.components
                          .map((c) => `${c.name}(${c.props.join(", ")})`)
                          .join(" · ")
                      : "None"}
                  </div>
                </div>
                <div>
                  <span className="text-secondary-600 block mb-2 uppercase tracking-widest text-[10px]">Architecture Stack</span>
                  <div className="leading-relaxed">
                    [{manifest.architecture?.framework ?? 'react'}] / [{manifest.architecture?.language ?? 'javascript'}] / [{manifest.architecture?.styling ?? 'css'}]
                  </div>
                </div>
              </div>
            </div>
          )}

          {!loading && !refining && !isLoadingProject ? (
            <div className="w-full flex-1 flex flex-col min-h-0">
              <SandpackWrapper
                code={code}
                files={files}
                dependencies={manifest?.packages.dependencies || {}}
              >
                <div className="w-full flex flex-col gap-6">
                {/* Editor Section */}
                  <div className="w-full h-125 xl:h-150 flex gap-4 shrink-0">
                    <div className="flex-[2_2_0%] min-w-0 h-full">
                      <SandpackSidebar /> {/* <-- New Component */}
                    </div>
                    <div className="flex-[8_8_0%] min-w-0 h-full border border-secondary-800 bg-[#05080c]">
                      <CodeEditor onSave={setCode} />
                    </div>
                  </div>
                  {/* Preview Section */}
                  <div className="w-full h-150 xl:h-200 shrink-0 border border-secondary-800 bg-white relative">
                    {/* <div className="absolute -top-3 -left-3 bg-secondary-900 border border-secondary-800 text-[10px] font-mono text-primary-400 uppercase tracking-widest px-3 py-1 z-10">
                      Live_Preview
                    </div> */}
                    <PreviewPanel />
                  </div>
                </div>
              </SandpackWrapper>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── Outer component owns the Suspense boundary ────────────────────────────────

export default function BuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-[#05080c]">
           <div className="flex flex-col items-center gap-6 p-12 relative">
             <div className="relative w-12 h-12 flex items-center justify-center">
               <div className="absolute inset-0 border border-secondary-800 rounded-none"></div>
               <div className="absolute inset-0 border border-primary-400 animate-[spin_2s_linear_infinite] [clip-path:polygon(50%_0%,100%_0%,100%_50%,50%_50%)]"></div>
               <div className="w-2 h-2 bg-primary-400 animate-pulse"></div>
             </div>
             <p className="text-[10px] font-mono text-secondary-500 uppercase tracking-[0.2em]">
               SYS_INITIALIZING...
             </p>
           </div>
        </div>
      }
    >
      <BuilderPageInner />
    </Suspense>
  );
}