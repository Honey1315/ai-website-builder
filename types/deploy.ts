export interface DeployConfig {
  githubToken?: string;
  vercelToken?: string;
  githubTokenId?: string;
  vercelTokenId?: string;
  repoName: string;
}

export interface GitHubDeployResult {
  repoUrl: string;
  repoFullName: string;
  repoId: number;
}

export interface VercelDeployResult {
  projectUrl: string;
  deploymentUrl: string;
  deploymentId: string;
}

export type DeploymentStatusEnum = 
  | 'QUEUED'
  | 'BUILDING'
  | 'READY'
  | 'CANCELED'
  | 'ERROR';

export interface DeploymentStatus {
  status: DeploymentStatusEnum;
  url: string;
  error?: string;
}

export type DeployState =
  | 'idle'
  | 'pushing_github'
  | 'creating_vercel'
  | 'deploying'
  | 'polling'
  | 'ready'
  | 'error';
