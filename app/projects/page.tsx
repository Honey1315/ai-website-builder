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
    // Optimistically remove from UI
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
      // Rollback on failure
      setProjects(previous);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#05080c] font-sans text-secondary-50 relative overflow-hidden">
      {/* Background Technical Elements */}
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
            {/* Corner Accents */}
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
                {/* Decorative corner accent on hover */}
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

                  <div className="flex gap-3">
                    <Link href={`/builder?projectId=${project.id}`} className="flex-1">
                      <Button variant="secondary" size="sm" className="w-full">
                        Edit _
                      </Button>
                    </Link>

                    {confirmDeleteId === project.id ? (
                      // Confirm state
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(project.id)}
                          disabled={deletingId === project.id}
                          className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest bg-danger-500/20 text-danger-500 border border-danger-500/50 hover:bg-danger-500 hover:text-white transition-colors disabled:opacity-50"
                        >
                          {deletingId === project.id ? "[...]" : "Confirm"}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest bg-transparent border border-secondary-700 text-secondary-400 hover:border-secondary-500 hover:text-secondary-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(project.id)}
                        className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest border border-secondary-800 text-secondary-500 hover:bg-danger-500/10 hover:border-danger-500/50 hover:text-danger-500 transition-colors"
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
    </div>
  );
}