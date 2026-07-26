"use client";

import { useState, useEffect } from "react";
import { useDeployment } from "@/hooks/useDeployment";
import { FileData } from "@/types/ai";

interface DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: FileData[];
  projectName: string;
}

export default function DeployModal({ isOpen, onClose, files, projectName }: DeployModalProps) {
  const [githubToken, setGithubToken] = useState("");
  const [vercelToken, setVercelToken] = useState("");
  const [repoName, setRepoName] = useState(
    projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-") || "my-ai-site"
  );
  const [rememberTokens, setRememberTokens] = useState(true);

  const { state, error, githubUrl, vercelUrl, deploy, cancel, reset } = useDeployment();

  useEffect(() => {
    if (isOpen) {
      const savedGithub = localStorage.getItem("githubToken");
      const savedVercel = localStorage.getItem("vercelToken");
      if (savedGithub) setGithubToken(savedGithub);
      if (savedVercel) setVercelToken(savedVercel);
      reset();
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const handleDeploy = () => {
    if (rememberTokens) {
      localStorage.setItem("githubToken", githubToken);
      localStorage.setItem("vercelToken", vercelToken);
    } else {
      localStorage.removeItem("githubToken");
      localStorage.removeItem("vercelToken");
    }

    deploy({ githubToken, vercelToken, repoName }, files, projectName);
  };

  const handleClose = () => {
    if (state === "pushing_github" || state === "creating_vercel" || state === "deploying") {
      if (window.confirm("Deployment is in progress. Are you sure you want to close?")) {
        cancel();
        onClose();
      }
    } else {
      reset();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 deploy-modal-overlay" onClick={handleClose}></div>
      <div className="deploy-modal relative w-full max-w-lg rounded-2xl p-6 overflow-hidden flex flex-col gap-4">
        
        <div className="flex justify-between items-center border-b pb-2">
          <h2 className="text-xl font-bold text-gray-800">Deploy to Vercel</h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {state === "idle" && (
          <div className="flex flex-col gap-4 text-gray-700">
             <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-sm text-blue-800">
               <strong>Note:</strong> You must have the <a href="https://github.com/apps/vercel" target="_blank" className="underline font-semibold">Vercel GitHub App</a> installed on your account for this to work.
             </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold">GitHub Personal Access Token (repo scope)</label>
              <input 
                type="password" 
                value={githubToken} 
                onChange={e => setGithubToken(e.target.value)}
                className="builder-input p-2 outline-none"
                placeholder="ghp_..."
              />
              <a href="https://github.com/settings/tokens/new" target="_blank" className="text-xs text-blue-500 hover:underline">Get a token</a>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold">Vercel Access Token</label>
              <input 
                type="password" 
                value={vercelToken} 
                onChange={e => setVercelToken(e.target.value)}
                className="builder-input p-2 outline-none"
                placeholder="v1_..."
              />
              <a href="https://vercel.com/account/tokens" target="_blank" className="text-xs text-blue-500 hover:underline">Get a token</a>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold">Repository Name</label>
              <input 
                type="text" 
                value={repoName} 
                onChange={e => setRepoName(e.target.value)}
                className="builder-input p-2 outline-none"
              />
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer mt-2">
              <input type="checkbox" checked={rememberTokens} onChange={e => setRememberTokens(e.target.checked)} />
              Remember tokens in this browser
            </label>

            <button 
              onClick={handleDeploy} 
              disabled={!githubToken || !vercelToken || !repoName || files.length === 0}
              className="deploy-btn mt-4 p-3 rounded-xl font-bold w-full text-center"
            >
              Start Deployment
            </button>
          </div>
        )}

        {(state === "pushing_github" || state === "creating_vercel" || state === "deploying") && (
          <div className="flex flex-col gap-6 py-4">
             <StepItem 
               status={state === "pushing_github" ? "active" : "done"} 
               title="Pushing to GitHub" 
               desc="Creating repository and committing files" 
             />
             <StepItem 
               status={state === "creating_vercel" ? "active" : (state === "deploying" ? "done" : "pending")} 
               title="Creating Vercel Project" 
               desc="Linking repository to Vercel" 
             />
             <StepItem 
               status={state === "deploying" ? "active" : "pending"} 
               title="Deploying Site" 
               desc="Building and assigning domain" 
             />
          </div>
        )}

        {state === "ready" && (
           <div className="deploy-success rounded-xl p-6 flex flex-col items-center text-center gap-4 border border-green-200">
             <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-2">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-8 h-8">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
               </svg>
             </div>
             <h3 className="text-2xl font-bold text-gray-800">Deployment Complete!</h3>
             <p className="text-gray-600">Your site is live and ready to be shared.</p>
             
             <div className="flex flex-col gap-3 w-full mt-4">
               {vercelUrl && (
                 <a href={vercelUrl} target="_blank" className="w-full py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors">
                   View Live Site
                 </a>
               )}
               {githubUrl && (
                 <a href={githubUrl} target="_blank" className="w-full py-3 bg-gray-100 text-gray-800 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
                   View GitHub Repo
                 </a>
               )}
             </div>
           </div>
        )}

        {state === "error" && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-800 flex flex-col gap-3">
             <h3 className="font-bold text-lg">Deployment Failed</h3>
             <p className="text-sm">{error}</p>
             <button onClick={reset} className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg font-semibold w-fit mt-2">
               Try Again
             </button>
          </div>
        )}

      </div>
    </div>
  );
}

function StepItem({ status, title, desc }: { status: "pending" | "active" | "done", title: string, desc: string }) {
  return (
    <div className={`flex items-start gap-4 deploy-step ${status === "active" ? "opacity-100" : (status === "done" ? "opacity-70" : "opacity-40")}`}>
       <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 mt-1
          ${status === "done" ? "bg-green-500 border-green-500 text-white" : 
            (status === "active" ? "border-blue-500 text-blue-500 deploy-step-active" : "border-gray-300 text-gray-300")}
       `}>
          {status === "done" ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
            </svg>
          ) : (
             <div className={`w-2 h-2 rounded-full ${status === "active" ? "bg-blue-500" : "bg-gray-300"}`} />
          )}
       </div>
       <div className="flex flex-col">
         <span className={`font-bold ${status === "active" ? "text-blue-600" : "text-gray-700"}`}>{title}</span>
         <span className="text-sm text-gray-500">{desc}</span>
       </div>
    </div>
  )
}
