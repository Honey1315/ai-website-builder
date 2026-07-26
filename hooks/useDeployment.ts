import { useState, useCallback, useRef } from "react";
import { FileData } from "@/types/ai";
import { DeployConfig, DeployState, DeploymentStatus } from "@/types/deploy";

export function useDeployment() {
  const [state, setState] = useState<DeployState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [githubUrl, setGithubUrl] = useState<string | null>(null);
  const [vercelUrl, setVercelUrl] = useState<string | null>(null);
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const reset = useCallback(() => {
    setState("idle");
    setError(null);
    setGithubUrl(null);
    setVercelUrl(null);
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    if (state !== "ready" && state !== "error") {
      setState("idle");
      setError("Deployment cancelled");
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }
  }, [state]);

  const deploy = useCallback(async (config: DeployConfig, files: FileData[], projectName: string) => {
    reset();
    
    try {
      // 1. Push to GitHub
      setState("pushing_github");
      const githubRes = await fetch("/api/deploy/github", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-github-token": config.githubToken,
        },
        body: JSON.stringify({
          projectName,
          files,
          repoName: config.repoName,
        }),
      });

      const githubData = await githubRes.json();
      if (!githubRes.ok) throw new Error(githubData.error || "GitHub deploy failed");
      
      setGithubUrl(githubData.repoUrl);

      // 2. Create Vercel Project & Deploy
      setState("creating_vercel");
      const vercelRes = await fetch("/api/deploy/vercel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vercel-token": config.vercelToken,
        },
        body: JSON.stringify({
          projectName,
          repoFullName: githubData.repoFullName,
          repoId: githubData.repoId,
          framework: "create-react-app", // Can be dynamic based on project manifest later
        }),
      });

      const vercelData = await vercelRes.json();
      if (!vercelRes.ok) throw new Error(vercelData.error || "Vercel deploy failed");

      const deploymentId = vercelData.deploymentId;
      setVercelUrl(vercelData.projectUrl); // Use project URL initially

      // 3. Poll for Status
      setState("deploying");
      
      pollingRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/deploy/vercel/status?deploymentId=${deploymentId}`, {
            headers: {
              "x-vercel-token": config.vercelToken,
            },
          });
          
          if (!statusRes.ok) {
            console.error("Failed to poll status");
            return;
          }

          const statusData: DeploymentStatus = await statusRes.json();

          if (statusData.status === "READY") {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setVercelUrl(statusData.url); // Set to the specific deployment URL
            setState("ready");
          } else if (statusData.status === "ERROR" || statusData.status === "CANCELED") {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setError(`Deployment ${statusData.status}: ${statusData.error || "Unknown error"}`);
            setState("error");
          }
          // QUEUED or BUILDING just continues polling
        } catch (pollErr) {
          console.error("Polling error:", pollErr);
        }
      }, 3000);

    } catch (err: any) {
      setError(err.message || "An error occurred during deployment");
      setState("error");
    }
  }, [reset]);

  return {
    state,
    error,
    githubUrl,
    vercelUrl,
    deploy,
    cancel,
    reset,
  };
}
