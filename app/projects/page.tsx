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

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/project/save");
      const data = await response.json();
      setProjects(data || []);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Projects</h1>
          <Link href="/builder">
            <Button variant="primary">Create New</Button>
          </Link>
        </div>

        {loading ? (
          <Loader />
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No projects yet</p>
            <Link href="/builder">
              <Button>Create Your First Website</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                {project.thumbnail && (
                  <img
                    src={project.thumbnail}
                    alt={project.name}
                    className="w-full h-40 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{project.name}</h3>
                  {project.description && (
                    <p className="text-gray-600 text-sm mb-4">
                      {project.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mb-4">
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </p>
                  <Link href={`/builder?projectId=${project.id}`}>
                    <Button variant="secondary" size="sm" className="w-full">
                      Edit
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
