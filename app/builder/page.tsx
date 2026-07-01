"use client";

import { useState, useCallback } from "react";
import type { FileData, GenerateStreamEvent } from "@/types/ai";
import PromptInput from "./components/PromptInput";
import PreviewPanel from "./components/PreviewPanel";
import CodeEditor from "./components/CodeEditor";
import ChatPanel from "./components/ChatPanel";
import SandpackWrapper from "./components/SandpackWrapper";
import SandpackFileExplorer from "./components/SandpackFileExplorer";
import type { ProjectManifest } from "@/types/contract";
import { createBrowserClient } from '@supabase/ssr';
import { Project } from "@/types/project";
import { useSearchParams } from 'next/navigation';

type RefineApiResponse = {
  code?: string;
  files?: FileData[];
  error?: string;
};

function mergeFile(files: FileData[], nextFile: FileData) {
  const index = files.findIndex((file) => file.name === nextFile.name);

  if (index === -1) {
    return [...files, nextFile];
  }

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

export default function BuilderPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  const [error, setError] = useState("");
  const [generationStatus, setGenerationStatus] = useState("");
  const [files, setFiles] = useState<FileData[]>([]);
  const [manifest, setManifest] = useState<ProjectManifest | null>(null);
  const [projectStructure, setProjectStructure] = useState<string[]>([]);
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  // Initialize Supabase client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

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
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
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
          setGenerationStatus(
            `Structure ready: ${event.paths.length} files planned.`
          );
          return;
        }

        if (event.type === "manifest") {
          setManifest(event.manifest);
          console.log("Received manifest:", event.manifest);
          setGenerationStatus(
            `Manifest ready: ${event.manifest.files.length} files, ${event.manifest.components.length} components.`
          );
          return;
        }

        if (event.type === "structure") {
          setFiles(event.files);
          console.log("Received structure:", event.files);
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
          console.log("Received file:", event.file);
          if (event.file.name.endsWith("App.jsx")) {
            setCode(event.file.content);
          }

          setGenerationStatus(`Generated ${event.index} of ${event.total}: ${event.file.name}`);
          return;
        }


        if (event.type === "fixing") {
          setGenerationStatus(
            `Auto-fixing ${event.files.length} file(s): ${event.files.join(", ")}`
          );
          return;
        }

        if (event.type === "done") {
          setFiles(event.files);
          setCode(event.code);
          setManifest(event.manifest);
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
          const dataLine = eventText
            .split("\n")
            .find((line) => line.startsWith("data: "));

          if (!dataLine) continue;

          handleEvent(JSON.parse(dataLine.slice(6)) as GenerateStreamEvent);
        }

        if (done) break;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
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
          structure: projectStructure.length > 0 ? projectStructure : files.map((file) => file.name),
          manifest: manifest || undefined,
          files,
        }),
      });

      const data = (await res.json()) as RefineApiResponse;

      if (!res.ok || data.error) {
        setError(data.error || "Failed to refine code");
        return;
      }

      const refinedCode = data.code;
      const refinedFiles = data.files;

      if (refinedCode) {
        setCode(refinedCode);
      }

      if (refinedFiles && refinedFiles.length > 0) {
        setFiles((currentFiles) => {
          const updatedFiles = [...currentFiles];

          refinedFiles.forEach((file) => {
            const index = updatedFiles.findIndex((f) => f.name === file.name);
            if (index >= 0) {
              updatedFiles[index] = file;
            } else {
              updatedFiles.push(file);
            }
          });

          return updatedFiles;
        });
      } else if (refinedCode) {
        setFiles((currentFiles) => {
          const updatedFiles = [...currentFiles];
          const appIndex = updatedFiles.findIndex((f) => f.name === "App.jsx");

          if (appIndex >= 0) {
            updatedFiles[appIndex] = {
              ...updatedFiles[appIndex],
              content: refinedCode,
            };
          } else {
            updatedFiles.push({
              name: "App.jsx",
              content: refinedCode,
              language: "javascript",
            });
          }

          return updatedFiles;
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
    } finally {
      setRefining(false);
    }
  };

  // Save project function
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setError("");

    try {
      // Get the current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Generate a project ID if we don't have one
      const id = searchParams.get("projectId") ?? crypto.randomUUID();

      // Prepare the project data
      // We'll use the first line of the prompt as the project name, or a default
      const projectName = originalPrompt
        ?.split('\n')
        .find(line => line.trim() !== '')
        ?.substring(0, 50) || "Untitled Project";

      const projectData: Project = {
        id,
        name: projectName,
        description: originalPrompt || "",
        code: "", // We are not using the code field, we are using files
        files,
        createdAt: new Date(), // This will be ignored by the API because we are using upsert and the server sets it
        updatedAt: new Date(), // Same
        userId: user.id,
        thumbnail: undefined, // We don't have a thumbnail
        isPublic: false,
      };

      // console.log("Saving project data:", projectData);

      // Call the save API
      const response = await fetch("/api/project/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save project");
      }

      // If we don't have a projectId, set it to the one we just used
      if (!projectId) {
        setProjectId(id);
      }

      setSaveSuccess(true);

      // Optionally, hide the success message after a few seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [code, files, originalPrompt, projectId, projectStructure, supabase]);

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
                <span className="text-xl font-bold text-gray-900">
                  Website Builder
                </span>
            </div>
            <div>
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
              {saveSuccess && (
                <span className="ml-2 text-green-600">Saved!</span>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* GENERATE */}
      <div className="p-4 text-black">
        <h2 className="text-lg font-semibold mb-3">
          Generate
        </h2>
        <PromptInput onSubmit={generateCode} />
      </div>

      {/* CHAT */}
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-3 text-black">
          Refine / Chat
        </h3>
        <ChatPanel onSend={refineCode} />
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 p-6 overflow-auto flex flex-col gap-4">
        {error && (
          <div className="builder-status-error p-3 rounded-3xl shrink-0">
            {error}
          </div>
        )}

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
              {manifest.components.length > 0
                ? manifest.components
                    .map((component) => `${component.name}(${component.props.join(", ")})`)
                    .join(" · ")
                : "None"}
            </div>
            <div>
              Stack: {manifest.architecture.framework} / {manifest.architecture.language} /{" "}
              {manifest.architecture.styling}
            </div>
          </div>
        )}


        <div className="w-full">
          <SandpackWrapper code={code} files={files} dependencies={manifest?.packages.dependencies || {}}>
            <div className="w-full flex flex-col gap-4 p-1">
              {/* Row 1: File Explorer & Code Editor */}
              <div className="w-full h-[720px] flex gap-1 shrink-0">
                <div className="flex-[2_2_0%] min-w-0 h-full">
                  <SandpackFileExplorer />
                </div>
                <div className="flex-[8_8_0%] min-w-0 h-full">
                  <CodeEditor onSave={setCode} />
                </div>
              </div>
              {/* Row 2: Live Preview */}
              <div className="w-full h-[720px] shrink-0">
                <PreviewPanel />
              </div>
            </div>
          </SandpackWrapper>
        </div>
      </div>
    </div>
  );
}