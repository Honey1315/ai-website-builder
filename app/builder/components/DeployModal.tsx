"use client";

import { useState, useEffect, useCallback } from "react";
import { useDeployment } from "@/hooks/useDeployment";
import { FileData } from "@/types/ai";

interface SavedToken {
  id: string;
  provider: "github" | "vercel";
  token_hint: string;
  label: string | null;
  created_at?: string;
}

interface DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: FileData[];
  projectName: string;
  projectId?: string | null;
  onSaveProject?: () => Promise<string | null>;
}

export default function DeployModal({
  isOpen,
  onClose,
  files,
  projectName,
  projectId,
  onSaveProject,
}: DeployModalProps) {
  const sanitizeRepoName = (name: string) => {
    return (
      (name || "my-ai-site")
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 50) || "my-ai-site"
    );
  };

  // Saved tokens state from API
  const [savedTokens, setSavedTokens] = useState<SavedToken[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);

  // GitHub token selection/input
  const [selectedGithubId, setSelectedGithubId] = useState<string>("new");
  const [newGithubToken, setNewGithubToken] = useState("");
  const [saveGithubToAccount, setSaveGithubToAccount] = useState(true);

  // Vercel token selection/input
  const [selectedVercelId, setSelectedVercelId] = useState<string>("new");
  const [newVercelToken, setNewVercelToken] = useState("");
  const [saveVercelToAccount, setSaveVercelToAccount] = useState(true);

  const [repoName, setRepoName] = useState(() => sanitizeRepoName(projectName));
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  const { state, error, githubUrl, vercelUrl, deploy, cancel, reset } = useDeployment();

  const fetchTokens = useCallback(async () => {
    try {
      setIsLoadingTokens(true);
      const res = await fetch("/api/tokens");
      if (res.ok) {
        const data = await res.json();
        const tokens: SavedToken[] = data.tokens || [];
        setSavedTokens(tokens);

        const ghTokens = tokens.filter((t) => t.provider === "github");
        if (ghTokens.length > 0) {
          setSelectedGithubId(ghTokens[0].id);
        } else {
          setSelectedGithubId("new");
        }

        const vcTokens = tokens.filter((t) => t.provider === "vercel");
        if (vcTokens.length > 0) {
          setSelectedVercelId(vcTokens[0].id);
        } else {
          setSelectedVercelId("new");
        }
      }
    } catch (err) {
      console.error("Failed to fetch saved tokens:", err);
    } finally {
      setIsLoadingTokens(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchTokens();
      setRepoName(sanitizeRepoName(projectName));
      reset();
    }
  }, [isOpen, projectName, reset, fetchTokens]);

  if (!isOpen) return null;

  const githubSavedList = savedTokens.filter((t) => t.provider === "github");
  const vercelSavedList = savedTokens.filter((t) => t.provider === "vercel");

  const handleDeleteToken = async (id: string, provider: "github" | "vercel") => {
    try {
      const res = await fetch(`/api/tokens?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setSavedTokens((prev) => prev.filter((t) => t.id !== id));
        if (provider === "github" && selectedGithubId === id) {
          setSelectedGithubId("new");
        }
        if (provider === "vercel" && selectedVercelId === id) {
          setSelectedVercelId("new");
        }
      }
    } catch (err) {
      console.error("Failed to delete token:", err);
    }
  };

  const handleDeploy = async () => {
    let finalGithubToken = selectedGithubId === "new" ? newGithubToken.trim() : undefined;
    let finalGithubTokenId = selectedGithubId !== "new" ? selectedGithubId : undefined;

    let finalVercelToken = selectedVercelId === "new" ? newVercelToken.trim() : undefined;
    let finalVercelTokenId = selectedVercelId !== "new" ? selectedVercelId : undefined;

    // Save new GitHub token to account if requested
    if (selectedGithubId === "new" && finalGithubToken && saveGithubToAccount) {
      try {
        const res = await fetch("/api/tokens", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: "github",
            token: finalGithubToken,
            label: "Default",
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.token?.id) {
            finalGithubTokenId = data.token.id;
          }
        }
      } catch (err) {
        console.error("Failed to auto-save GitHub token:", err);
      }
    }

    // Save new Vercel token to account if requested
    if (selectedVercelId === "new" && finalVercelToken && saveVercelToAccount) {
      try {
        const res = await fetch("/api/tokens", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: "vercel",
            token: finalVercelToken,
            label: "Default",
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.token?.id) {
            finalVercelTokenId = data.token.id;
          }
        }
      } catch (err) {
        console.error("Failed to auto-save Vercel token:", err);
      }
    }

    let activeProjectId = projectId;

    // If project hasn't been saved yet, auto-save first so it exists in Supabase
    if (!activeProjectId && onSaveProject) {
      setIsAutoSaving(true);
      try {
        const savedId = await onSaveProject();
        if (!savedId) {
          setIsAutoSaving(false);
          return;
        }
        activeProjectId = savedId;
      } catch (err) {
        console.error("Auto-save failed before deploy:", err);
      } finally {
        setIsAutoSaving(false);
      }
    }

    deploy(
      {
        githubToken: finalGithubToken,
        githubTokenId: finalGithubTokenId,
        vercelToken: finalVercelToken,
        vercelTokenId: finalVercelTokenId,
        repoName,
      },
      files,
      projectName,
      activeProjectId
    );
  };

  const handleClose = () => {
    if (state === "pushing_github" || state === "creating_vercel" || state === "deploying") {
      if (window.confirm("Deployment is in progress. Are you sure you want to abort?")) {
        cancel();
        onClose();
      }
    } else {
      reset();
      onClose();
    }
  };

  const isDeployReady =
    (selectedGithubId !== "new" || !!newGithubToken.trim()) &&
    (selectedVercelId !== "new" || !!newVercelToken.trim()) &&
    !!repoName.trim() &&
    files.length > 0 &&
    !isAutoSaving;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-[#05080c]/80 backdrop-blur-md" onClick={handleClose}></div>
      <div className="relative w-full max-w-lg bg-secondary-900 border border-secondary-700 shadow-2xl rounded-none my-auto max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden z-10">
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-primary-500 opacity-50 pointer-events-none z-20"></div>

        <div className="flex justify-between items-center border-b border-secondary-800 px-6 py-4 sm:px-8 sm:py-5 shrink-0 bg-secondary-900 z-10">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 bg-primary-400 block animate-pulse"></span>
            <h2 className="text-[10px] font-mono text-primary-400 uppercase tracking-widest">
              Deployment Sequence
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-secondary-500 hover:text-primary-400 transition-colors cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="square" strokeLinejoin="miter" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 flex flex-col gap-6">
          {state === "idle" && (
            <div className="flex flex-col gap-6 text-secondary-300">
              <div className="bg-primary-900/10 border border-primary-500/30 p-4 font-mono text-xs text-primary-400 uppercase tracking-wider leading-relaxed">
                <span className="font-bold text-primary-300">[SYS_REQ]</span> Vercel GitHub App
                authorization required for deployment protocol.{" "}
                <a
                  href="https://github.com/apps/vercel"
                  target="_blank"
                  className="underline hover:text-white transition-colors block mt-1"
                >
                  Configure Authorization ↗
                </a>
              </div>

              {!projectId && (
                <div className="bg-[#0a0f16] border border-primary-500/20 px-3.5 py-2.5 flex items-center gap-2.5 font-mono text-[10px] text-primary-400 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 bg-primary-400 animate-pulse"></span>
                  <span>Auto-save enabled: Project will be saved to your dashboard upon deployment</span>
                </div>
              )}

              {/* ── GITHUB TOKEN SECTION ────────────────────────────────────────── */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-secondary-500">
                    GitHub Access Token
                  </label>
                  <a
                    href="https://github.com/settings/tokens/new"
                    target="_blank"
                    className="text-[9px] font-mono uppercase tracking-widest text-primary-500 hover:text-primary-400 border-b border-transparent hover:border-primary-400 transition-colors"
                  >
                    Generate ↗
                  </a>
                </div>

                {githubSavedList.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedGithubId}
                        onChange={(e) => setSelectedGithubId(e.target.value)}
                        className="flex-1 bg-[#0a0f16] border border-secondary-800 text-white font-mono text-xs p-3 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 rounded-none cursor-pointer"
                      >
                        {githubSavedList.map((token) => (
                          <option key={token.id} value={token.id}>
                            Saved: {token.label || "Default"} ({token.token_hint})
                          </option>
                        ))}
                        <option value="new">+ Enter New Token...</option>
                      </select>

                      {selectedGithubId !== "new" && (
                        <button
                          type="button"
                          onClick={() => handleDeleteToken(selectedGithubId, "github")}
                          title="Delete saved token"
                          className="p-3 border border-secondary-800 bg-[#0a0f16] text-secondary-500 hover:text-danger-500 hover:border-danger-500/50 transition-colors cursor-pointer"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-4 h-4"
                          >
                            <path
                              strokeLinecap="square"
                              strokeLinejoin="miter"
                              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                            />
                          </svg>
                        </button>
                      )}
                    </div>

                    {selectedGithubId === "new" && (
                      <div className="flex flex-col gap-2 mt-1">
                        <input
                          type="password"
                          value={newGithubToken}
                          onChange={(e) => setNewGithubToken(e.target.value)}
                          className="bg-[#0a0f16] border border-secondary-800 text-white font-mono text-sm p-3 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 rounded-none transition-colors"
                          placeholder="ghp_..."
                        />
                        <label className="flex items-center gap-2 text-[10px] font-mono text-secondary-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={saveGithubToAccount}
                            onChange={(e) => setSaveGithubToAccount(e.target.checked)}
                            className="accent-primary-500"
                          />
                          <span className="uppercase tracking-widest">
                            Save encrypted to account
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <input
                      type="password"
                      value={newGithubToken}
                      onChange={(e) => setNewGithubToken(e.target.value)}
                      className="bg-[#0a0f16] border border-secondary-800 text-white font-mono text-sm p-3 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 rounded-none transition-colors"
                      placeholder="ghp_..."
                    />
                    <label className="flex items-center gap-2 text-[10px] font-mono text-secondary-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={saveGithubToAccount}
                        onChange={(e) => setSaveGithubToAccount(e.target.checked)}
                        className="accent-primary-500"
                      />
                      <span className="uppercase tracking-widest">
                        Save encrypted to account
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* ── VERCEL TOKEN SECTION ────────────────────────────────────────── */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-secondary-500">
                    Vercel Access Token
                  </label>
                  <a
                    href="https://vercel.com/account/tokens"
                    target="_blank"
                    className="text-[9px] font-mono uppercase tracking-widest text-primary-500 hover:text-primary-400 border-b border-transparent hover:border-primary-400 transition-colors"
                  >
                    Generate ↗
                  </a>
                </div>

                {vercelSavedList.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedVercelId}
                        onChange={(e) => setSelectedVercelId(e.target.value)}
                        className="flex-1 bg-[#0a0f16] border border-secondary-800 text-white font-mono text-xs p-3 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 rounded-none cursor-pointer"
                      >
                        {vercelSavedList.map((token) => (
                          <option key={token.id} value={token.id}>
                            Saved: {token.label || "Default"} ({token.token_hint})
                          </option>
                        ))}
                        <option value="new">+ Enter New Token...</option>
                      </select>

                      {selectedVercelId !== "new" && (
                        <button
                          type="button"
                          onClick={() => handleDeleteToken(selectedVercelId, "vercel")}
                          title="Delete saved token"
                          className="p-3 border border-secondary-800 bg-[#0a0f16] text-secondary-500 hover:text-danger-500 hover:border-danger-500/50 transition-colors cursor-pointer"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-4 h-4"
                          >
                            <path
                              strokeLinecap="square"
                              strokeLinejoin="miter"
                              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                            />
                          </svg>
                        </button>
                      )}
                    </div>

                    {selectedVercelId === "new" && (
                      <div className="flex flex-col gap-2 mt-1">
                        <input
                          type="password"
                          value={newVercelToken}
                          onChange={(e) => setNewVercelToken(e.target.value)}
                          className="bg-[#0a0f16] border border-secondary-800 text-white font-mono text-sm p-3 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 rounded-none transition-colors"
                          placeholder="v1_..."
                        />
                        <label className="flex items-center gap-2 text-[10px] font-mono text-secondary-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={saveVercelToAccount}
                            onChange={(e) => setSaveVercelToAccount(e.target.checked)}
                            className="accent-primary-500"
                          />
                          <span className="uppercase tracking-widest">
                            Save encrypted to account
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <input
                      type="password"
                      value={newVercelToken}
                      onChange={(e) => setNewVercelToken(e.target.value)}
                      className="bg-[#0a0f16] border border-secondary-800 text-white font-mono text-sm p-3 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 rounded-none transition-colors"
                      placeholder="v1_..."
                    />
                    <label className="flex items-center gap-2 text-[10px] font-mono text-secondary-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={saveVercelToAccount}
                        onChange={(e) => setSaveVercelToAccount(e.target.checked)}
                        className="accent-primary-500"
                      />
                      <span className="uppercase tracking-widest">
                        Save encrypted to account
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* ── REPO NAME SECTION ───────────────────────────────────────────── */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-secondary-500">
                  Repository Name
                </label>
                <input
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  className="bg-[#0a0f16] border border-secondary-800 text-white font-mono text-sm p-3 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 rounded-none transition-colors"
                />
              </div>

              <button
                onClick={handleDeploy}
                disabled={!isDeployReady}
                className="mt-6 bg-primary-500 hover:bg-primary-400 text-secondary-900 font-bold font-mono text-[10px] uppercase tracking-widest p-4 rounded-none transition-colors disabled:opacity-30 disabled:cursor-not-allowed border border-primary-500 cursor-pointer flex items-center justify-center gap-2"
              >
                {isAutoSaving ? (
                  <>
                    <span className="w-2 h-2 bg-secondary-900 animate-ping"></span>
                    [SYS_SYNC] Saving Project Before Deploy...
                  </>
                ) : (
                  "Execute Deployment _"
                )}
              </button>
            </div>
          )}

          {(state === "pushing_github" || state === "creating_vercel" || state === "deploying") && (
            <div className="flex flex-col gap-8 py-8 px-4 border border-secondary-800 bg-[#0a0f16]">
              <StepItem
                status={state === "pushing_github" ? "active" : "done"}
                title="Git Push Sequence"
                desc="Initializing repository & committing assets"
              />
              <StepItem
                status={
                  state === "creating_vercel"
                    ? "active"
                    : state === "deploying"
                    ? "done"
                    : "pending"
                }
                title="Vercel Integration"
                desc="Establishing link & provisioning environment"
              />
              <StepItem
                status={state === "deploying" ? "active" : "pending"}
                title="Build & Distribution"
                desc="Compiling source & assigning domain"
              />
            </div>
          )}

          {state === "ready" && (
            <div className="bg-primary-900/10 border border-primary-500 p-8 flex flex-col items-center text-center gap-6">
              <div className="w-16 h-16 bg-primary-500/10 border border-primary-500 text-primary-400 flex items-center justify-center mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-8 h-8"
                >
                  <path strokeLinecap="square" strokeLinejoin="miter" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-display text-white uppercase tracking-widest mb-2">
                  System Online
                </h3>
                <p className="text-[10px] font-mono text-secondary-400 uppercase tracking-widest">
                  Deployment completed successfully.
                </p>
              </div>

              <div className="flex flex-col gap-3 w-full mt-4">
                {vercelUrl && (
                  <a
                    href={vercelUrl}
                    target="_blank"
                    className="w-full py-4 bg-primary-500 text-secondary-900 border border-primary-500 font-bold font-mono text-[10px] uppercase tracking-widest hover:bg-primary-400 transition-colors text-center"
                  >
                    Access Production Environment ↗
                  </a>
                )}
                {githubUrl && (
                  <a
                    href={githubUrl}
                    target="_blank"
                    className="w-full py-4 bg-transparent border border-secondary-700 text-white font-mono text-[10px] uppercase tracking-widest hover:border-primary-400 hover:text-primary-400 transition-colors text-center"
                  >
                    Access Source Repository ↗
                  </a>
                )}
              </div>
            </div>
          )}

          {state === "error" && (
            <div className="bg-danger-500/10 border border-danger-500/50 p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3 border-b border-danger-500/30 pb-3">
                <span className="w-2 h-2 bg-danger-500 block"></span>
                <h3 className="font-mono text-[10px] font-bold text-danger-500 uppercase tracking-widest">
                  Deployment Failure
                </h3>
              </div>
              <p className="text-xs font-mono text-danger-400 break-words leading-relaxed">{error}</p>
              <button
                onClick={reset}
                className="bg-transparent border border-danger-500/50 text-danger-500 hover:bg-danger-500 hover:text-white px-6 py-3 font-mono text-[10px] uppercase tracking-widest w-fit mt-4 transition-colors"
              >
                Reinitialize Protocol
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StepItem({
  status,
  title,
  desc,
}: {
  status: "pending" | "active" | "done";
  title: string;
  desc: string;
}) {
  return (
    <div
      className={`flex items-start gap-5 ${
        status === "active" ? "opacity-100" : status === "done" ? "opacity-70" : "opacity-30"
      }`}
    >
      <div
        className={`w-8 h-8 flex items-center justify-center shrink-0 border mt-0.5
          ${
            status === "done"
              ? "bg-primary-500/10 border-primary-500 text-primary-400"
              : status === "active"
              ? "bg-transparent border-primary-400 text-primary-400"
              : "bg-transparent border-secondary-700 text-secondary-700"
          }
       `}
      >
        {status === "done" ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path
              fillRule="evenodd"
              d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <div
            className={`w-2 h-2 ${status === "active" ? "bg-primary-400 animate-pulse" : "bg-secondary-700"}`}
          />
        )}
      </div>
      <div className="flex flex-col gap-1 mt-1">
        <span
          className={`font-mono text-[10px] uppercase tracking-widest font-bold ${
            status === "active" ? "text-primary-400" : "text-secondary-400"
          }`}
        >
          {title}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-wider text-secondary-600">{desc}</span>
      </div>
    </div>
  );
}