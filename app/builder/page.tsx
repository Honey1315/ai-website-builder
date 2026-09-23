"use client";

import { useState, useCallback, useEffect, useMemo, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { ChatMessage, FileData, GenerateStreamEvent, RefineStreamEvent } from "@/types/ai";
import PromptInput from "./components/PromptInput";
import PreviewPanel from "./components/PreviewPanel";
import CodeEditor from "./components/CodeEditor";
import ChatPanel from "./components/ChatPanel";
import SandpackWrapper from "./components/SandpackWrapper";
import SandpackFileExplorer from "./components/SandpackFileExplorer";
import DeployModal from "./components/DeployModal";
import ModelSelector from "./components/ModelSelector";
import type { ProjectManifest } from "@/types/contract";
import type { ModelProvider } from "@/types/ai";
import { createBrowserClient } from "@supabase/ssr";
import { Project } from "@/types/project";
import { DEFAULT_MODEL_PROVIDER, MODEL_CATALOG } from "@/utils/constants";
import Link from "next/link";
import { signInWithGoogle } from "@/lib/auth-client";
import { downloadProjectZip } from "@/lib/zipExporter";
import { isPlaceholderFile } from "@/lib/contractHelpers";

type RefineApiResponse = {
  code?: string;
  files?: FileData[];
  manifest?: ProjectManifest;
  summary?: string;
  error?: string;
};

function mergeFile(files: FileData[], nextFile: FileData) {
  const index = files.findIndex((file) => file.name === nextFile.name);
  if (index === -1) return [...files, nextFile];
  const updatedFiles = [...files];
  updatedFiles[index] = nextFile;
  return updatedFiles;
}

function RefineWaitingStatus({ status, onStop }: { status?: string; onStop?: () => void }) {
  return (
    <div className="border border-primary-500/30 bg-primary-500/5 text-primary-400 p-4 font-mono text-xs uppercase tracking-widest flex items-center justify-between gap-4 shrink-0">
      <div className="flex items-center gap-4">
        <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent animate-spin rounded-none"></div>
        <span>{status || "[SYS] Refining code architecture..."}</span>
      </div>
      {onStop && (
        <button
          onClick={onStop}
          className="border border-danger-500/60 bg-danger-500/10 text-danger-400 hover:bg-danger-500/20 px-3 py-1 font-mono text-[10px] tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <span className="w-1.5 h-1.5 bg-danger-500 rounded-none inline-block"></span>
          STOP
        </button>
      )}
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
  const [refineStatus, setRefineStatus] = useState("");
  const [error, setError] = useState("");
  const [sandpackError, setSandpackError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [generationStatus, setGenerationStatus] = useState("");
  const [files, setFiles] = useState<FileData[]>([]);
  const [manifest, setManifest] = useState<ProjectManifest | null>(null);
  const [projectStructure, setProjectStructure] = useState<string[]>([]);
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [projectName, setProjectName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(urlProjectId);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [provider, setProvider] = useState<ModelProvider>(DEFAULT_MODEL_PROVIDER);
  const [model, setModel] = useState<string>(MODEL_CATALOG[DEFAULT_MODEL_PROVIDER].defaultModel);

  const [isPartialGeneration, setIsPartialGeneration] = useState(false);
  const [remainingFiles, setRemainingFiles] = useState<string[]>([]);

  const [user, setUser] = useState<User | null>(null);
  const [draftNotification, setDraftNotification] = useState<string>("");
  type MobileView = "chat" | "preview" | "code";
  const [mobileView, setMobileView] = useState<MobileView>("chat");

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const saveDraftToStorage = useCallback(
    (
      draftFiles: FileData[],
      draftCode: string,
      promptText: string,
      draftManifest?: ProjectManifest | null,
      messages?: ChatMessage[]
    ) => {
      if (typeof window === "undefined" || draftFiles.length === 0) return;
      try {
        localStorage.setItem(
          "ai_builder_draft",
          JSON.stringify({
            files: draftFiles,
            originalPrompt: promptText,
            code: draftCode,
            manifest: draftManifest,
            messages: messages || chatMessages,
            provider,
            model,
            timestamp: Date.now(),
          })
        );
      } catch (e) {
        console.error("Failed to auto-save draft:", e);
      }
    },
    [chatMessages, provider, model]
  );

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
    setRefining(false);
    setGenerationStatus("");
    setRefineStatus("");
    if (files.length > 0) {
      setIsPartialGeneration(true);
    }
  }, [files.length]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Click outside and escape key handling for builder menu
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen]);

  const handleFileSave = useCallback((filePath: string, updatedCode: string) => {
    const normalized = filePath.replace(/^\//, "");

    setFiles((prevFiles) => {
      const index = prevFiles.findIndex(
        (f) => f.name.replace(/^\//, "") === normalized
      );
      if (index === -1) {
        return [...prevFiles, { name: normalized, content: updatedCode }];
      }
      const updated = [...prevFiles];
      updated[index] = { ...updated[index], content: updatedCode };
      return updated;
    });

    if (normalized === "src/App.jsx" || normalized.endsWith("App.jsx")) {
      setCode(updatedCode);
    }
  }, []);

  const handleExportZip = async () => {
    if (files.length === 0 || isExporting) return;
    setIsExporting(true);
    try {
      const sanitizedName =
        projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-") ||
        (originalPrompt ? originalPrompt.trim().split(/\s+/).slice(0, 3).join("-") : "ai-website");
      await downloadProjectZip(sanitizedName, files, code);
    } catch (err) {
      console.error("Failed to export ZIP:", err);
    } finally {
      setIsExporting(false);
    }
  };

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

  // Monitor auth status
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Restore unsaved draft on load if present
  useEffect(() => {
    if (typeof window === "undefined") return;
    const restoreDraft = searchParams.get("restoreDraft");
    const savedDraft = localStorage.getItem("ai_builder_draft");

    if (savedDraft && (restoreDraft === "true" || !urlProjectId)) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.files && parsed.files.length > 0) {
          setFiles(parsed.files);
          setCode(parsed.code || "");
          setOriginalPrompt(parsed.originalPrompt || "");
          if (parsed.manifest) setManifest(parsed.manifest);
          if (parsed.messages && parsed.messages.length > 0) {
            setChatMessages(parsed.messages);
          }
          if (parsed.provider) setProvider(parsed.provider);
          if (parsed.model) setModel(parsed.model);

          const placeholders = parsed.files.filter(isPlaceholderFile);
          if (placeholders.length > 0) {
            setIsPartialGeneration(true);
            setRemainingFiles(placeholders.map((p: FileData) => p.name));
            setDraftNotification("Unsaved partial project restored! You can resume generation or refine components.");
          } else {
            setDraftNotification("Your unsaved draft has been restored! Click 'Save Project' to save it to your account.");
          }
          setTimeout(() => setDraftNotification(""), 7000);
        }
      } catch (e) {
        console.error("Failed to restore draft:", e);
      }
    }
  }, [searchParams, urlProjectId]);

  // Load existing project when URL has ?projectId=
  useEffect(() => {
    if (!urlProjectId) return;

    let cancelled = false;
    setIsLoadingProject(true);
    setError("");

    fetch(`/api/project/save?id=${urlProjectId}`)
      .then((res) => {
        if (res.status === 401) {
          throw new Error("AUTH_REQUIRED");
        }
        if (!res.ok) throw new Error("Failed to load project");
        return res.json();
      })
      .then((project: Project) => {
        if (cancelled) return;
        setProjectId(project.id);
        setProjectName(project.name || "");
        setOriginalPrompt(project.prompt || project.description || "");
        setFiles(project.files || []);
        const appFile = project.files?.find((f) => f.name.endsWith("App.jsx"));
        setCode(appFile?.content || project.files?.[0]?.content || "");
        if (project.messages && project.messages.length > 0) {
          setChatMessages(project.messages);
        } else {
          setChatMessages([
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content: `Project "${project.name || "Untitled"}" loaded. You can submit refinement directives below to modify components.`,
              timestamp: Date.now(),
            },
          ]);
        }

        // Restore dependencies from saved package.json so Sandpack and sidebar preserve them
        const pkgFile = project.files?.find((f) => f.name === "package.json" || f.name === "/package.json");
        if (pkgFile) {
          try {
            const parsed = JSON.parse(pkgFile.content);
            if (parsed.dependencies) {
              setManifest((prev) => ({
                ...(prev || {
                  files: [],
                  components: [],
                  dependencies: {},
                  architecture: { framework: "react", language: "javascript", styling: "tailwind" },
                }),
                packages: { dependencies: parsed.dependencies },
              }));
            }
          } catch (e) {
            console.error("Failed to parse package.json from loaded project", e);
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          if (err instanceof Error && err.message === "AUTH_REQUIRED") {
            setError("Authentication required to access this project. Initiating sign-in...");
            setTimeout(() => {
              signInWithGoogle('/builder?projectId=' + urlProjectId);
            }, 1000);
          } else {
            setError(err instanceof Error ? err.message : "Failed to load project");
          }
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingProject(false);
      });

    return () => {
      cancelled = true;
    };
  }, [urlProjectId, router]);

  const generateCode = async (prompt: string, isResume = false) => {
    // Abort any existing running request
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError("");
    setSandpackError(null);

    if (isResume) {
      setGenerationStatus(`Resuming generation with ${provider} (${model})...`);
    } else {
      setGenerationStatus("Determining project structure...");
      setCode("");
      setFiles([]);
      setManifest(null);
      setProjectStructure([]);
      setOriginalPrompt(prompt);
      setIsPartialGeneration(false);
      setRemainingFiles([]);
    }

    try {
      const payload = isResume
        ? {
            prompt: originalPrompt || prompt,
            provider,
            model,
            resume: true,
            existingFiles: files,
            manifest,
            structure: projectStructure,
          }
        : { prompt, provider, model };

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Failed to generate code");
        if (files.length > 0) {
          setIsPartialGeneration(true);
          saveDraftToStorage(files, code, originalPrompt || prompt, manifest);
        }
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
          setGenerationStatus(
            `Manifest ready: ${event.manifest.files.length} files, ${event.manifest.components.length} components.`
          );
          return;
        }
        if (event.type === "structure") {
          setFiles(event.files);
          setCode(
            event.files.find((file) => file.name.endsWith("App.jsx") && !isPlaceholderFile(file))?.content ||
            event.files.find((file) => !isPlaceholderFile(file))?.content ||
            event.files.find((file) => file.name.endsWith("App.jsx"))?.content ||
            event.files[0]?.content ||
            ""
          );
          setGenerationStatus("Generating project files...");
          return;
        }
        if (event.type === "file") {
          setFiles((currentFiles) => {
            const next = mergeFile(currentFiles, event.file);
            saveDraftToStorage(
              next,
              event.file.name.endsWith("App.jsx") ? event.file.content : code,
              originalPrompt || prompt,
              manifest
            );
            return next;
          });
          if (event.file.name.endsWith("App.jsx")) setCode(event.file.content);
          setGenerationStatus(`Generated ${event.index} of ${event.total}: ${event.file.name}`);
          setRemainingFiles((prev) => prev.filter((name) => name !== event.file.name));
          return;
        }
        if (event.type === "fixing") {
          setGenerationStatus(`Auto-fixing ${event.files.length} file(s): ${event.files.join(", ")}`);
          return;
        }
        if (event.type === "partial_done") {
          setFiles(event.files);
          if (event.code) setCode(event.code);
          if (event.manifest) setManifest(event.manifest);
          setIsPartialGeneration(true);
          setRemainingFiles(event.remainingFiles);
          setError(event.error);
          setGenerationStatus(
            `Generation paused: ${event.completedFiles.length} file(s) preserved. ${event.remainingFiles.length} remaining.`
          );
          const assistantMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `⚠️ Generation was paused: ${event.error}\n\nPreserved ${event.completedFiles.length} generated file(s). You can switch models in the header and click "Resume Generation", or refine existing files.`,
            timestamp: Date.now(),
          };
          setChatMessages([assistantMsg]);
          saveDraftToStorage(event.files, event.code, originalPrompt || prompt, event.manifest, [assistantMsg]);
          return;
        }
        if (event.type === "done") {
          setFiles(event.files);
          setCode(event.code);
          setManifest(event.manifest);
          setIsPartialGeneration(false);
          setRemainingFiles([]);
          setGenerationStatus(`Generated ${event.files.length} files.`);
          const assistantMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `Project generated with ${event.files.length} files. Enter refinement instructions below to customize components or add features.`,
            timestamp: Date.now(),
          };
          setChatMessages([assistantMsg]);
          saveDraftToStorage(event.files, event.code, originalPrompt || prompt, event.manifest, [assistantMsg]);
          return;
        }
        if (event.type === "error") {
          setError(event.error);
          if (files.length > 0) {
            setIsPartialGeneration(true);
            saveDraftToStorage(files, code, originalPrompt || prompt, manifest);
          }
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
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") {
        setGenerationStatus("Generation stopped by user.");
        if (files.length > 0) {
          setIsPartialGeneration(true);
          saveDraftToStorage(files, code, originalPrompt || prompt, manifest);
        }
        return;
      }
      setError(err instanceof Error ? err.message : "Unknown error");
      if (files.length > 0) {
        setIsPartialGeneration(true);
        saveDraftToStorage(files, code, originalPrompt || prompt, manifest);
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setLoading(false);
    }
  };

  const refineCode = async (message: string) => {
    // Abort any existing running request
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setError("");
    setSandpackError(null);
    setRefining(true);
    setRefineStatus("Analyzing refinement request...");

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
      timestamp: Date.now(),
    };
    const outgoingMessages = [...chatMessages, userMessage];
    setChatMessages(outgoingMessages);

    try {
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          message,
          messages: outgoingMessages,
          projectId: projectId || undefined,
          code,
          prompt: originalPrompt,
          structure: projectStructure.length > 0 ? projectStructure : files.map((f) => f.name),
          manifest: manifest || undefined,
          files,
          provider,
          model,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to refine code");
      }

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("text/event-stream")) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          buffer += decoder.decode(value, { stream: !done });
          const events = buffer.split("\n\n");
          buffer = events.pop() || "";

          for (const eventText of events) {
            const dataLine = eventText.split("\n").find((line) => line.startsWith("data: "));
            if (!dataLine) continue;
            const event = JSON.parse(dataLine.slice(6)) as RefineStreamEvent;

            if (event.type === "status") {
              setRefineStatus(event.message);
            } else if (event.type === "targets") {
              setRefineStatus(`Targeting ${event.files.map((f) => f.replace(/^src\//, "")).join(", ")}...`);
            } else if (event.type === "file") {
              setFiles((currentFiles) => {
                const updated = [...currentFiles];
                const index = updated.findIndex((f) => f.name === event.file.name);
                if (index >= 0) updated[index] = event.file;
                else updated.push(event.file);
                return updated;
              });
              if (event.file.name.endsWith("App.jsx")) {
                setCode(event.file.content);
              }
              setRefineStatus(`Updated ${event.file.name.replace(/^src\//, "")} (${event.index} of ${event.total})`);
            } else if (event.type === "fixing") {
              setRefineStatus(`Auto-fixing ${event.files.length} file(s)...`);
            } else if (event.type === "done") {
              if (event.code) setCode(event.code);
              if (event.files && event.files.length > 0) setFiles(event.files);
              if (event.manifest) setManifest(event.manifest);
              setChatMessages((prev) => [
                ...prev,
                {
                  id: crypto.randomUUID(),
                  role: "assistant",
                  content: event.summary || "Applied modifications successfully.",
                  timestamp: Date.now(),
                },
              ]);
            } else if (event.type === "error") {
              throw new Error(event.error);
            }
          }
          if (done) break;
        }
      } else {
        // Fallback for standard JSON responses
        const data = (await res.json()) as RefineApiResponse;
        if (data.error) throw new Error(data.error);

        if (data.code) setCode(data.code);
        if (data.manifest) setManifest(data.manifest);

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
        }

        setChatMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: data.summary || "Applied modifications successfully.",
            timestamp: Date.now(),
          },
        ]);
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") {
        setChatMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "[STOPPED] Refinement cancelled by user.",
            timestamp: Date.now(),
          },
        ]);
        return;
      }
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      setChatMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `[ERR] ${errorMsg}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setRefining(false);
      setRefineStatus("");
    }
  };

  const handleSave = useCallback(async () => {
    if (files.length === 0) return null;
    setIsSaving(true);
    setSaveSuccess(false);
    setError("");

    try {
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      if (userError || !currentUser) {
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "ai_builder_draft",
            JSON.stringify({
              files,
              originalPrompt,
              code,
              messages: chatMessages,
              provider,
              model,
              timestamp: Date.now(),
            })
          );
        }
        setDraftNotification("Draft saved locally! Connecting with Google to save project...");
        setTimeout(() => {
          signInWithGoogle("/builder?restoreDraft=true");
        }, 1000);
        return null;
      }

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

      const { name: generatedName, description: projectDescription } = await metadataResponse.json();
      const finalProjectName = projectName || generatedName || "AI Website";
      setProjectName(finalProjectName);

      const allFiles = [...files];

      const hasPackageJson = allFiles.some(f => f.name === 'package.json' || f.name === '/package.json');
      if (!hasPackageJson) {
        allFiles.push({
          name: "package.json",
          content: JSON.stringify({
            name: finalProjectName.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
            version: "0.1.0",
            private: true,
            type: "module",
            scripts: {
              dev: "vite",
              build: "vite build",
              preview: "vite preview"
            },
            dependencies: {
              "react": "^18.3.1",
              "react-dom": "^18.3.1",
              ...(manifest?.packages?.dependencies || {})
            },
            devDependencies: {
              "@vitejs/plugin-react": "^4.3.4",
              "vite": "^5.4.14"
            }
          }, null, 2),
          language: "json"
        });
      }

      // Update state so the user sees it in their editor right after saving
      setFiles(allFiles);

      const projectData: Project = {
        id,
        name: finalProjectName,
        description: projectDescription,
        prompt: originalPrompt || undefined,
        code: "",
        files: allFiles,
        messages: chatMessages,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: currentUser.id,
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
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [files, originalPrompt, projectId, supabase, router, provider, model]);

  return (
    <div className="min-h-screen flex flex-col bg-[#05080c] text-secondary-50 font-sans relative">
      {/* HEADER */}
      <nav className="bg-secondary-900 border-b border-secondary-800 shrink-0 z-40 relative">
        <div className="max-w-480 mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
          <div className="flex items-center justify-between gap-2">
            <Link href="/" className="shrink-0">
              <div className="flex items-center gap-2 sm:gap-3 group">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary-500/10 border border-primary-500/30 flex items-center justify-center group-hover:border-primary-400 transition-colors">
                  <span className="text-primary-400 font-mono text-[10px]">AI</span>
                </div>
                <span className="text-xs sm:text-sm font-display tracking-[0.2em] uppercase text-white hidden sm:block">
                  Workspace
                </span>
              </div>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* ModelSelector stays visible on header bar as requested */}
              <ModelSelector
                provider={provider}
                model={model}
                onProviderChange={handleProviderChange}
                onModelChange={setModel}
              />

              {/* Status indicator if saving or saved */}
              {isSaving && (
                <span className="text-secondary-400 font-mono text-[9px] sm:text-[10px] uppercase tracking-wider animate-pulse hidden sm:inline">
                  [ Saving... ]
                </span>
              )}
              {saveSuccess && (
                <span className="text-primary-400 font-mono text-[9px] sm:text-[10px] uppercase tracking-wider animate-pulse hidden sm:inline">
                  [ Saved ]
                </span>
              )}

              {/* Three horizontal parallel lines menu button */}
              <div className="relative">
                <button
                  ref={buttonRef}
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className={`p-2 border transition-all flex items-center justify-center cursor-pointer ${isMenuOpen
                    ? "border-primary-500 bg-primary-500/10 text-primary-400 shadow-[0_0_12px_rgba(20,184,166,0.25)]"
                    : "border-secondary-800 bg-secondary-900/80 hover:border-primary-500/60 text-secondary-300 hover:text-primary-400"
                    }`}
                  aria-label="Navigation & Actions Menu"
                  aria-expanded={isMenuOpen}
                  title="Menu"
                >
                  <svg
                    className="w-5 h-5 transition-transform duration-200"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    {isMenuOpen ? (
                      <>
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </>
                    ) : (
                      <>
                        <line x1="4" y1="6" x2="20" y2="6" />
                        <line x1="4" y1="12" x2="20" y2="12" />
                        <line x1="4" y1="18" x2="20" y2="18" />
                      </>
                    )}
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div
                    ref={menuRef}
                    className="absolute right-0 mt-2 w-60 sm:w-64 bg-secondary-900 border border-secondary-800 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  >
                    {/* Decorative corner accent */}
                    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary-500"></div>

                    {/* User Header if authenticated */}
                    {user && (
                      <div className="px-4 py-3 border-b border-secondary-800 bg-[#070b10]">
                        <div className="text-[9px] font-mono text-primary-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                          <span className="w-1.5 h-1.5 bg-primary-400 block"></span>
                          SYS_USER
                        </div>
                        <div className="text-xs font-mono text-white truncate font-medium">
                          {user.user_metadata?.full_name || user.email}
                        </div>
                      </div>
                    )}

                    {/* Navigation Section: Projects, Profile, Home */}
                    <div className="py-2 border-b border-secondary-800">
                      <div className="px-4 pb-1 text-[9px] font-mono uppercase tracking-widest text-secondary-500">
                        Navigation
                      </div>
                      <Link
                        href="/projects"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center justify-between px-4 py-2 text-xs font-mono uppercase tracking-wider text-secondary-300 hover:text-white hover:bg-secondary-800/60 transition-colors group"
                      >
                        <span className="flex items-center gap-2.5">
                          <span className="w-1.5 h-1.5 bg-secondary-600 group-hover:bg-primary-400 transition-colors"></span>
                          Projects
                        </span>
                        <span className="text-[10px] text-secondary-600 group-hover:text-primary-400">↗</span>
                      </Link>
                      <Link
                        href="/"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center justify-between px-4 py-2 text-xs font-mono uppercase tracking-wider text-secondary-300 hover:text-white hover:bg-secondary-800/60 transition-colors group"
                      >
                        <span className="flex items-center gap-2.5">
                          <span className="w-1.5 h-1.5 bg-secondary-600 group-hover:bg-primary-400 transition-colors"></span>
                          Home
                        </span>
                        <span className="text-[10px] text-secondary-600 group-hover:text-primary-400 font-mono">/</span>
                      </Link>
                    </div>

                    {/* Project Actions Section */}
                    <div className="py-2">
                      <div className="px-4 pb-1 text-[9px] font-mono uppercase tracking-widest text-secondary-500">
                        Project Actions
                      </div>

                      {/* Save Project */}
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          handleSave();
                        }}
                        disabled={files.length === 0 || isSaving}
                        className="w-full flex items-center justify-between px-4 py-2 text-xs font-mono uppercase tracking-wider text-secondary-300 hover:text-white hover:bg-secondary-800/60 disabled:opacity-40 disabled:hover:bg-transparent transition-colors group cursor-pointer text-left"
                      >
                        <span className="flex items-center gap-2.5">
                          <span className="w-1.5 h-1.5 bg-primary-400"></span>
                          {isSaving ? "Saving Project..." : "Save Project"}
                        </span>
                        <span className="text-[10px] text-primary-400 font-bold">{saveSuccess ? "✓" : "_"}</span>
                      </button>

                      {/* Export ZIP */}
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          handleExportZip();
                        }}
                        disabled={files.length === 0 || isExporting}
                        className="w-full flex items-center justify-between px-4 py-2 text-xs font-mono uppercase tracking-wider text-secondary-300 hover:text-white hover:bg-secondary-800/60 disabled:opacity-40 disabled:hover:bg-transparent transition-colors group cursor-pointer text-left"
                      >
                        <span className="flex items-center gap-2.5">
                          <span className="w-1.5 h-1.5 bg-secondary-600 group-hover:bg-primary-400 transition-colors"></span>
                          {isExporting ? "Exporting..." : "Export ZIP"}
                        </span>
                        <span className="text-[10px] text-secondary-600 group-hover:text-primary-400 font-mono">.zip</span>
                      </button>

                      {/* Deploy to Vercel */}
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsDeployModalOpen(true);
                        }}
                        disabled={files.length === 0}
                        className="w-full flex items-center justify-between px-4 py-2 text-xs font-mono uppercase tracking-wider text-secondary-300 hover:text-white hover:bg-secondary-800/60 disabled:opacity-40 disabled:hover:bg-transparent transition-colors group cursor-pointer text-left"
                      >
                        <span className="flex items-center gap-2.5">
                          <span className="w-1.5 h-1.5 bg-secondary-600 group-hover:bg-primary-400 transition-colors"></span>
                          Deploy to Vercel
                        </span>
                        <span className="text-[10px] text-secondary-600 group-hover:text-primary-400">▲</span>
                      </button>
                    </div>

                    {/* Auth Section */}
                    {user ? (
                      <div className="border-t border-secondary-800 p-2">
                        <button
                          onClick={async () => {
                            setIsMenuOpen(false);
                            await supabase.auth.signOut();
                            setUser(null);
                            router.refresh();
                          }}
                          className="w-full text-left px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-secondary-500 hover:text-danger-500 hover:bg-danger-500/10 transition-colors cursor-pointer"
                        >
                          [ Terminate Session ]
                        </button>
                      </div>
                    ) : (
                      <div className="border-t border-secondary-800 p-3">
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            signInWithGoogle('/builder');
                          }}
                          className="w-full py-2 px-3 text-xs font-mono uppercase tracking-wider bg-primary-500 text-secondary-900 font-bold hover:bg-primary-400 transition-colors text-center cursor-pointer"
                        >
                          Sign In with Google
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile View Switcher Tab Bar (< lg only) */}
      <div className="flex lg:hidden items-center justify-between border-b border-secondary-800 bg-secondary-900/90 backdrop-blur shrink-0 px-2 sm:px-4 py-1.5 z-10 gap-1.5">
        <button
          onClick={() => setMobileView("chat")}
          className={`flex-1 py-1.5 px-2 font-mono text-[9px] sm:text-[10px] uppercase tracking-wider transition-colors border cursor-pointer text-center truncate ${mobileView === "chat"
            ? "bg-primary-500 text-secondary-900 font-bold border-primary-500"
            : "bg-transparent text-secondary-400 border-secondary-800 hover:text-white"
            }`}
        >
          Input & Chat
        </button>
        <button
          onClick={() => setMobileView("preview")}
          className={`flex-1 py-1.5 px-2 font-mono text-[9px] sm:text-[10px] uppercase tracking-wider transition-colors border cursor-pointer text-center truncate ${mobileView === "preview"
            ? "bg-primary-500 text-secondary-900 font-bold border-primary-500"
            : "bg-transparent text-secondary-400 border-secondary-800 hover:text-white"
            }`}
        >
          Live Preview
        </button>
        <button
          onClick={() => setMobileView("code")}
          className={`flex-1 py-1.5 px-2 font-mono text-[9px] sm:text-[10px] uppercase tracking-wider transition-colors border cursor-pointer text-center truncate ${mobileView === "code"
            ? "bg-primary-500 text-secondary-900 font-bold border-primary-500"
            : "bg-transparent text-secondary-400 border-secondary-800 hover:text-white"
            }`}
        >
          Code & Files
        </button>
      </div>

      {/* Real-time Draft & Auth Notification Banner */}
      {draftNotification && (
        <div className="bg-primary-500/10 border-b border-primary-500/30 text-primary-400 px-4 py-2 text-xs font-mono flex items-center justify-between z-20">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-primary-400 animate-pulse"></span>
            <span>{draftNotification}</span>
          </div>
          <button onClick={() => setDraftNotification("")} className="text-secondary-400 hover:text-white text-xs ml-4 cursor-pointer">✕</button>
        </div>
      )}

      <DeployModal
        isOpen={isDeployModalOpen}
        onClose={() => setIsDeployModalOpen(false)}
        files={files}
        projectName={projectName || (originalPrompt ? originalPrompt.trim().split(/\s+/).slice(0, 3).join("-") : "ai-website")}
        projectId={projectId}
        onSaveProject={handleSave}
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
      <div className="flex-1 flex flex-col lg:flex-row relative z-0">

        {/* Left Sidebar (Generate & Chat) */}
        <div className={`w-full lg:w-105 flex flex-col border-r border-secondary-800 bg-secondary-900/40 shrink-0 lg:sticky lg:top-0 lg:h-screen lg:self-start lg:overflow-y-auto ${mobileView === "chat" ? "flex flex-1 lg:flex-initial" : "hidden lg:flex"
          }`}>
          {/* GENERATE */}
          <div className="p-4 sm:p-6 border-b border-secondary-800 shrink-0">
            <h2 className="text-[10px] font-mono text-secondary-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-secondary-600 block"></span>
              Input Parameters
            </h2>
            <PromptInput
              onSubmit={generateCode}
              isPartial={isPartialGeneration}
              remainingCount={remainingFiles.length}
              onResume={() => generateCode(originalPrompt, true)}
              onReset={() => {
                setIsPartialGeneration(false);
                setRemainingFiles([]);
                setFiles([]);
                setCode("");
                setManifest(null);
                setOriginalPrompt("");
                localStorage.removeItem("ai_builder_draft");
              }}
              disabled={loading}
              initialPrompt={originalPrompt}
            />
          </div>

          {/* CHAT */}
          <div className="p-4 sm:p-6 flex flex-col shrink-0">
            <h3 className="text-[10px] font-mono text-secondary-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary-400 block"></span>
              System Logs / Refine
            </h3>
            <ChatPanel
              onSend={refineCode}
              onStop={handleCancel}
              error={sandpackError}
              isAuthenticated={!!user}
              messages={chatMessages}
              isLoading={refining}
              isGenerating={loading}
              hasFiles={files.length > 0}
              statusMessage={refineStatus}
            />
          </div>
        </div>

        {/* Right Workspace (Main Content) */}
        <div className={`flex-1 p-3 sm:p-6 overflow-y-auto flex flex-col gap-4 sm:gap-6 bg-[#0a0f16] relative ${mobileView !== "chat" ? "flex" : "hidden lg:flex"
          }`}>

          {isPartialGeneration && !loading && files.length > 0 && (
            <div className="border border-amber-500/40 bg-amber-500/10 p-4 font-mono text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 bg-amber-400 block shrink-0 animate-pulse"></span>
                <div>
                  <div className="text-amber-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-2">
                    <span>PARTIAL_PROJECT_PRESERVED</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {files.filter((f) => !isPlaceholderFile(f)).length} / {files.length} FILES READY
                    </span>
                  </div>
                  <div className="text-secondary-300 text-[10px] mt-1 leading-relaxed">
                    {remainingFiles.length > 0
                      ? `Remaining: ${remainingFiles.join(", ")}. Select a model in the header and click Resume Generation.`
                      : "Files preserved successfully. You can continue refining or modify code below."}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => generateCode(originalPrompt, true)}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-amber-500 text-secondary-950 hover:bg-amber-400 font-bold uppercase tracking-wider text-[10px] transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                >
                  <span>Resume Generation</span>
                  <span>↗</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPartialGeneration(false);
                    setRemainingFiles([]);
                    setFiles([]);
                    setCode("");
                    setManifest(null);
                    setOriginalPrompt("");
                    localStorage.removeItem("ai_builder_draft");
                  }}
                  className="px-3 py-2 border border-secondary-700 bg-secondary-900/60 hover:bg-secondary-800 text-secondary-400 hover:text-white uppercase tracking-wider text-[10px] transition-colors cursor-pointer"
                >
                  Discard & Reset
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="border border-danger-500/50 bg-danger-500/10 text-danger-500 p-4 font-mono text-xs tracking-widest uppercase flex gap-4 items-start shrink-0">
              <span className="font-bold mt-0.5">ERR:</span>
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {loading && (
            <div className="border border-secondary-700 bg-secondary-800/30 p-4 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-start gap-4">
                <div className="w-4 h-4 border border-primary-400 border-t-transparent animate-spin rounded-none mt-0.5"></div>
                <div className="font-mono text-xs tracking-widest uppercase text-secondary-300">
                  <span className="text-primary-400 block mb-1">[SYS_EXECUTION]</span>
                  {generationStatus || "Executing generation sequence..."}
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                className="border border-danger-500/60 bg-danger-500/10 text-danger-400 hover:bg-danger-500/20 px-3 py-1.5 font-mono text-[10px] tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <span className="w-1.5 h-1.5 bg-danger-500 rounded-none inline-block"></span>
                STOP
              </button>
            </div>
          )}

          {refining && <RefineWaitingStatus status={refineStatus} onStop={handleCancel} />}

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

          <div className={`w-full flex-1 flex flex-col min-h-0 relative ${isLoadingProject ? "hidden" : "flex"}`}>
            <SandpackWrapper
              code={code}
              files={files}
              dependencies={manifest?.packages.dependencies || {}}
              onErrorChange={setSandpackError}
            >
              <div className="w-full flex flex-col gap-4 sm:gap-6">
                {/* Editor Section */}
                <div className={`w-full h-[480px] xl:h-[540px] flex flex-col md:flex-row gap-3 sm:gap-4 shrink-0 ${mobileView === "preview" ? "hidden lg:flex" : "flex"
                  }`}>
                  <div className="h-48 sm:h-56 md:h-full md:flex-[2_2_0%] min-w-0 shrink-0">
                    <SandpackFileExplorer />
                  </div>
                  <div className="flex-1 md:h-full md:flex-[8_8_0%] min-w-0 border border-secondary-800 bg-[#05080c] shrink-0">
                    <CodeEditor onSaveFile={handleFileSave} onSave={setCode} />
                  </div>
                </div>
                {/* Preview Section */}
                <div className={`w-full h-[580px] xl:h-[680px] shrink-0 border border-secondary-800 bg-white relative ${mobileView === "code" ? "hidden lg:block" : "block"
                  }`}>
                  <PreviewPanel error={sandpackError} onAutoFix={refineCode} />
                </div>
              </div>
            </SandpackWrapper>
          </div>
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