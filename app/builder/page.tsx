"use client";

import { useState, useCallback, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { FileData, GenerateStreamEvent } from "@/types/ai";
import PromptInput from "./components/PromptInput";
import PreviewPanel from "./components/PreviewPanel";
import CodeEditor from "./components/CodeEditor";
import ChatPanel from "./components/ChatPanel";
import SandpackWrapper, { BASE_FILES } from "./components/SandpackWrapper";
import SandpackFileExplorer from "./components/SandpackFileExplorer";
import DeployButton from "./components/DeployButton";
import DeployModal from "./components/DeployModal";
import type { ProjectManifest } from "@/types/contract";
import { createBrowserClient } from "@supabase/ssr";
import { Project } from "@/types/project";

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
    <div className="builder-status-info p-3 rounded-3xl shrink-0 flex items-center gap-3">
      <span className="h-4 w-4 rounded-full border-2 border-blue-200 border-t-blue-700 animate-spin" />
      <span>Refining code...</span>
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
        body: JSON.stringify({ prompt }),
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
        body: JSON.stringify({ prompt: originalPrompt || "" }),
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
  }, [files, originalPrompt, projectId, supabase, router]);

  return (
    <div className="builder-page min-h-screen flex flex-col gap-4">
      {/* HEADER */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Website Builder</span>
            </div>
            <div className="flex items-center gap-2">
              {isSaving ? (
                <button disabled className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg">
                  Saving...
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Project
                </button>
              )}
              {saveSuccess && <span className="text-green-600 text-sm">Saved!</span>}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <span className="h-8 w-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
            <span className="text-gray-600 text-sm">Loading project...</span>
          </div>
        </div>
      )}

      {/* GENERATE */}
      <div className="p-4 text-black">
        <h2 className="text-lg font-semibold mb-3">Generate</h2>
        <PromptInput onSubmit={generateCode} />
      </div>

      {/* CHAT */}
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-3 text-black">Refine / Chat</h3>
        <ChatPanel onSend={refineCode} />
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 p-6 overflow-auto flex flex-col gap-4">
        {error && <div className="builder-status-error p-3 rounded-3xl shrink-0">{error}</div>}
        {loading && (
          <div className="builder-status-info p-3 rounded-3xl shrink-0">
            {generationStatus || "Generating code..."}
          </div>
        )}
        {refining && <RefineWaitingStatus />}
        {manifest && (
          <div className="builder-status-info p-3 rounded-3xl shrink-0 text-sm">
            <div className="font-semibold mb-1">Project manifest</div>
            <div>
              Components:{" "}
              {manifest && manifest.components.length > 0
                ? manifest.components
                    .map((c) => `${c.name}(${c.props.join(", ")})`)
                    .join(" · ")
                : "None"}
            </div>
            <div>
              Stack: {manifest.architecture?.framework ?? 'react'} / {manifest.architecture?.language ?? 'javascript'} /{" "}
              {manifest.architecture?.styling ?? 'css'}
            </div>
          </div>
        )}

        {!loading && !refining && !isLoadingProject ? (
          <div className="w-full">
            <SandpackWrapper
              code={code}
              files={files}
              dependencies={manifest?.packages.dependencies || {}}
            >
              <div className="w-full flex flex-col gap-4 p-1">
                <div className="w-full h-[720px] flex gap-1 shrink-0">
                  <div className="flex-[2_2_0%] min-w-0 h-full">
                    <SandpackFileExplorer />
                  </div>
                  <div className="flex-[8_8_0%] min-w-0 h-full">
                    <CodeEditor onSave={setCode} />
                  </div>
                </div>
                <div className="w-full h-[720px] shrink-0">
                  <PreviewPanel />
                </div>
              </div>
            </SandpackWrapper>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ─── Outer component owns the Suspense boundary ────────────────────────────────

export default function BuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-gray-50">
          <span className="h-8 w-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
        </div>
      }
    >
      <BuilderPageInner />
    </Suspense>
  );
}