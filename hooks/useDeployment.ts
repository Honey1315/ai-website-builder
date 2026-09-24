import { useState, useCallback, useRef, useEffect } from "react";
import { FileData } from "@/types/ai";
import { DeployConfig, DeployState, DeploymentStatus } from "@/types/deploy";

export function useDeployment() {
  const [state, setState] = useState<DeployState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [githubUrl, setGithubUrl] = useState<string | null>(null);
  const [vercelUrl, setVercelUrl] = useState<string | null>(null);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

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

  const deploy = useCallback(async (
    config: DeployConfig,
    files: FileData[],
    projectName: string,
    projectId?: string | null
  ) => {
    reset();

    try {
      setState("pushing_github");
      const githubHeaders: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (config.githubToken) {
        githubHeaders["x-github-token"] = config.githubToken;
      }

      const githubRes = await fetch("/api/deploy/github", {
        method: "POST",
        headers: githubHeaders,
        body: JSON.stringify({
          projectName,
          files,
          repoName: config.repoName,
          tokenId: config.githubTokenId,
        }),
      });

      const githubData = await githubRes.json();
      if (!githubRes.ok) throw new Error(githubData.error || "GitHub deploy failed");

      const createdRepoUrl = githubData.repoUrl;
      setGithubUrl(createdRepoUrl);

      if (projectId && createdRepoUrl) {
        fetch("/api/project/save", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: projectId, github_link: createdRepoUrl }),
        }).catch((err) => console.error("Failed to persist github_link:", err));
      }

      setState("creating_vercel");
      const vercelHeaders: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (config.vercelToken) {
        vercelHeaders["x-vercel-token"] = config.vercelToken;
      }

      const vercelRes = await fetch("/api/deploy/vercel", {
        method: "POST",
        headers: vercelHeaders,
        body: JSON.stringify({
          projectName: config.repoName || githubData.repoName || projectName,
          repoFullName: githubData.repoFullName,
          repoId: githubData.repoId,
          framework: "vite",
          tokenId: config.vercelTokenId,
        }),
      });

      const vercelData = await vercelRes.json();
      if (!vercelRes.ok) throw new Error(vercelData.error || "Vercel deploy failed");

      const deploymentId = vercelData.deploymentId;
      setVercelUrl(vercelData.projectUrl);

      setState("deploying");

      pollingRef.current = setInterval(async () => {
        try {
          const statusHeaders: Record<string, string> = {};
          if (config.vercelToken) {
            statusHeaders["x-vercel-token"] = config.vercelToken;
          }
          if (config.vercelTokenId) {
            statusHeaders["x-vercel-token-id"] = config.vercelTokenId;
          }

          const statusRes = await fetch(`/api/deploy/vercel/status?deploymentId=${deploymentId}`, {
            headers: statusHeaders,
          });

          if (!statusRes.ok) {
            console.error("Failed to poll status");
            return;
          }

          const statusData: DeploymentStatus = await statusRes.json();

          if (statusData.status === "READY") {
            if (pollingRef.current) clearInterval(pollingRef.current);
            const finalLiveUrl = statusData.url || vercelData.projectUrl;
            setVercelUrl(finalLiveUrl);
            setState("ready");


            if (projectId && finalLiveUrl) {
              fetch("/api/project/save", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: projectId, vercel_link: finalLiveUrl }),
              }).catch((err) => console.error("Failed to persist vercel_link:", err));
            }
          } else if (statusData.status === "ERROR" || statusData.status === "CANCELED") {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setError(`Deployment ${statusData.status}: ${statusData.error || "Unknown error"}`);
            setState("error");
          }
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
