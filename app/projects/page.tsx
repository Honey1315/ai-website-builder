"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { ProjectMetadata } from "@/types/project";
import { Button } from "@/components/UI/Button";
import Link from "next/link";
import { Loader } from "@/components/Loader";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [editingProject, setEditingProject] = useState<ProjectMetadata | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    if (!editingProject) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSavingEdit) {
        setEditingProject(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingProject, isSavingEdit]);

  const openEditModal = (project: ProjectMetadata) => {
    setEditingProject(project);
    setEditName(project.name);
    setEditDescription(project.description || "");
    setEditError(null);
  };

  const closeEditModal = () => {
    if (isSavingEdit) return;
    setEditingProject(null);
    setEditName("");
    setEditDescription("");
    setEditError(null);
  };

  const handleSaveEdit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingProject) return;

    const trimmedName = editName.trim();
    if (!trimmedName) {
      setEditError("Project name is required");
      return;
    }

    try {
      setIsSavingEdit(true);
      setEditError(null);

      const response = await fetch("/api/project/save", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingProject.id,
          name: trimmedName,
          description: editDescription.trim(),
        }),
      });

      if (response.status === 401) {
        setIsUnauthorized(true);
        closeEditModal();
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update project");
      }

      const { project: updated } = await response.json();

      setProjects((prev) =>
        prev.map((p) =>
          p.id === editingProject.id
            ? {
                ...p,
                name: updated.name,
                description: updated.description,
                updatedAt: updated.updatedAt,
              }
            : p
        )
      );

      closeEditModal();
    } catch (err: any) {
      setEditError(err.message || "An error occurred while saving");
    } finally {
      setIsSavingEdit(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/project/save");

        if (response.status === 401) {
          if (!cancelled) {
            setIsUnauthorized(true);
            setProjects([]);
          }
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch projects");
        }

        const data = await response.json();

        if (!cancelled) {
          setIsUnauthorized(false);
          setProjects(data || []);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to fetch projects:", error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProjects();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = async (projectId: string) => {
    setDeletingId(projectId);
    const previous = projects;
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    setConfirmDeleteId(null);

    try {
      const response = await fetch(`/api/project/save?id=${projectId}`, {
        method: "DELETE",
      });

      if (response.status === 401) {
        setIsUnauthorized(true);
        setProjects(previous);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to delete project");
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
      setProjects(previous);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#05080c] font-sans text-secondary-50 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(var(--color-primary-400) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary-400) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-primary-900/10 blur-[120px] rounded-full pointer-events-none"></div>

      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-12 lg:py-20 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 border-b border-secondary-800 pb-8">
          <div>
            <div className="text-[10px] font-mono text-primary-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary-400 block"></span>
              Workspace_Repository
            </div>
            <h1 className="text-3xl md:text-4xl font-display text-white uppercase tracking-wide">
              My Projects
            </h1>
          </div>
          <Link href="/builder">
            <Button variant="primary">Create New _</Button>
          </Link>
        </div>

        {loading ? (
          <div className="py-20">
            <Loader />
          </div>
        ) : isUnauthorized ? (
          <div className="border border-secondary-800 bg-secondary-900/40 p-12 md:p-16 text-center relative overflow-hidden">
            <h2 className="text-xl md:text-2xl font-display text-white tracking-wide mb-8">
              Sign in to view your projects
            </h2>
          </div>
        ) : projects.length === 0 ? (
          <div className="border border-secondary-800 bg-secondary-900/30 p-12 md:p-20 text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-secondary-700 opacity-50 group-hover:border-primary-500 transition-colors"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-secondary-700 opacity-50 group-hover:border-primary-500 transition-colors"></div>

            <div className="text-4xl mb-4 font-display font-light text-secondary-700 block">∅</div>
            <p className="text-[10px] font-mono text-secondary-500 uppercase tracking-[0.2em] mb-8">
              No projects initialized in current workspace
            </p>
            <Link href="/builder">
              <Button variant="primary">Initialize First Project _</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {projects.map((project) => (
              <div
                key={project.id}
                className="border border-secondary-800 bg-secondary-900 hover:border-primary-500/50 transition-colors flex flex-col relative group"
              >
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>

                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-1.5 h-1.5 bg-secondary-600 block group-hover:bg-primary-400 transition-colors"></span>
                    <h3 className="font-display text-lg text-white uppercase tracking-wide truncate">
                      {project.name}
                    </h3>
                  </div>

                  {project.description ? (
                    <p className="text-secondary-400 text-sm font-light mb-6 line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                  ) : (
                    <p className="text-secondary-600 text-sm font-light mb-6 font-mono text-[10px] uppercase tracking-widest italic">
                      [ No description provided ]
                    </p>
                  )}

                  {(project.vercel_link || project.github_link) && (
                    <div className="flex flex-wrap items-center gap-2 mb-4 pt-3 border-t border-secondary-800/60">
                      {project.vercel_link && (
                        <a
                          href={project.vercel_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-mono uppercase tracking-wider bg-primary-500/10 text-primary-400 border border-primary-500/30 hover:bg-primary-500 hover:text-secondary-900 transition-colors"
                          title="Open Live Vercel Deployment"
                        >
                          <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-pulse"></span>
                          Live Site ↗
                        </a>
                      )}
                      {project.github_link && (
                        <a
                          href={project.github_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-mono uppercase tracking-wider bg-secondary-800/80 text-secondary-300 border border-secondary-700 hover:border-secondary-500 hover:text-white transition-colors"
                          title="Open GitHub Repository"
                        >
                          GitHub ↗
                        </a>
                      )}
                    </div>
                  )}

                  <div className="text-[10px] font-mono text-secondary-600 uppercase tracking-widest mt-auto mb-6 flex items-center justify-between border-t border-secondary-800 pt-4">
                    <span>SYS_UPDATED:</span>
                    <span className="text-secondary-400">{new Date(project.updatedAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex gap-2 items-center">
                    <Link href={`/builder?projectId=${project.id}`} className="flex-1">
                      <Button variant="secondary" size="sm" className="w-full">
                        Open Project _
                      </Button>
                    </Link>

                    <button
                      onClick={() => openEditModal(project)}
                      className="px-3 py-2 text-[10px] font-mono uppercase tracking-widest border border-secondary-800 text-secondary-400 hover:border-primary-500/60 hover:text-primary-400 hover:bg-primary-500/5 transition-colors cursor-pointer"
                      title="Edit project name and description"
                    >
                      Edit
                    </button>

                    {confirmDeleteId === project.id ? (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleDelete(project.id)}
                          disabled={deletingId === project.id}
                          className="px-3 py-2 text-[10px] font-mono uppercase tracking-widest bg-danger-500/20 text-danger-500 border border-danger-500/50 hover:bg-danger-500 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {deletingId === project.id ? "[...]" : "Confirm"}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2.5 py-2 text-[10px] font-mono uppercase tracking-widest bg-transparent border border-secondary-700 text-secondary-400 hover:border-secondary-500 hover:text-secondary-300 transition-colors cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(project.id)}
                        className="px-3 py-2 text-[10px] font-mono uppercase tracking-widest border border-secondary-800 text-secondary-500 hover:bg-danger-500/10 hover:border-danger-500/50 hover:text-danger-500 transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingProject && (
        <div className="fixed inset-0 bg-[#05080c]/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-secondary-900 border border-secondary-700 shadow-2xl max-w-lg w-full relative overflow-hidden">
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary-500 opacity-60 pointer-events-none"></div>

            <div className="border-b border-secondary-800 px-6 py-4 bg-secondary-800/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 bg-primary-400 block"></span>
                <h2 className="text-xs font-mono uppercase tracking-widest text-white font-medium">
                  Edit_Project_Details
                </h2>
              </div>
              <button
                onClick={closeEditModal}
                disabled={isSavingEdit}
                className="text-secondary-500 hover:text-secondary-300 text-xs font-mono cursor-pointer transition-colors"
              >
                [ESC / ✕]
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="p-6 space-y-5">
                {editError && (
                  <div className="p-3 border border-danger-500/40 bg-danger-500/10 text-danger-400 text-xs font-mono flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-danger-400 block shrink-0"></span>
                    <span>{editError}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-secondary-400 flex items-center gap-1.5">
                    <span className="w-1 h-1 bg-primary-400"></span>
                    Project Name <span className="text-primary-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. My Nextjs Portfolio"
                    maxLength={255}
                    autoFocus
                    disabled={isSavingEdit}
                    className="w-full bg-[#070b10] text-white px-3.5 py-2.5 border border-secondary-800 focus:border-primary-400 focus:outline-none text-sm font-sans placeholder:text-secondary-700 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-secondary-400 flex items-center gap-1.5">
                    <span className="w-1 h-1 bg-secondary-600"></span>
                    Description
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Brief summary of this project..."
                    rows={4}
                    maxLength={1000}
                    disabled={isSavingEdit}
                    className="w-full bg-[#070b10] text-white px-3.5 py-2.5 border border-secondary-800 focus:border-primary-400 focus:outline-none text-sm font-sans placeholder:text-secondary-700 transition-colors resize-none leading-relaxed"
                  />
                  <div className="text-[9px] font-mono text-secondary-600 text-right">
                    {editDescription.length}/1000
                  </div>
                </div>
              </div>

              <div className="border-t border-secondary-800 px-6 py-4 bg-[#070b10] flex gap-3 justify-end items-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={closeEditModal}
                  disabled={isSavingEdit}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSavingEdit || !editName.trim()}
                >
                  {isSavingEdit ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                      </svg>
                      <span>Saving...</span>
                    </span>
                  ) : (
                    "Save Changes _"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}