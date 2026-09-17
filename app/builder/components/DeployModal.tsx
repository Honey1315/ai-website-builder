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
      if (window.confirm("Deployment is in progress. Are you sure you want to abort?")) {
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
      <div className="absolute inset-0 bg-[#05080c]/80 backdrop-blur-md" onClick={handleClose}></div>
      <div className="relative w-full max-w-lg bg-secondary-900 border border-secondary-700 shadow-2xl rounded-none p-8 overflow-hidden flex flex-col gap-6">
        
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-primary-500 opacity-50 pointer-events-none"></div>

        <div className="flex justify-between items-center border-b border-secondary-800 pb-4">
          <div className="flex items-center gap-3">
             <span className="w-2 h-2 bg-primary-400 block animate-pulse"></span>
             <h2 className="text-[10px] font-mono text-primary-400 uppercase tracking-widest">Deployment Sequence</h2>
          </div>
          <button onClick={handleClose} className="text-secondary-500 hover:text-primary-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="square" strokeLinejoin="miter" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {state === "idle" && (
          <div className="flex flex-col gap-6 text-secondary-300">
             <div className="bg-primary-900/10 border border-primary-500/30 p-4 font-mono text-xs text-primary-400 uppercase tracking-wider leading-relaxed">
               <span className="font-bold text-primary-300">[SYS_REQ]</span> Vercel GitHub App authorization required for deployment protocol. <a href="https://github.com/apps/vercel" target="_blank" className="underline hover:text-white transition-colors block mt-1">Configure Authorization ↗</a>
             </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-end">
                <label className="text-[10px] font-mono uppercase tracking-widest text-secondary-500">GitHub Access Token</label>
                <a href="https://github.com/settings/tokens/new" target="_blank" className="text-[9px] font-mono uppercase tracking-widest text-primary-500 hover:text-primary-400 border-b border-transparent hover:border-primary-400 transition-colors">Generate ↗</a>
              </div>
              <input 
                type="password" 
                value={githubToken} 
                onChange={e => setGithubToken(e.target.value)}
                className="bg-[#0a0f16] border border-secondary-800 text-white font-mono text-sm p-3 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 rounded-none transition-colors"
                placeholder="ghp_..."
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-end">
                <label className="text-[10px] font-mono uppercase tracking-widest text-secondary-500">Vercel Access Token</label>
                <a href="https://vercel.com/account/tokens" target="_blank" className="text-[9px] font-mono uppercase tracking-widest text-primary-500 hover:text-primary-400 border-b border-transparent hover:border-primary-400 transition-colors">Generate ↗</a>
              </div>
              <input 
                type="password" 
                value={vercelToken} 
                onChange={e => setVercelToken(e.target.value)}
                className="bg-[#0a0f16] border border-secondary-800 text-white font-mono text-sm p-3 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 rounded-none transition-colors"
                placeholder="v1_..."
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-secondary-500">Repository Name</label>
              <input 
                type="text" 
                value={repoName} 
                onChange={e => setRepoName(e.target.value)}
                className="bg-[#0a0f16] border border-secondary-800 text-white font-mono text-sm p-3 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 rounded-none transition-colors"
              />
            </div>

            <label className="flex items-center gap-3 text-xs font-mono text-secondary-400 cursor-pointer mt-2 group">
              <div className={`w-4 h-4 border flex items-center justify-center transition-colors ${rememberTokens ? 'border-primary-400 bg-primary-500/20' : 'border-secondary-600 group-hover:border-primary-400'}`}>
                {rememberTokens && <div className="w-2 h-2 bg-primary-400"></div>}
              </div>
              <input 
                type="checkbox" 
                checked={rememberTokens} 
                onChange={e => setRememberTokens(e.target.checked)} 
                className="hidden"
              />
              <span className="uppercase tracking-widest">Persist credentials locally</span>
            </label>

            <button 
              onClick={handleDeploy} 
              disabled={!githubToken || !vercelToken || !repoName || files.length === 0}
              className="mt-6 bg-primary-500 hover:bg-primary-400 text-secondary-900 font-bold font-mono text-[10px] uppercase tracking-widest p-4 rounded-none transition-colors disabled:opacity-30 disabled:cursor-not-allowed border border-primary-500"
            >
              Execute Deployment _
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
               status={state === "creating_vercel" ? "active" : (state === "deploying" ? "done" : "pending")} 
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
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                 <path strokeLinecap="square" strokeLinejoin="miter" d="M4.5 12.75l6 6 9-13.5" />
               </svg>
             </div>
             <div>
               <h3 className="text-xl font-display text-white uppercase tracking-widest mb-2">System Online</h3>
               <p className="text-[10px] font-mono text-secondary-400 uppercase tracking-widest">Deployment completed successfully.</p>
             </div>
             
             <div className="flex flex-col gap-3 w-full mt-4">
               {vercelUrl && (
                 <a href={vercelUrl} target="_blank" className="w-full py-4 bg-primary-500 text-secondary-900 border border-primary-500 font-bold font-mono text-[10px] uppercase tracking-widest hover:bg-primary-400 transition-colors text-center">
                   Access Production Environment ↗
                 </a>
               )}
               {githubUrl && (
                 <a href={githubUrl} target="_blank" className="w-full py-4 bg-transparent border border-secondary-700 text-white font-mono text-[10px] uppercase tracking-widest hover:border-primary-400 hover:text-primary-400 transition-colors text-center">
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
               <h3 className="font-mono text-[10px] font-bold text-danger-500 uppercase tracking-widest">Deployment Failure</h3>
             </div>
             <p className="text-xs font-mono text-danger-400 break-words leading-relaxed">{error}</p>
             <button onClick={reset} className="bg-transparent border border-danger-500/50 text-danger-500 hover:bg-danger-500 hover:text-white px-6 py-3 font-mono text-[10px] uppercase tracking-widest w-fit mt-4 transition-colors">
               Reinitialize Protocol
             </button>
          </div>
        )}

      </div>
    </div>
  );
}

function StepItem({ status, title, desc }: { status: "pending" | "active" | "done", title: string, desc: string }) {
  return (
    <div className={`flex items-start gap-5 ${status === "active" ? "opacity-100" : (status === "done" ? "opacity-70" : "opacity-30")}`}>
       <div className={`w-8 h-8 flex items-center justify-center shrink-0 border mt-0.5
          ${status === "done" ? "bg-primary-500/10 border-primary-500 text-primary-400" : 
            (status === "active" ? "bg-transparent border-primary-400 text-primary-400" : "bg-transparent border-secondary-700 text-secondary-700")}
       `}>
          {status === "done" ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
            </svg>
          ) : (
             <div className={`w-2 h-2 ${status === "active" ? "bg-primary-400 animate-pulse" : "bg-secondary-700"}`} />
          )}
       </div>
       <div className="flex flex-col gap-1 mt-1">
         <span className={`font-mono text-[10px] uppercase tracking-widest font-bold ${status === "active" ? "text-primary-400" : "text-secondary-400"}`}>{title}</span>
         <span className="font-mono text-[9px] uppercase tracking-wider text-secondary-600">{desc}</span>
       </div>
    </div>
  )
}